type Tone = "onDark" | "onLight";

const CYAN = "#8ad9e3";
const CYAN_DEEP = "#4db7cf";
const NAVY = "#0a2342";

export function BrandMark({ size = 40, tone = "onDark", className = "" }: { size?: number; tone?: Tone; className?: string }) {
  const frame = tone === "onDark" ? CYAN : NAVY;
  const horizon = tone === "onDark" ? CYAN : CYAN_DEEP;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true" className={className}>
      <rect x="15" y="15" width="70" height="70" rx="17" stroke={frame} strokeWidth="6" />
      <rect x="36" y="30" width="9" height="40" fill={frame} />
      <rect x="55" y="30" width="9" height="40" fill={frame} />
      <path d="M1 52.5C30 46.5 70 45 99 48.5C70 51.5 30 53.5 1 52.5Z" fill={horizon} />
    </svg>
  );
}

const sizes = {
  sm: { mark: 34, name: "text-[15px]", sub: "text-[8px]", gap: "gap-2.5" },
  md: { mark: 42, name: "text-lg", sub: "text-[9px]", gap: "gap-3" },
  lg: { mark: 56, name: "text-2xl", sub: "text-[11px]", gap: "gap-3.5" },
};

export function BrandLockup({ tone = "onDark", size = "md", className = "" }: { tone?: Tone; size?: keyof typeof sizes; className?: string }) {
  const s = sizes[size];
  const name = tone === "onDark" ? "text-white" : "text-[#0a2342]";
  const sub = tone === "onDark" ? "text-[#8ad9e3]" : "text-[#1f6f96]";
  return (
    <span dir="ltr" className={`inline-flex items-center ${s.gap} ${className}`}>
      <BrandMark size={s.mark} tone={tone} />
      <span className="brand-wordmark flex flex-col leading-none">
        <span className={`font-extrabold tracking-[.14em] ${s.name} ${name}`}>HORIZONLINE</span>
        <span className={`mt-1 font-semibold tracking-[.32em] ${s.sub} ${sub}`}>TECH STORE</span>
      </span>
    </span>
  );
}
