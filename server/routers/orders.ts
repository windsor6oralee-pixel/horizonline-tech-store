import { nanoid } from "nanoid";
import { z } from "zod";
import { IDENTITY_DOCUMENT_TYPES, JOB_NATURE_OPTIONS } from "../../shared/storeConstants";
import { createIncompleteCheckoutLead, createInstallmentOrder, recordWhatsAppContact, getIncompleteCheckoutLeads, getInstallmentOrders, reviewInstallmentPaymentProof, updateIncompleteCheckoutLeadStatus, updateInstallmentOrderStatus } from "../db";
import { calculateInstallmentPlan } from "../installment";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { storageGetSignedUrl, storagePut } from "../storage";
import { localReceiptProblem, sha256 } from "../imageCheck";
import { verifyReceipt } from "../receiptVerifier";
import { readPaymentSettings } from "./settings";
import { addConversationMessage, createConversation, findConversationByCustomer, getCustomerByPhone, getInstallmentOrderById, proofHashInUse } from "../db";
import { nanoid as newToken } from "nanoid";

const orderInput = z.object({
  productTitle: z.string().trim().min(2).max(255),
  productHandle: z.string().trim().max(255).optional(),
  shopifyCartId: z.string().trim().max(255).optional(),
  gift: z.string().trim().min(2).max(120),
  priceUsd: z.number().positive().max(10_000),
  downPaymentUsd: z.union([z.literal(100), z.literal(150), z.literal(300)]),
  months: z.number().int().min(12).max(48),
  fullName: z.string().trim().min(3).max(160),
  age: z.number().int().min(18).max(80),
  jobNature: z.enum(JOB_NATURE_OPTIONS),
  hasExistingInstallments: z.enum(["yes", "no"]),
  identityDocument: z.object({
    documentType: z.enum(IDENTITY_DOCUMENT_TYPES),
    fileName: z.string().trim().min(1).max(160),
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
    dataUrl: z.string().min(20).max(5_800_000),
  }),
  province: z.string().trim().min(2).max(80),
  area: z.string().trim().min(2).max(120),
  landmark: z.string().trim().max(255).optional(),
  recipientName: z.string().trim().min(3).max(160),
  phone: z.string().trim().min(8).max(32),
  alternatePhone: z.string().trim().min(8).max(32).optional(),
  paymentMethod: z.literal("sham_cash"),
  /** Follow-up row opened when the customer pressed "pay"; closed as converted once the order lands. */
  paymentLeadId: z.number().int().positive().optional(),
  paymentProof: z.object({
    fileName: z.string().trim().min(1).max(160),
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
    dataUrl: z.string().min(20).max(4_500_000),
  }),
});

export const incompleteLeadInput = z.object({
  productTitle: z.string().trim().min(2).max(255),
  productHandle: z.string().trim().max(255).optional(),
  customerName: z.string().trim().min(3).max(160),
  phone: z.string().trim().min(8).max(32),
  province: z.string().trim().min(2).max(80),
  downPaymentUsd: z.union([z.literal(100), z.literal(150), z.literal(300)]),
  months: z.number().int().min(12).max(48),
  checkoutStep: z.enum(["payment", "delivery", "eligibility"]),
  consent: z.literal(true),
});

const MAX_PROOF_BYTES = 3 * 1024 * 1024;
const MAX_IDENTITY_DOCUMENT_BYTES = 4 * 1024 * 1024;

function decodePaymentProof(dataUrl: string, mimeType: string) {
  const match = /^data:([a-zA-Z0-9/+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match || match[1] !== mimeType) throw new Error("صيغة إثبات السداد غير صالحة");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > MAX_PROOF_BYTES) throw new Error("يجب ألا يتجاوز حجم إثبات السداد 3 ميغابايت");
  return bytes;
}

function decodeIdentityDocument(dataUrl: string, mimeType: string) {
  const match = /^data:([a-zA-Z0-9/+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match || match[1] !== mimeType) throw new Error("صيغة وثيقة الهوية غير صالحة");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > MAX_IDENTITY_DOCUMENT_BYTES) throw new Error("يجب ألا يتجاوز حجم وثيقة الهوية 4 ميغابايت");
  return bytes;
}

