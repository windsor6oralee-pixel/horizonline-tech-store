export const SHAM_CASH_WHATSAPP_NUMBER = "963959968133";

export type WhatsAppOrderDetails = {
  customerName: string;
  productTitle: string;
  downPaymentUsd: number;
  months: number;
  monthlyInstallmentUsd: number;
};

export function createWhatsAppOrderLink(details: WhatsAppOrderDetails): string {
  const message = [
    "مرحباً Horizonline Tech Store، أريد الحصول على معلومات دفع شام كاش عبر الوكيل.",
    `الاسم: ${details.customerName}`,
    `الهاتف المطلوب: ${details.productTitle}`,
    `قيمة الدفعة الأولى: $${details.downPaymentUsd}`,
    `مدة التقسيط: ${details.months} شهراً`,
    `القسط الشهري التقريبي: $${details.monthlyInstallmentUsd.toFixed(2)}`,
    "أرغب بالدفع الآن، يرجى إرسال التعليمات.",
  ].join("\n");

  return `https://wa.me/${SHAM_CASH_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
