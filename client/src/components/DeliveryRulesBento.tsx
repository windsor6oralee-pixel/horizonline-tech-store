import { ContractSignIcon, IdCheckIcon, NoCashOnDeliveryIcon, PrepaidIcon } from "./PolicyIcons";
import type { ReactNode } from "react";

const rules: { icon: ReactNode; title: string; text: string; alert?: boolean; wide?: boolean }[] = [
  {
    icon: <NoCashOnDeliveryIcon />,
    title: "لا تدفع للمندوب",
    text: "لا يُسلَّم أي مبلغ نقدي لمندوب الشحن إطلاقاً — تعليمات شركة الشحن حفاظاً على سلامة السائق والأجهزة.",
    alert: true,
    wide: true,
  },
  { icon: <PrepaidIcon />, title: "السداد قبل الشحن", text: "تُسدَّد الدفعة الأولى عبر وكيل شام كاش، ثم يُشحن الجهاز." },
  { icon: <IdCheckIcon />, title: "أبرز هويتك", text: "يطلب المندوب الهوية الشخصية للتأكد من المستلم." },
  { icon: <ContractSignIcon />, title: "راجع العقد ووقّعه", text: "اقرأ بنود التقسيط ووقّع النسخة عند الاستلام." },
];

/** Bento of the four delivery rules, each with its own illustration. */
export default function DeliveryRulesBento() {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {rules.map(rule => (
      <article
        key={rule.title}
        className={`flex flex-col gap-3 rounded-[24px] border p-5 transition-transform duration-200 hover:-translate-y-0.5 ${
          rule.alert ? "border-[#f0d7a4] bg-[#fffaf0]" : "border-[#d6e5f0] bg-white"
        } ${rule.wide ? "sm:col-span-2 lg:col-span-3 sm:flex-row sm:items-center sm:gap-6" : ""}`}
      >
        <span className={`grid shrink-0 place-items-center rounded-2xl ${rule.alert ? "bg-[#fdf1e6]" : "bg-[#eff5fa]"} px-3 py-2`}>
          {rule.icon}
        </span>
        <div>
          <b className={`block text-base font-extrabold ${rule.alert ? "text-[#a5301f]" : "text-[#0a2342]"}`}>{rule.title}</b>
          <p className="mt-1.5 text-xs leading-6 text-slate-500">{rule.text}</p>
        </div>
      </article>
    ))}
  </div>;
}
