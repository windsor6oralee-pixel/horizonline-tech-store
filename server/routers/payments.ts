import { z } from "zod";
import { listAllCustomerPayments, reviewCustomerPayment } from "../db";
import { adminProcedure, router } from "../_core/trpc";

export const paymentsRouter = router({
  list: adminProcedure.query(async () => listAllCustomerPayments()),
  review: adminProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "rejected"]), note: z.string().trim().max(255).optional() }))
    .mutation(async ({ input }) => {
      await reviewCustomerPayment(input.id, input.status, input.note?.trim() || null);
      return { success: true } as const;
    }),
});
