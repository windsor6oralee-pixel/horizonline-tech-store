import { normalizeWhatsAppNumber } from "@shared/whatsapp";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  addConversationMessage, createConversation, createCustomer, createCustomerPayment, customerChatUnlocked,
  findConversationByCustomer, getCustomerById, getCustomerByPhone, getCustomerRecords, linkConversationsToCustomer,
  listConversationMessages, listCustomerPayments, proofHashInUse, touchCustomerLogin, transactionRefInUse,
} from "../db";
import { verifyReceipt } from "../receiptVerifier";
import { localReceiptProblem, sha256 } from "../imageCheck";
import { storagePut } from "../storage";
import { decodeDataUrl, safeFileName } from "../uploads";
import { readPaymentQrDataUrl, readPaymentSettings } from "./settings";
import { CUSTOMER_SESSION_COOKIE, SESSION_MAX_AGE_MS, createCustomerSession, hashPassword, verifyPassword } from "../customerAuth";
import { getSessionCookieOptions } from "../_core/cookies";
import { customerProcedure, publicProcedure, router } from "../_core/trpc";

/** Syrian mobile numbers are stored as digits only so "0991..." and "+963991..." are one account. */
const localPhone = (input: string) => {
  const digits = normalizeWhatsAppNumber(input);
  return digits.startsWith("963") ? `0${digits.slice(3)}` : digits;
};

const phoneInput = z.string().trim().min(8).max(32);
const passwordInput = z.string().min(6).max(200);

function dueAmount(records: Awaited<ReturnType<typeof getCustomerRecords>>): string | null {
  return records.orders[0]?.downPaymentUsd ?? records.leads[0]?.downPaymentUsd ?? null;
}

