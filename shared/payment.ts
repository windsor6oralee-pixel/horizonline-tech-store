export const PAYMENT_SETTING_KEYS = {
  qrFileKey: "paymentQrFileKey",
  walletName: "paymentWalletName",
  walletId: "paymentWalletId",
  provider: "paymentWalletProvider",
} as const;

export const PAYMENT_STATUS_LABELS = { pending: "قيد المراجعة", approved: "مؤكَّدة", rejected: "مرفوضة" } as const;
