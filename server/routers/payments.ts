import { nanoid } from "nanoid";
import { z } from "zod";
import {
  addConversationMessage, createConversation, findConversationByCustomer, getCustomerById,
  listAllCustomerPayments, reviewCustomerPayment,
} from "../db";
import { adminProcedure, router } from "../_core/trpc";

export const paymentsRouter = router({
  list: adminProcedure.query(async () => listAllCustomerPayments()),

  review: adminProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "rejected"]), note: z.string().trim().max(255).optional() }))
    .mutation(async ({ input }) => {
      await reviewCustomerPayment(input.id, input.status, input.note?.trim() || null);
      return { success: true } as const;
    }),

  /** Confirms the receipt and, in the same step, tells the customer what happens next. */
  approveAndNotify: adminProcedure
    .input(z.object({ id: z.number().int().positive(), message: z.string().trim().min(1).max(2000) }))
    .mutation(async ({ input }) => {
      const payment = (await listAllCustomerPayments()).find(row => row.id === input.id);
      if (!payment) throw new Error("الإيصال غير موجود");
      const customer = await getCustomerById(payment.customerId);
      if (!customer) throw new Error("حساب العميل غير موجود");

      await reviewCustomerPayment(input.id, "approved", "تم تأكيد الإيصال يدوياً وإرسال تعليمات الشحن");
      let conversation = await findConversationByCustomer(customer.id);
      if (!conversation) {
        conversation = await createConversation({
          token: nanoid(32), leadId: null, orderId: null, customerId: customer.id,
          customerName: customer.name, phone: customer.phone, productTitle: "طلب تقسيط",
        });
      }
      await addConversationMessage({ conversationId: conversation.id, sender: "admin", body: input.message });
      return { success: true } as const;
    }),
});
