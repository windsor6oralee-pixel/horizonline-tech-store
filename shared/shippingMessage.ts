/** Default delivery window by how far the province is from the Homs store. */
export function etaForProvince(province: string): string {
  const p = province.trim();
  if (p === "حمص") return "24 ساعة";
  if (["حماة", "طرطوس", "اللاذقية", "دمشق", "ريف دمشق"].includes(p)) return "24-48 ساعة";
  if (["حلب", "إدلب", "درعا", "السويداء", "القنيطرة"].includes(p)) return "2-3 أيام عمل";
  return "3-5 أيام عمل";
}

export const DELIVERY_ETAS = [
  { value: "24 ساعة", label: "24 ساعة (حمص)" },
  { value: "24-48 ساعة", label: "24–48 ساعة (حمص والمدن القريبة)" },
  { value: "2-3 أيام عمل", label: "2–3 أيام عمل" },
  { value: "3-5 أيام عمل", label: "3–5 أيام عمل (المناطق البعيدة)" },
] as const;

/** What the customer reads the moment the admin confirms their down payment. */
export function shippingMessage(input: { customerName: string; eta: string }): string {
  return [
    `مرحباً ${input.customerName}، تم تأكيد دفعتك الأولى ✅`,
    "",
    "ما يحدث الآن:",
    "1. نجهّز جهازك ونسلّمه لشركة الشحن خلال 24 ساعة.",
    "2. يتواصل معك مندوب DHL على رقمك لتأكيد العنوان وموعد التسليم.",
    `3. يصلك الجهاز خلال ${input.eta}.`,
    "",
    "عند الاستلام: أبرز هويتك الشخصية للمندوب وراجع العقد ووقّعه. لا تدفع أي مبلغ للمندوب — دفعتك مسجّلة مسبقاً.",
    "لأي سؤال، راسلنا هنا مباشرة.",
  ].join("\n");
}
