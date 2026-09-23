import { CheckCircle2, PackageCheck, PhoneCall, QrCode } from "lucide-react";

const steps = [
  {
    icon: CheckCircle2,
    title: "تم حفظ طلبك وإيصال دفعتك",
    text: "طلبك ووثائقك ولقطة التحويل محفوظة لدينا، ولا حاجة لأي إجراء منك الآن.",
    state: "done" as const,
  },
  {
    icon: QrCode,
    title: "تراجع الإدارة إيصالك وتؤكد الدفعة",
    text: "عادةً خلال ساعات. أنشئ حسابك برقم هاتفك لتتابع التأكيد وتراسلنا مباشرة.",
    state: "next" as const,
  },
  {
    icon: PhoneCall,
    title: "يتواصل معك مندوب DHL",
    text: "لتأكيد العنوان وموعد التسليم بعد تجهيز الجهاز.",
    state: "later" as const,
  },
  {
    icon: PackageCheck,
    title: "جهازك بين يديك",
    text: "من 24 ساعة في حمص إلى بضعة أيام للمحافظات البعيدة — وتستلمه بلا نقود.",
    state: "later" as const,
  },
];

/** What happens after the order is placed, as a reassuring timeline. */
export default function OrderNextSteps() {
  return <section className="next-steps relative mx-auto mt-7 max-w-lg text-right">
    <p className="text-sm font-extrabold text-[#0a2342]">ماذا يحدث الآن؟</p>
    <ol className="relative mt-4 space-y-5 pr-7">
      <span aria-hidden="true" className="next-steps-line absolute bottom-4 right-[13px] top-3 w-0.5 rounded bg-gradient-to-b from-[#8ad9e3] to-[#e2eef7]" />
      {steps.map(step => (
        <li key={step.title} className="relative">
          <span
            className={`absolute -right-7 top-0 grid h-7 w-7 place-items-center rounded-full ring-4 ring-white ${
              step.state === "done" ? "bg-[#15915f] text-white"
                : step.state === "next" ? "next-step-soon bg-[#0a2342] text-[#8ad9e3]"
                : "bg-[#e2eef7] text-[#1f6f96]"
            }`}
          >
            <step.icon className="h-4 w-4" />
          </span>
          <b className={`block text-[13px] font-extrabold ${step.state === "later" ? "text-slate-600" : "text-[#0a2342]"}`}>{step.title}</b>
          <p className="mt-1 text-xs leading-6 text-slate-500">{step.text}</p>
        </li>
      ))}
    </ol>
  </section>;
}
