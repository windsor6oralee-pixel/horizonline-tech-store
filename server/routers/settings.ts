import { SHAM_CASH_WHATSAPP_NUMBER, WHATSAPP_SETTING_KEY, isValidWhatsAppNumber, normalizeWhatsAppNumber } from "@shared/whatsapp";
import { PAYMENT_SETTING_KEYS, WHATSAPP_VISIBLE_KEY, paymentReferenceFor } from "@shared/payment";
import { SYRIAN_POUND_PER_USD } from "@shared/storeConstants";
import { z } from "zod";
import { createIncompleteCheckoutLead, getStoredFile } from "../db";
import { storagePut } from "../storage";
import { decodeDataUrl } from "../uploads";
import { getStoreSetting, listTables, migrationState, setStoreSetting } from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

export async function resolveWhatsAppNumber(): Promise<string> {
  return (await getStoreSetting(WHATSAPP_SETTING_KEY)) ?? SHAM_CASH_WHATSAPP_NUMBER;
}

export async function readPaymentSettings() {
  const [qrFileKey, walletName, walletId, provider, rate] = await Promise.all([
    getStoreSetting(PAYMENT_SETTING_KEYS.qrFileKey), getStoreSetting(PAYMENT_SETTING_KEYS.walletName),
    getStoreSetting(PAYMENT_SETTING_KEYS.walletId), getStoreSetting(PAYMENT_SETTING_KEYS.provider),
    getStoreSetting(PAYMENT_SETTING_KEYS.sypRate),
  ]);
  const sypRate = Number(rate) > 0 ? Number(rate) : SYRIAN_POUND_PER_USD;
  return { qrFileKey, walletName: walletName ?? "", walletId: walletId ?? "", provider: provider ?? "شام كاش", sypRate };
}

/** The QR as a data URL, so it travels only inside authenticated responses and never sits on a public path. */
export async function readPaymentQrDataUrl(): Promise<string | null> {
  const { qrFileKey } = await readPaymentSettings();
  if (!qrFileKey) return null;
  const file = await getStoredFile(qrFileKey);
  return file ? `data:${file.mimeType};base64,${Buffer.from(file.data).toString("base64")}` : null;
}

/** Per-IP throttle for the checkout QR: a visitor who has filled the form is the only intended caller. */
const gateHits = new Map<string, number[]>();
function throttled(ip: string, limit = 20, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const hits = (gateHits.get(ip) ?? []).filter(t => now - t < windowMs);
  hits.push(now); gateHits.set(ip, hits);
  if (gateHits.size > 5000) gateHits.clear();
  return hits.length > limit;
}

