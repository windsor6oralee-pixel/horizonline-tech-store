/**
 * Illustrations for the delivery rules. Each one reads correctly without motion:
 * the animations only add movement on top of a complete static drawing.
 */

export function NoCashOnDeliveryIcon({ className = "h-12 w-[76px]" }: { className?: string }) {
  return <svg viewBox="0 0 70 40" className={`${className} shrink-0`} fill="none" aria-hidden="true">
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

/** Identity card checked by the courier. */
export function IdCheckIcon({ className = "h-12 w-[76px]" }: { className?: string }) {
  return <svg viewBox="0 0 70 40" className={`${className} shrink-0`} fill="none" aria-hidden="true">
    <g className="id-card">
      <rect x="6" y="6" width="44" height="30" rx="4" fill="#fff" stroke="#1f6f96" strokeWidth="2" />
      <circle cx="19" cy="18" r="5" stroke="#1f6f96" strokeWidth="2" />
      <path d="M12 29c1.6-3.4 4-5 7-5s5.4 1.6 7 5" stroke="#1f6f96" strokeWidth="2" strokeLinecap="round" />
      <g stroke="#8ab4cc" strokeWidth="2.4" strokeLinecap="round">
        <path d="M32 15h12" /><path d="M32 21h12" /><path d="M32 27h8" />
      </g>
    </g>
    <g className="id-check">
      <circle cx="52" cy="28" r="11" fill="#15915f" />
      <path d="m46.5 28.2 3.6 3.6 7-7.4" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>;
}

/** Contract reviewed and signed on delivery. */
export function ContractSignIcon({ className = "h-12 w-[76px]" }: { className?: string }) {
  return <svg viewBox="0 0 70 40" className={`${className} shrink-0`} fill="none" aria-hidden="true">
    <rect x="12" y="3" width="34" height="34" rx="4" fill="#fff" stroke="#1f6f96" strokeWidth="2" />
    <g stroke="#8ab4cc" strokeWidth="2.4" strokeLinecap="round">
      <path d="M19 12h20" /><path d="M19 18h20" /><path d="M19 24h11" />
    </g>
    <path className="sign-stroke" d="M20 31c3-5 5 3 8-1s5 2 9-3" stroke="#c4901f" strokeWidth="2.6" strokeLinecap="round" />
    <g className="sign-pen">
      <path d="M48 26 58 16l4 4-10 10-5 1z" fill="#fff" stroke="#0a2342" strokeWidth="2" strokeLinejoin="round" />
      <path d="M56 18l4 4" stroke="#0a2342" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>;
}

/** Order settled through the Sham Cash agent before shipping. */
export function PrepaidIcon({ className = "h-12 w-[76px]" }: { className?: string }) {
  return <svg viewBox="0 0 70 40" className={`${className} shrink-0`} fill="none" aria-hidden="true">
    <g className="prepaid-note">
      <rect x="22" y="2" width="26" height="15" rx="3" fill="#fff" stroke="#c4901f" strokeWidth="2" />
      <circle cx="35" cy="9.5" r="3.4" stroke="#c4901f" strokeWidth="2" />
    </g>
    <path d="M12 20h46a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4z" fill="#eaf3f9" stroke="#1f6f96" strokeWidth="2" />
    <path d="M48 25h10a3 3 0 0 1 0 8h-10a4 4 0 0 1 0-8z" fill="#fff" stroke="#1f6f96" strokeWidth="2" />
    <circle className="prepaid-dot" cx="52" cy="29" r="2.4" fill="#15915f" />
  </svg>;
}