export const accountRouter = router({
  register: publicProcedure
    .input(z.object({ phone: phoneInput, name: z.string().trim().min(3).max(160), password: passwordInput }))
    .mutation(async ({ input, ctx }) => {
      const phone = localPhone(input.phone);
      if (phone.length < 8) throw new Error("أدخل رقم هاتف صحيح");
      if (await getCustomerByPhone(phone)) throw new Error("هذا الرقم مسجّل بالفعل — سجّل الدخول بدلاً من ذلك");

      const customer = await createCustomer({ phone, name: input.name, passwordHash: await hashPassword(input.password) });
      // Attach anything the store already recorded for this number.
      const records = await getCustomerRecords(phone);
      await linkConversationsToCustomer(customer.id, records.leads.map(lead => lead.id));

      const token = await createCustomerSession(customer.id);
      ctx.res.cookie(CUSTOMER_SESSION_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge: SESSION_MAX_AGE_MS });
      return { name: customer.name, phone: customer.phone } as const;
    }),

  login: publicProcedure
    .input(z.object({ phone: phoneInput, password: passwordInput }))
    .mutation(async ({ input, ctx }) => {
      const customer = await getCustomerByPhone(localPhone(input.phone));
      if (!customer || !(await verifyPassword(input.password, customer.passwordHash))) {
        throw new Error("رقم الهاتف أو كلمة المرور غير صحيحة");
      }
      await touchCustomerLogin(customer.id);
      const token = await createCustomerSession(customer.id);
      ctx.res.cookie(CUSTOMER_SESSION_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge: SESSION_MAX_AGE_MS });
      return { name: customer.name, phone: customer.phone } as const;
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(CUSTOMER_SESSION_COOKIE, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
    return { success: true } as const;
  }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.customerId) return null;
    const customer = await getCustomerById(ctx.customerId);
    return customer ? { name: customer.name, phone: customer.phone } : null;
  }),

  /** The customer's own orders, follow-ups and message thread. */
  overview: customerProcedure.query(async ({ ctx }) => {
    const customer = await getCustomerById(ctx.customerId);
    if (!customer) throw new Error("تعذر العثور على الحساب");
    const { orders, leads } = await getCustomerRecords(customer.phone);
    let conversation = await findConversationByCustomer(customer.id);
    if (!conversation) {
      conversation = await createConversation({
        token: nanoid(32),
        leadId: leads[0]?.id ?? null,
        orderId: orders[0]?.id ?? null,
        customerName: customer.name,
        phone: customer.phone,
        productTitle: orders[0]?.productTitle ?? leads[0]?.productTitle ?? "طلب تقسيط",
        customerId: customer.id,
      });
    }
    return {
      name: customer.name,
      phone: customer.phone,
      orders: orders.map(order => ({
        orderNumber: order.orderNumber, productTitle: order.productTitle, status: order.status,
        downPaymentUsd: order.downPaymentUsd, months: order.months,
        monthlyInstallmentUsd: order.monthlyInstallmentUsd, createdAt: order.createdAt,
      })),
      leads: leads.map(lead => ({
        id: lead.id, productTitle: lead.productTitle, downPaymentUsd: lead.downPaymentUsd,
        months: lead.months, checkoutStep: lead.checkoutStep, createdAt: lead.createdAt,
      })),
      chatUnlocked: await customerChatUnlocked(customer.id),
      messages: (await customerChatUnlocked(customer.id)) ? await listConversationMessages(conversation.id) : [],
    };
  }),

  /** Wallet details and the amount due; the QR is only ever returned to a signed-in customer with a record. */
  paymentInfo: customerProcedure.query(async ({ ctx }) => {
    const customer = await getCustomerById(ctx.customerId);
    if (!customer) throw new Error("تعذر العثور على الحساب");
    const records = await getCustomerRecords(customer.phone);
    const amountUsd = dueAmount(records);
    const payments = await listCustomerPayments(customer.id);
    const orderWithProof = records.orders.find(order => order.paymentProofKey);
    const latest = payments[0]
      ?? (orderWithProof ? { status: orderWithProof.paymentProofStatus, note: orderWithProof.paymentProofStatus === "approved" ? "أكّدت الإدارة دفعتك" : null, createdAt: orderWithProof.createdAt, amountUsd: orderWithProof.downPaymentUsd } : null);
    if (!amountUsd) return { hasOrder: false as const, latest: null, chatUnlocked: false };
    const settings = await readPaymentSettings();
    const showQr = !latest || latest.status === "rejected";
    return {
      hasOrder: true as const,
      amountUsd,
      productTitle: records.orders[0]?.productTitle ?? records.leads[0]?.productTitle ?? "",
      provider: settings.provider,
      walletName: settings.walletName,
      walletId: settings.walletId,
      qrDataUrl: showQr ? await readPaymentQrDataUrl() : null,
      latest: latest ? { status: latest.status, note: latest.note, createdAt: latest.createdAt, amountUsd: latest.amountUsd } : null,
      chatUnlocked: await customerChatUnlocked(customer.id),
    };
  }),

  uploadReceipt: customerProcedure
    .input(z.object({
      fileName: z.string().trim().min(1).max(160),
      mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
      dataUrl: z.string().min(20).max(4_500_000),
    }))
    .mutation(async ({ input, ctx }) => {
      const customer = await getCustomerById(ctx.customerId);
      if (!customer) throw new Error("تعذر العثور على الحساب");
      const records = await getCustomerRecords(customer.phone);
      const amountUsd = dueAmount(records);
      if (!amountUsd) throw new Error("لا يوجد طلب مرتبط بحسابك بعد");
      const bytes = decodeDataUrl(input.dataUrl, input.mimeType, 3 * 1024 * 1024, "إثبات الدفع");
      const problem = localReceiptProblem(bytes, input.mimeType);
      if (problem) throw new Error(problem);
      const fileHash = sha256(bytes);
      if (await proofHashInUse(fileHash)) throw new Error("هذا الإيصال مستخدم من قبل — ارفع إيصال التحويل الخاص بطلبك.");
      const stored = await storagePut(`customer-receipts/${customer.id}/${safeFileName(input.fileName, input.mimeType, "receipt")}`, bytes, input.mimeType);

      const settings = await readPaymentSettings();
      const recordCreatedAt = records.orders[0]?.createdAt ?? records.leads[0]?.createdAt ?? customer.createdAt;
      // PDFs are not read automatically; they wait for the admin.
      const result = input.mimeType === "application/pdf"
        ? { status: "pending" as const, note: "ملف PDF — بانتظار المراجعة اليدوية", verifiedBy: null, extracted: null }
        : await verifyReceipt({
            imageBase64: bytes.toString("base64"), mimeType: input.mimeType,
            expectedRecipient: settings.walletName, expectedAmountUsd: Number(amountUsd),
            recordCreatedAt: new Date(recordCreatedAt), isDuplicateRef: transactionRefInUse,
          });
      await createCustomerPayment({
        customerId: customer.id, amountUsd, fileKey: stored.key, fileName: input.fileName, mimeType: input.mimeType,
        status: result.status, note: result.note, verifiedBy: result.verifiedBy,
        transactionRef: result.extracted?.transaction_ref?.trim() || null,
        receiptAt: result.extracted?.transaction_datetime ? new Date(result.extracted.transaction_datetime + "+03:00") : null,
        recipientName: result.extracted?.recipient_name?.trim() || null,
        receiptAmountUsd: result.extracted ? result.extracted.amount.toFixed(2) : null,
        fileHash,
      });
      return { status: result.status, note: result.note } as const;
    }),

  sendMessage: customerProcedure
    .input(z.object({ body: z.string().trim().min(1).max(2000) }))
    .mutation(async ({ input, ctx }) => {
      if (!(await customerChatUnlocked(ctx.customerId))) throw new Error("تُفتح المحادثة بعد رفع إيصال دفعة أولى مقبول");
      const conversation = await findConversationByCustomer(ctx.customerId);
      if (!conversation) throw new Error("افتح صفحة حسابك أولاً");
      await addConversationMessage({ conversationId: conversation.id, sender: "customer", body: input.body });
      return { success: true } as const;
    }),
});
