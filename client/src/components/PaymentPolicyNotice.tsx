import { STORE_POLICY } from "@shared/storePolicy";
import { Ban, Globe, Store, TriangleAlert, WalletCards } from "lucide-react";

/** Payment and delivery rules. Shown wherever a customer might expect cash on delivery. */
export default function PaymentPolicyNotice({ variant = "full", className = "" }: { variant?: "full" | "compact"; className?: string }) {
  if (variant === "compact") {
    return <p className={`flex items-start gap-2 rounded-xl border border-[#f0d7a4] bg-[#fffaf0] px-3 py-2.5 text-[11px] font-bold leading-5 text-[#8a6413] ${className}`}>
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#c4901f]" />
      {STORE_POLICY.shortLine}
    </p>;
  }

  return <section className={`overflow-hidden rounded-2xl border border-[#f0d7a4] bg-[#fffaf0] ${className}`}>
    <p className="flex items-center gap-2 border-b border-[#f3e2bd] px-4 py-3 text-sm font-extrabold text-[#0a2342]">
      <TriangleAlert className="h-4 w-4 text-[#c4901f]" />
      قبل المتابعة: طريقة الدفع والاستلام
    </p>
    <ul className="space-y-3 px-4 py-4 text-xs leading-6 text-[#5b4a28]">
      <li className="flex items-start gap-3">
        <Ban className="mt-0.5 h-4 w-4 shrink-0 text-[#c0392b]" />
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
