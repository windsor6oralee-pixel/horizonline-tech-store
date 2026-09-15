import { SHAM_CASH_WHATSAPP_NUMBER, WHATSAPP_SETTING_KEY, isValidWhatsAppNumber, normalizeWhatsAppNumber } from "@shared/whatsapp";
import { z } from "zod";
import { getStoreSetting, listTables, migrationState, setStoreSetting } from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

export async function resolveWhatsAppNumber(): Promise<string> {
  return (await getStoreSetting(WHATSAPP_SETTING_KEY)) ?? SHAM_CASH_WHATSAPP_NUMBER;
}

export const settingsRouter = router({
  dbStatus: adminProcedure.query(async () => {
    let tables: string[] = []; let tablesError: string | null = null;
    try { tables = await listTables(); } catch (error) { tablesError = (error as Error).message; }
    let databaseHost: string | null = null;
    try { const url = new URL(process.env.DATABASE_URL ?? ""); databaseHost = `${url.hostname}:${url.port || "3306"}${url.pathname}`; } catch { /* unset or malformed */ }
    return { migration: migrationState, tables, tablesError, cwd: process.cwd(), databaseHost };
  }),
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