function safeFileName(fileName: string, mimeType: string) {
  const baseName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120) || "receipt";
  const extension = mimeType === "application/pdf" ? ".pdf" : mimeType === "image/png" ? ".png" : mimeType === "image/webp" ? ".webp" : ".jpg";
  return baseName.toLowerCase().endsWith(extension) ? baseName : `${baseName}${extension}`;
}

export const ordersRouter = router({
  submit: publicProcedure.input(orderInput).mutation(async ({ input, ctx }) => {
    const plan = calculateInstallmentPlan(input.priceUsd, input.downPaymentUsd, input.months);
    const orderNumber = `HZ-${Date.now().toString(36).toUpperCase()}-${nanoid(5).toUpperCase()}`;
    let proofBytes: Buffer;
    let identityDocumentBytes: Buffer;
    try {
      proofBytes = decodePaymentProof(input.paymentProof.dataUrl, input.paymentProof.mimeType);
      identityDocumentBytes = decodeIdentityDocument(input.identityDocument.dataUrl, input.identityDocument.mimeType);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "تعذر قراءة الوثائق المرفقة");
    }
    // Checks that need no external service: a real, legible image that has not been used before.
    const problem = localReceiptProblem(proofBytes, input.paymentProof.mimeType);
    if (problem) throw new Error(problem);
    const proofHash = sha256(proofBytes);
    if (await proofHashInUse(proofHash)) throw new Error("هذا الإيصال مستخدم في طلب سابق — ارفع إيصال التحويل الخاص بهذا الطلب.");

    // With an API key the receipt is also read and matched; without one it waits for the admin.
    let proofStatus: "pending" | "approved" | "rejected" = "pending";
    if (input.paymentProof.mimeType !== "application/pdf") {
      const settings = await readPaymentSettings();
      const result = await verifyReceipt({
        imageBase64: proofBytes.toString("base64"), mimeType: input.paymentProof.mimeType,
        expectedRecipient: settings.walletName, expectedAmountUsd: input.downPaymentUsd,
        recordCreatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), isDuplicateRef: async () => false,
      });
      if (result.status === "rejected") throw new Error(result.note ?? "تعذر قبول الإيصال");
      proofStatus = result.status;
    }

    const receipt = await storagePut(
      `payment-proofs/${orderNumber}/${safeFileName(input.paymentProof.fileName, input.paymentProof.mimeType)}`,
      proofBytes,
      input.paymentProof.mimeType,
    );
    const identityDocument = await storagePut(
      `identity-documents/${orderNumber}/${safeFileName(input.identityDocument.fileName, input.identityDocument.mimeType)}`,
      identityDocumentBytes,
      input.identityDocument.mimeType,
    );

    await createInstallmentOrder({
      orderNumber,
      userId: ctx.user?.id ?? null,
      shopifyCartId: input.shopifyCartId ?? null,
      productTitle: input.productTitle,
      productHandle: input.productHandle ?? null,
      gift: input.gift,
      priceUsd: plan.priceUsd.toFixed(2),
      priceSyp: plan.priceSyp.toString(),
      downPaymentUsd: plan.downPaymentUsd.toFixed(2),
      downPaymentSyp: plan.downPaymentSyp.toString(),
      discountPercent: plan.discountPercent,
      months: plan.months,
      monthlyInstallmentUsd: plan.monthlyUsd.toFixed(2),
      monthlyInstallmentSyp: plan.monthlySyp.toString(),
      eligibilityStatus: "eligible",
      status: "new",
      customerName: input.fullName,
      age: input.age,
      jobNature: input.jobNature,
      hasExistingInstallments: input.hasExistingInstallments,
      identityDocumentType: input.identityDocument.documentType,
      identityDocumentKey: identityDocument.key,
      identityDocumentName: input.identityDocument.fileName,
      identityDocumentMimeType: input.identityDocument.mimeType,
      province: input.province,
      area: input.area,
      landmark: input.landmark ?? null,
      recipientName: input.recipientName,
      phone: input.phone,
      alternatePhone: input.alternatePhone ?? null,
      paymentMethod: input.paymentMethod,
      paymentProofKey: receipt.key,
      paymentProofUrl: receipt.url,
      paymentProofName: input.paymentProof.fileName,
      paymentProofMimeType: input.paymentProof.mimeType,
      paymentProofHash: proofHash,
      paymentProofStatus: proofStatus,
      paymentProofReviewedAt: proofStatus === "pending" ? null : new Date(),
    });

    if (input.paymentLeadId) { try { await updateIncompleteCheckoutLeadStatus(input.paymentLeadId, "converted"); } catch { /* the order is what matters */ } }
    return { orderNumber, plan, status: "new" as const };
  }),

  saveIncomplete: publicProcedure.input(incompleteLeadInput).mutation(async ({ input }) => {
    await createIncompleteCheckoutLead({
      productTitle: input.productTitle,
      productHandle: input.productHandle ?? null,
      customerName: input.customerName,
      phone: input.phone,
      province: input.province,
      downPaymentUsd: input.downPaymentUsd.toFixed(2),
      months: input.months,
      checkoutStep: input.checkoutStep,
      status: "new",
      consentAt: new Date(),
    });
    return { success: true } as const;
  }),

  /** Called when a customer opens WhatsApp, so the chat still shows up as a follow-up in the panel. */
  logWhatsAppContact: publicProcedure
    .input(z.object({
      sessionId: z.string().trim().min(6).max(64),
      productTitle: z.string().trim().min(2).max(255),
      productHandle: z.string().trim().max(255).optional(),
      customerName: z.string().trim().max(160).optional(),
      phone: z.string().trim().max(32).optional(),
      province: z.string().trim().max(80).optional(),
      downPaymentUsd: z.union([z.literal(100), z.literal(150), z.literal(300)]),
      months: z.number().int().min(12).max(48),
      checkoutStep: z.enum(["payment", "delivery", "eligibility"]),
    }))
    .mutation(async ({ input }) => {
      await recordWhatsAppContact({
        sessionId: input.sessionId,
        productTitle: input.productTitle,
        productHandle: input.productHandle ?? null,
        customerName: input.customerName?.trim() || "زائر عبر واتساب",
        phone: input.phone?.trim() || null,
        province: input.province?.trim() || null,
        downPaymentUsd: input.downPaymentUsd.toFixed(2),
        months: input.months,
        checkoutStep: input.checkoutStep,
      });
      return { success: true } as const;
    }),

  incompleteList: adminProcedure.query(async () => getIncompleteCheckoutLeads()),

  updateIncompleteStatus: adminProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "contacted", "converted", "closed"]) }))
    .mutation(async ({ input }) => {
      await updateIncompleteCheckoutLeadStatus(input.id, input.status);
      return { success: true } as const;
    }),

  list: adminProcedure.query(async () => {
    const orders = await getInstallmentOrders();
    return Promise.all(orders.map(async order => {
      try {
        const identityDocumentUrl = order.identityDocumentKey ? await storageGetSignedUrl(order.identityDocumentKey) : null;
        return { ...order, identityDocumentUrl };
      } catch {
        return { ...order, identityDocumentUrl: null };
      }
    }));
  }),

  updateStatus: adminProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "under_review", "approved", "needs_contact", "cancelled"]) }))
    .mutation(async ({ input }) => {
      await updateInstallmentOrderStatus(input.id, input.status);
      return { success: true } as const;
    }),

  /** Final confirmation of an order's receipt, plus the shipping message to the customer's account thread (if they have one). */
  approveProofAndNotify: adminProcedure
    .input(z.object({ id: z.number().int().positive(), message: z.string().trim().min(1).max(2000) }))
    .mutation(async ({ input }) => {
      const order = await getInstallmentOrderById(input.id);
      if (!order) throw new Error("الطلب غير موجود");
      await reviewInstallmentPaymentProof(order.id, "approved");
      await updateInstallmentOrderStatus(order.id, "approved");
      const customer = await getCustomerByPhone(order.phone);
      if (!customer) return { notified: false } as const;
      let conversation = await findConversationByCustomer(customer.id);
      if (!conversation) {
        conversation = await createConversation({
          token: newToken(32), leadId: null, orderId: order.id, customerId: customer.id,
          customerName: customer.name, phone: customer.phone, productTitle: order.productTitle,
        });
      }
      await addConversationMessage({ conversationId: conversation.id, sender: "admin", body: input.message });
      return { notified: true } as const;
    }),

  reviewPaymentProof: adminProcedure
    .input(z.object({ id: z.number().int().positive(), decision: z.enum(["approved", "rejected"]) }))
    .mutation(async ({ input }) => {
      await reviewInstallmentPaymentProof(input.id, input.decision);
      return { success: true } as const;
    }),
});
