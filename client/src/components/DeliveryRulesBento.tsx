import { ContractSignIcon, IdCheckIcon, NoCashOnDeliveryIcon, PrepaidIcon } from "./PolicyIcons";
import type { ReactNode } from "react";

const rules: { icon: ReactNode; title: string; text: string; alert?: boolean; wide?: boolean; fillRow?: boolean }[] = [
  {
    icon: <NoCashOnDeliveryIcon />,
    title: "استلام بلا نقود",
    text: "لا تحمل أي مبلغ يوم التسليم — المندوب لا يستلم نقوداً، لأن دفعتك مسجّلة قبل الشحن. حمايةً لك وللسائق وللجهاز.",
    alert: true,
    wide: true,
  },
  { icon: <PrepaidIcon />, title: "دفعة واحدة وتنتهي", text: "تثبّت طلبك عبر وكيل شام كاش، فيُشحن جهازك مؤمَّناً." },
  { icon: <IdCheckIcon />, title: "يصلك أنت شخصياً", text: "يتحقق المندوب من هويتك، فلا يستلم جهازك سواك." },
  { icon: <ContractSignIcon />, title: "حقوقك موثّقة بعقد", text: "تراجع بنود التقسيط وتوقّع نسختك عند الاستلام.", fillRow: true },
];

/** Bento of the four delivery rules, each with its own illustration. */
export default function DeliveryRulesBento() {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {rules.map(rule => (
      <article
        key={rule.title}
        className={`flex flex-col gap-3 rounded-[24px] border p-5 transition-transform duration-200 hover:-translate-y-0.5 ${
          rule.alert ? "border-[#8ad9e3] bg-[#f2fafd]" : "border-[#d6e5f0] bg-white"
        } ${rule.wide ? "sm:col-span-2 lg:col-span-3 sm:flex-row sm:items-center sm:gap-6" : ""} ${rule.fillRow ? "sm:col-span-2 lg:col-span-1" : ""}`}
      >
        <span className={`grid h-[84px] shrink-0 place-items-center rounded-2xl ${rule.alert ? "bg-white" : "bg-[#eff5fa]"} px-4 ${rule.wide ? "w-[140px]" : ""}`}>
          {rule.icon}
        </span>
        <div>
          <b className={`block text-base font-extrabold ${"text-[#0a2342]"}`}>{rule.title}</b>
          <p className="mt-1.5 text-xs leading-6 text-slate-500">{rule.text}</p>
        </div>
      </article>
    ))}
  </div>;
}