export const settingsRouter = router({
  /**
   * Wallet details for step 5 of checkout. Only reachable once the order form carries a name, phone and province.
   * Pressing "pay" also opens a follow-up row, so a customer who transfers money and then loses the page has a
   * written trace (name, phone, product, amount) and a reference to quote — the admin can match the wallet notification to it.
   */
  paymentGate: publicProcedure
    .input(z.object({
      fullName: z.string().trim().min(3).max(160), phone: z.string().trim().min(8).max(32), province: z.string().trim().min(2).max(80),
      productTitle: z.string().trim().min(2).max(255).optional(), productHandle: z.string().trim().max(255).optional(),
      downPaymentUsd: z.union([z.literal(100), z.literal(150), z.literal(300)]).optional(), months: z.number().int().min(12).max(48).optional(),
      /** A reference already issued in this browser: re-use it instead of opening a second follow-up row. */
      leadId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ip = String(ctx.req.headers["x-forwarded-for"] ?? ctx.req.socket?.remoteAddress ?? "").split(",")[0].trim();
      if (throttled(ip)) throw new Error("محاولات كثيرة — حاول بعد قليل");
      const settings = await readPaymentSettings();
      let leadId = input.leadId ?? null;
      if (!leadId && input.productTitle && input.downPaymentUsd && input.months) {
        try {
          leadId = await createIncompleteCheckoutLead({
            productTitle: input.productTitle, productHandle: input.productHandle ?? null, customerName: input.fullName, phone: input.phone, province: input.province,
            downPaymentUsd: input.downPaymentUsd.toFixed(2), months: input.months, checkoutStep: "payment", status: "new", source: "form", consentAt: new Date(),
          });
        } catch { leadId = null; }
      }
      return {
        provider: settings.provider, walletName: settings.walletName, walletId: settings.walletId, sypRate: settings.sypRate,
        qrDataUrl: await readPaymentQrDataUrl(), customer: input.fullName, leadId, reference: leadId ? paymentReferenceFor(leadId) : null,
      };
    }),

  paymentSettings: adminProcedure.query(async () => ({ ...(await readPaymentSettings()), qrDataUrl: await readPaymentQrDataUrl() })),

  updatePaymentSettings: adminProcedure
    .input(z.object({
      walletName: z.string().trim().max(160),
      walletId: z.string().trim().max(160),
      provider: z.string().trim().min(1).max(60),
      sypRate: z.number().int().min(100).max(1_000_000).optional(),
      qr: z.object({ fileName: z.string().trim().min(1).max(160), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), dataUrl: z.string().min(20).max(3_000_000) }).optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.qr) {
        const bytes = decodeDataUrl(input.qr.dataUrl, input.qr.mimeType, 2 * 1024 * 1024, "صورة الرمز");
        const stored = await storagePut(`payment-qr/wallet-qr.${input.qr.mimeType === "image/png" ? "png" : input.qr.mimeType === "image/webp" ? "webp" : "jpg"}`, bytes, input.qr.mimeType);
        await setStoreSetting(PAYMENT_SETTING_KEYS.qrFileKey, stored.key);
      }
      await setStoreSetting(PAYMENT_SETTING_KEYS.walletName, input.walletName);
      await setStoreSetting(PAYMENT_SETTING_KEYS.walletId, input.walletId);
      await setStoreSetting(PAYMENT_SETTING_KEYS.provider, input.provider);
      if (input.sypRate) await setStoreSetting(PAYMENT_SETTING_KEYS.sypRate, String(input.sypRate));
      return { success: true } as const;
    }),

  dbStatus: adminProcedure.query(async () => {
    let tables: string[] = []; let tablesError: string | null = null;
    try { tables = await listTables(); } catch (error) { tablesError = (error as Error).message; }
    let databaseHost: string | null = null;
    try { const url = new URL(process.env.DATABASE_URL ?? ""); databaseHost = `${url.hostname}:${url.port || "3306"}${url.pathname}`; } catch { /* unset or malformed */ }
    return { migration: migrationState, tables, tablesError, cwd: process.cwd(), databaseHost };
  }),
  public: publicProcedure.query(async () => ({ whatsappNumber: await resolveWhatsAppNumber(), sypRate: (await readPaymentSettings()).sypRate, whatsappVisible: (await getStoreSetting(WHATSAPP_VISIBLE_KEY)) !== "0" })),
  setWhatsAppVisible: adminProcedure.input(z.object({ visible: z.boolean() })).mutation(async ({ input }) => { await setStoreSetting(WHATSAPP_VISIBLE_KEY, input.visible ? "1" : "0"); return { visible: input.visible } as const; }),
  updateWhatsApp: adminProcedure
    .input(z.object({ whatsappNumber: z.string().trim().min(1).max(32) }))
    .mutation(async ({ input }) => {
      const digits = normalizeWhatsAppNumber(input.whatsappNumber);
      if (!isValidWhatsAppNumber(digits)) throw new Error("أدخل رقماً دولياً صحيحاً مع رمز الدولة، مثال: +1 272 746 2228");
      await setStoreSetting(WHATSAPP_SETTING_KEY, digits);
      return { whatsappNumber: digits } as const;
    }),
});
