import { STORE_POLICY } from "@shared/storePolicy";
import { Globe, ShieldCheck, Store, WalletCards } from "lucide-react";
import { NoCashOnDeliveryIcon } from "./PolicyIcons";

/** How payment and delivery work. Framed as protection rather than a warning. */
export default function PaymentPolicyNotice({ variant = "full", className = "" }: { variant?: "full" | "compact"; className?: string }) {
  if (variant === "compact") {
    return <p className={`flex items-start gap-2 rounded-xl border border-[#cce6ef] bg-[#f2fafd] px-3 py-2.5 text-[11px] font-bold leading-5 text-[#165a7c] ${className}`}>
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1f6f96]" />
      {STORE_POLICY.shortLine}
    </p>;
  }

  return <section className={`policy-notice overflow-hidden rounded-2xl border border-[#cce6ef] bg-white ${className}`}>
    <p className="flex items-center gap-2 bg-[#0a2342] px-4 py-3 text-sm font-extrabold text-white">
      <ShieldCheck className="policy-shield h-4 w-4 text-[#8ad9e3]" />
      {STORE_POLICY.title}
    </p>
    <ul className="space-y-3 p-4 text-xs leading-6 text-slate-500">
      <li className="flex items-center gap-3 rounded-xl bg-[#f2fafd] p-3">
        <NoCashOnDeliveryIcon />
        <span><b className="block text-[13px] text-[#0a2342]">{STORE_POLICY.noCash}</b>{STORE_POLICY.noCashReason}</span>
      </li>
      <li className="flex items-start gap-3">
        <WalletCards className="mt-0.5 h-4 w-4 shrink-0 text-[#1f6f96]" />
        <span>{STORE_POLICY.prepaid}</span>
      </li>
      <li className="flex items-start gap-3">
        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[#1f6f96]" />
        <span>{STORE_POLICY.online}</span>
      </li>
      <li className="flex items-start gap-3">
        <Store className="mt-0.5 h-4 w-4 shrink-0 text-[#1f6f96]" />
        <span>{STORE_POLICY.cashInStore}</span>
      </li>
    </ul>
  </section>;
}
