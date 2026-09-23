import { normalizeWhatsAppNumber } from "@shared/whatsapp";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  addConversationMessage, createConversation, createCustomer, findConversationByCustomer,
  getCustomerById, getCustomerByPhone, getCustomerRecords, linkConversationsToCustomer,
  listConversationMessages, touchCustomerLogin,
} from "../db";
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
      messages: await listConversationMessages(conversation.id),
    };
  }),

  sendMessage: customerProcedure
    .input(z.object({ body: z.string().trim().min(1).max(2000) }))
    .mutation(async ({ input, ctx }) => {
      const conversation = await findConversationByCustomer(ctx.customerId);
      if (!conversation) throw new Error("افتح صفحة حسابك أولاً");
      await addConversationMessage({ conversationId: conversation.id, sender: "customer", body: input.body });
      return { success: true } as const;
    }),
});
