import { STORE_POLICY } from "@shared/storePolicy";
import { Globe, Store, TriangleAlert, WalletCards } from "lucide-react";

/** Cash being offered to the courier and refused. Static shape stays readable if animations are off. */
function NoCashOnDeliveryIcon() {
  return <svg viewBox="0 0 70 40" className="h-12 w-[76px] shrink-0" fill="none" aria-hidden="true">
    <g stroke="#1f6f96" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <rect x="2" y="9" width="17" height="15" rx="3" />
      <path d="M19 14h5l4 4v6h-9z" />
    </g>
    <circle cx="9" cy="27" r="3" fill="#1f6f96" />
    <circle cx="24" cy="27" r="3" fill="#1f6f96" />
    <g className="cod-note">
      <rect x="45" y="11" width="19" height="12" rx="2.5" fill="#fff" stroke="#c4901f" strokeWidth="2" />
      <circle cx="54.5" cy="17" r="3" stroke="#c4901f" strokeWidth="2" />
    </g>
    <g className="cod-ban">
      <circle cx="54.5" cy="17" r="13.5" stroke="#c0392b" strokeWidth="3" />
      <path d="M45 26.5 64 7.5" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" />
    </g>
  </svg>;
}

/** Payment and delivery rules. Shown wherever a customer might expect cash on delivery. */
export default function PaymentPolicyNotice({ variant = "full", className = "" }: { variant?: "full" | "compact"; className?: string }) {
  if (variant === "compact") {
    return <p className={`flex items-start gap-2 rounded-xl border border-[#f0d7a4] bg-[#fffaf0] px-3 py-2.5 text-[11px] font-bold leading-5 text-[#8a6413] ${className}`}>
      <TriangleAlert className="policy-alert mt-0.5 h-4 w-4 shrink-0 text-[#c4901f]" />
      {STORE_POLICY.shortLine}
    </p>;
  }

  return <section className={`policy-notice overflow-hidden rounded-2xl border border-[#f0d7a4] bg-[#fffaf0] ${className}`}>
    <p className="flex items-center gap-2 border-b border-[#f3e2bd] px-4 py-3 text-sm font-extrabold text-[#0a2342]">
      <TriangleAlert className="policy-alert h-4 w-4 text-[#c4901f]" />
      قبل المتابعة: طريقة الدفع والاستلام
    </p>
    <ul className="space-y-3 px-4 py-4 text-xs leading-6 text-[#5b4a28]">
      <li className="flex items-center gap-3 rounded-xl bg-[#fdf1e6] p-3">
        <NoCashOnDeliveryIcon />
        <span><b className="block text-[13px] text-[#a5301f]">{STORE_POLICY.noCod}</b>{STORE_POLICY.noCodReason}</span>
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
