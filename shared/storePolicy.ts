/**
 * Single source of truth for how payment and delivery work.
 * Written as reassurance: each rule leads with what the customer gains,
 * then states the fact plainly so nothing is ambiguous.
 */
export const STORE_POLICY = {
  title: "استلامك مضمون: هكذا يصلك جهازك",
  noCash: "استلام بلا نقود — المندوب لا يستلم أي مبلغ.",
  noCashReason: "دفعتك تكون مسجّلة قبل الشحن، فلا تحمل مالاً يوم التسليم. سياسة شركة الشحن، حمايةً لك وللسائق وللجهاز.",
  prepaid: "تثبّت طلبك بالدفعة الأولى عبر وكيل شام كاش، فيُشحن جهازك مؤمَّناً.",
  online: "التقسيط يُنجَز كاملاً من الموقع خلال دقائق — بلا زيارة ولا أوراق.",
  cashInStore: "تفضّل الشراء نقداً؟ أهلاً بك في محلنا: حمص - بقرب مستشفى الأمين وجامعة حمص.",
  shortLine: "استلام بلا نقود · دفعتك مسجّلة قبل الشحن · التقسيط من الموقع",
} as const;

/** Appended to WhatsApp messages so the customer already has the answer. */
export const WHATSAPP_POLICY_LINE = "أعلم أن الدفعة الأولى تُسدَّد عبر شام كاش قبل الشحن، وأن الاستلام يتم بلا نقود.";
