import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ENV } from "./_core/env";

/** Syria is UTC+3 all year; receipts print local time. */
const SYRIA_OFFSET_MS = 3 * 60 * 60 * 1000;
/** Tolerance for clock drift between the wallet app and the order timestamp. */
const SLACK_MS = 30 * 60 * 1000;

const Extracted = z.object({
  is_payment_receipt: z.boolean().describe("true only if the image is a wallet transfer receipt/confirmation"),
  provider: z.string().describe("wallet/app name as printed, e.g. شام كاش; empty if unknown"),
  transaction_ref: z.string().describe("transaction/operation number as printed; empty if absent"),
  transaction_datetime: z.string().describe("date and time of the transaction as printed, ISO 8601 without timezone (YYYY-MM-DDTHH:MM:SS); empty if absent"),
  sender_name: z.string(),
  recipient_name: z.string().describe("the receiver's name exactly as printed"),
  amount: z.number().describe("numeric amount; 0 if absent"),
  currency: z.string().describe("currency symbol or code as printed, e.g. $, USD, SYP"),
  confidence: z.number().min(0).max(1).describe("how legible and complete the receipt is"),
  concerns: z.string().describe("anything that looks edited, cropped, inconsistent or unreadable; empty if none"),
});
export type ExtractedReceipt = z.infer<typeof Extracted>;

export type VerificationInput = {
  imageBase64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  expectedRecipient: string;
  expectedAmountUsd: number;
  /** When the customer's order/follow-up was created; the transfer cannot predate it. */
  recordCreatedAt: Date;
  /** Same transaction number already accepted for another receipt. */
  isDuplicateRef: (ref: string) => Promise<boolean>;
};

export type VerificationResult = {
  status: "approved" | "rejected" | "pending";
  note: string | null;
  verifiedBy: "auto" | null;
  extracted: ExtractedReceipt | null;
};

/** Collapses spelling variants so "هيثم يوسف سعيد" matches however the app renders it. */
export function normalizeArabicName(value: string): string {
  return value
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/[ىئ]/g, "ي").replace(/ؤ/g, "و")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function namesMatch(expected: string, actual: string): boolean {
  const want = normalizeArabicName(expected).split(" ").filter(Boolean);
  const have = new Set(normalizeArabicName(actual).split(" ").filter(Boolean));
  return want.length > 0 && want.every(token => have.has(token));
}

/** Receipt timestamps are printed in Syria local time; convert to UTC for comparison. */
function parseReceiptTime(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value.trim());
  if (!m) return null;
  const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0)) - SYRIA_OFFSET_MS;
  return Number.isFinite(utc) ? new Date(utc) : null;
}

export async function verifyReceipt(input: VerificationInput): Promise<VerificationResult> {
  if (!ENV.anthropicApiKey) {
    return { status: "pending", note: "بانتظار المراجعة اليدوية (التحقق الآلي غير مفعّل)", verifiedBy: null, extracted: null };
  }

  let extracted: ExtractedReceipt | null = null;
  try {
    const client = new Anthropic({ apiKey: ENV.anthropicApiKey });
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2048,
      output_config: { effort: "low", format: zodOutputFormat(Extracted) },
      system: "You read Syrian mobile-wallet transfer receipts (Sham Cash, Syriatel Cash, MTN Cash). Transcribe exactly what is printed; never guess missing fields. Arabic labels: العملية = operation, رقم = number, تاريخ العملية = transaction date, اسم المرسل = sender, اسم المستلم = recipient, المبلغ = amount.",
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: input.mimeType, data: input.imageBase64 } },
          { type: "text", text: "Extract the receipt fields." },
        ],
      }],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return { status: "pending", note: "تعذّرت قراءة الإيصال آلياً — بانتظار المراجعة اليدوية", verifiedBy: null, extracted: null };
    }
    extracted = response.parsed_output;
  } catch (error) {
    console.warn("[Receipt] verification call failed:", error instanceof Error ? error.message : error);
    return { status: "pending", note: "تعذّر التحقق الآلي مؤقتاً — بانتظار المراجعة اليدوية", verifiedBy: null, extracted: null };
  }

  const reject = (note: string): VerificationResult => ({ status: "rejected", note, verifiedBy: "auto", extracted });
  const manual = (note: string): VerificationResult => ({ status: "pending", note, verifiedBy: null, extracted });

  if (!extracted.is_payment_receipt) return reject("الصورة المرفوعة ليست إيصال تحويل من محفظة إلكترونية.");
  if (extracted.confidence < 0.6) return manual("الإيصال غير واضح بما يكفي للتحقق الآلي — بانتظار المراجعة اليدوية");

  if (!extracted.recipient_name.trim()) return reject("لم يظهر اسم المستلم في الإيصال.");
  if (!namesMatch(input.expectedRecipient, extracted.recipient_name)) {
    return reject(`اسم المستلم في الإيصال (${extracted.recipient_name}) لا يطابق محفظة المتجر (${input.expectedRecipient}).`);
  }

  const at = parseReceiptTime(extracted.transaction_datetime);
  if (!at) return manual("تاريخ العملية غير مقروء — بانتظار المراجعة اليدوية");
  const now = Date.now();
  if (at.getTime() < input.recordCreatedAt.getTime() - SLACK_MS) {
    return reject("تاريخ التحويل أقدم من تاريخ طلبك — يجب أن تكون الدفعة بعد تقديم الطلب.");
  }
  if (at.getTime() > now + SLACK_MS) return reject("تاريخ التحويل في المستقبل.");

  if (extracted.transaction_ref.trim() && await input.isDuplicateRef(extracted.transaction_ref.trim())) {
    return reject("رقم العملية مستخدم في إيصال سابق.");
  }

  if (extracted.concerns.trim()) return manual(`ملاحظة من الفحص الآلي: ${extracted.concerns.trim().slice(0, 160)}`);

  const diff = Math.abs(extracted.amount - input.expectedAmountUsd);
  const isUsd = /\$|usd|دولار/i.test(extracted.currency);
  if (!isUsd || diff > 0.5) {
    return manual(`المبلغ في الإيصال ${extracted.amount} ${extracted.currency} والمطلوب $${input.expectedAmountUsd} — بانتظار المراجعة اليدوية`);
  }

  return { status: "approved", note: "تم التحقق آلياً: المستلم والتاريخ والمبلغ مطابقة.", verifiedBy: "auto", extracted };
}
