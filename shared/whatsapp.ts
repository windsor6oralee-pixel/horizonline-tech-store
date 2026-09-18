export const SHAM_CASH_WHATSAPP_NUMBER = "12727462228";
export const WHATSAPP_HANDLE = "@horizonlinetech";
export const WHATSAPP_SETTING_KEY = "whatsappNumber";

/** Digits only, international format without "+" or leading "00". */
export function normalizeWhatsAppNumber(input: string): string {
  return input.replace(/\D/g, "").replace(/^00/, "");
}

export function isValidWhatsAppNumber(digits: string): boolean {
  return /^[1-9]\d{7,14}$/.test(digits);
}

export const formatWhatsAppNumber = (digits: string) => `+${digits}`;
export const whatsAppChatLink = (digits: string) => `https://wa.me/${digits}`;

export type WhatsAppOrderDetails = {
  customerName: string;
  productTitle: string;
  downPaymentUsd: number;
  months: number;
  monthlyInstallmentUsd: number;
};

export function createWhatsAppOrderLink(details: WhatsAppOrderDetails, number: string = SHAM_CASH_WHATSAPP_NUMBER): string {
  const message = [
    "مرحباً هوريزون موبايل، أريد الحصول على معلومات دفع شام كاش عبر الوكيل.",
    `الاسم: ${details.customerName}`,
    `الهاتف المطلوب: ${details.productTitle}`,
    `قيمة الدفعة الأولى: $${details.downPaymentUsd}`,
    `مدة التقسيط: ${details.months} شهراً`,
    `القسط الشهري التقريبي: $${details.monthlyInstallmentUsd.toFixed(2)}`,
    "أرغب بالدفع الآن، يرجى إرسال التعليمات.",
  ].join("\n");

  return `${whatsAppChatLink(number)}?text=${encodeURIComponent(message)}`;
}

/** Message for the floating chat button shown once a customer is pre-qualified. */
export function createWhatsAppInquiryLink(details: WhatsAppOrderDetails, number: string = SHAM_CASH_WHATSAPP_NUMBER): string {
  const message = [
    "مرحباً هوريزون موبايل،",
    "ظهر لي أني مؤهل مبدئياً للتقسيط وأريد الاستفسار قبل إكمال الطلب.",
    details.customerName ? `الاسم: ${details.customerName}` : "",
    `الجهاز: ${details.productTitle}`,
    `الدفعة الأولى: $${details.downPaymentUsd}`,
    `مدة التقسيط: ${details.months} شهراً`,
    `القسط الشهري التقريبي: $${details.monthlyInstallmentUsd.toFixed(2)}`,
  ].filter(Boolean).join("\n");

  return `${whatsAppChatLink(number)}?text=${encodeURIComponent(message)}`;
}
