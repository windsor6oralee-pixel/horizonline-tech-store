import { SYRIAN_POUND_PER_USD } from "@shared/storeConstants";

export type InstallmentPlan = {
  priceUsd: number;
  priceSyp: number;
  downPaymentUsd: number;
  downPaymentSyp: number;
  discountPercent: number;
  discountUsd: number;
  financedUsd: number;
  months: number;
  monthlyUsd: number;
  monthlySyp: number;
};

export function calculateInstallmentPlan(
  priceUsd: number,
  downPaymentUsd: number,
  months: number,
): InstallmentPlan {
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error("سعر الهاتف غير صالح");
  if (![100, 150, 300].includes(downPaymentUsd)) throw new Error("الدفعة الأولى يجب أن تكون 100$ أو 150$ أو 300$");
  if (!Number.isInteger(months) || months < 12 || months > 48) throw new Error("مدة التقسيط يجب أن تكون بين 12 و48 شهراً");

  const discountPercent = downPaymentUsd === 300 ? 20 : downPaymentUsd === 150 ? 10 : 0;
  const discountUsd = Number((priceUsd * (discountPercent / 100)).toFixed(2));
  const financedUsd = Number(Math.max(priceUsd - discountUsd - downPaymentUsd, 0).toFixed(2));
  const monthlyUsd = Number((financedUsd / months).toFixed(2));

  return {
    priceUsd: Number(priceUsd.toFixed(2)),
    priceSyp: Math.round(priceUsd * SYRIAN_POUND_PER_USD),
    downPaymentUsd,
    downPaymentSyp: Math.round(downPaymentUsd * SYRIAN_POUND_PER_USD),
    discountPercent,
    discountUsd,
    financedUsd,
    months,
    monthlyUsd,
    monthlySyp: Math.round(monthlyUsd * SYRIAN_POUND_PER_USD),
  };
}

