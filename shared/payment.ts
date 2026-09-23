export const PAYMENT_SETTING_KEYS = {
  qrFileKey: "paymentQrFileKey",
  walletName: "paymentWalletName",
  walletId: "paymentWalletId",
  provider: "paymentWalletProvider",
  /** Syrian pounds per US dollar used to show the first payment in the currency Sham Cash actually moves. */
  sypRate: "paymentSypRate",
} as const;

/** "0" hides the WhatsApp button and footer link, keeping customers on the site while no one answers that channel. */
export const WHATSAPP_VISIBLE_KEY = "whatsappVisible";

/** Short reference the customer can write in the transfer note, derived from the follow-up row opened when they pressed "pay". */
export const paymentReferenceFor = (leadId: number) => `HZ-P${String(leadId).padStart(4, "0")}`;

export const formatSyp = (usd: number, rate: number) => new Intl.NumberFormat("ar-SY", { maximumFractionDigits: 0 }).format(Math.round(usd * rate));

export const PAYMENT_STATUS_LABELS = { pending: "قيد المراجعة", approved: "مؤكَّدة", rejected: "مرفوضة" } as const;
