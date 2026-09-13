export const SHAM_CASH_WHATSAPP_NUMBER = "12727462228";
export const WHATSAPP_DISPLAY_NUMBER = "+1 (272) 746-2228";
export const WHATSAPP_BUSINESS_LINK = "https://wa.me/message/3UUTCZIMZVROD1";
export const WHATSAPP_HANDLE = "@horizonlinetech";

export type WhatsAppOrderDetails = {
  customerName: string;
  productTitle: string;
  downPaymentUsd: number;
  months: number;
  monthlyInstallmentUsd: number;
};

export function createWhatsAppOrderLink(details: WhatsAppOrderDetails): string {
  const message = [
    "مرحباً هوريزون موبايل، أريد الحصول على معلومات دفع شام كاش عبر الوكيل.",
    `الاسم: ${details.customerName}`,
    `الهاتف المطلوب: ${details.productTitle}`,
    `قيمة الدفعة الأولى: $${details.downPaymentUsd}`,
    `مدة التقسيط: ${details.months} شهراً`,
    `القسط الشهري التقريبي: $${details.monthlyInstallmentUsd.toFixed(2)}`,
    "أرغب بالدفع الآن، يرجى إرسال التعليمات.",
  ].join("\n");

  return `https://wa.me/${SHAM_CASH_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
