import { SHAM_CASH_WHATSAPP_NUMBER, WHATSAPP_SETTING_KEY, isValidWhatsAppNumber, normalizeWhatsAppNumber } from "@shared/whatsapp";
import { z } from "zod";
import { getStoreSetting, setStoreSetting } from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

export async function resolveWhatsAppNumber(): Promise<string> {
  return (await getStoreSetting(WHATSAPP_SETTING_KEY)) ?? SHAM_CASH_WHATSAPP_NUMBER;
}

export const settingsRouter = router({
  public: publicProcedure.query(async () => ({ whatsappNumber: await resolveWhatsAppNumber() })),
  updateWhatsApp: adminProcedure
    .input(z.object({ whatsappNumber: z.string().trim().min(1).max(32) }))
    .mutation(async ({ input }) => {
      const digits = normalizeWhatsAppNumber(input.whatsappNumber);
      if (!isValidWhatsAppNumber(digits)) throw new Error("أدخل رقماً دولياً صحيحاً مع رمز الدولة، مثال: +1 272 746 2228");
      await setStoreSetting(WHATSAPP_SETTING_KEY, digits);
      return { whatsappNumber: digits } as const;
    }),
});
