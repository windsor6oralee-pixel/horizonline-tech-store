/** Ordered funnel of what a visitor can be doing, shared by the tracker and the admin panel. */
export const PRESENCE_STEPS = [
  { key: "home", label: "يتصفح الصفحة الرئيسية", short: "الرئيسية" },
  { key: "product", label: "يشاهد جهازاً", short: "صفحة منتج" },
  { key: "checkout:gift", label: "يختار الهديّة", short: "الهديّة" },
  { key: "checkout:plan", label: "يضبط خطة التقسيط", short: "الخطة" },
  { key: "checkout:eligibility", label: "في التأهل المبدئي", short: "التأهل" },
  { key: "checkout:delivery", label: "يدخل بيانات التوصيل", short: "التوصيل" },
  { key: "checkout:payment", label: "في صفحة الدفع", short: "الدفع" },
  { key: "checkout:done", label: "أتمّ الطلب", short: "طلب مكتمل" },
] as const;

export type PresenceStepKey = (typeof PRESENCE_STEPS)[number]["key"];
export const PRESENCE_STEP_KEYS = PRESENCE_STEPS.map(step => step.key) as PresenceStepKey[];

export const DEVICES = ["mobile", "tablet", "desktop"] as const;
export type Device = (typeof DEVICES)[number];
export const DEVICE_LABELS: Record<Device, string> = { mobile: "هاتف", tablet: "جهاز لوحي", desktop: "حاسوب" };

export function stepIndex(key: string): number {
  const index = PRESENCE_STEP_KEYS.indexOf(key as PresenceStepKey);
  return index === -1 ? 0 : index;
}

export function stepLabel(key: string): string {
  return PRESENCE_STEPS[stepIndex(key)].label;
}

/** A visitor is counted as online while their last heartbeat is within this window. */
export const PRESENCE_ONLINE_WINDOW_MS = 75_000;
export const PRESENCE_PING_INTERVAL_MS = 20_000;
