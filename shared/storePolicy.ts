/** Single source of truth for the payment rules shown across the store. */
export const STORE_POLICY = {
  online: "التقسيط والطلب عبر الموقع الإلكتروني فقط.",
  prepaid: "تُسدَّد الدفعة الأولى عبر وكيل شام كاش قبل شحن الجهاز.",
  noCod: "لا يوجد دفع عند الاستلام — لا تُسلَّم أي مبالغ نقدية لمندوب الشحن.",
  noCodReason: "بحسب تعليمات شركة الشحن، حفاظاً على سلامة السائق والأجهزة.",
  cashInStore: "الشراء نقداً متاح في المحل فقط: حمص - بقرب مستشفى الأمين وجامعة حمص.",
  shortLine: "لا يوجد دفع عند الاستلام · التقسيط عبر الموقع فقط · الكاش في المحل فقط",
} as const;

/** Appended to WhatsApp messages so the rule is stated before the customer asks. */
export const WHATSAPP_POLICY_LINE = "علماً أن الدفعة الأولى تُسدَّد عبر شام كاش قبل الشحن، وأنه لا يوجد دفع نقدي عند الاستلام.";
