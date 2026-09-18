function WhatsAppGlyph({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z" />
  </svg>;
}

/**
 * Floating WhatsApp button, shown to a customer once they are pre-qualified.
 * Entry animation is CSS-only: the button stays visible even if animations never run.
 */
export default function WhatsAppFab({ href, label = "تواصل معنا عبر واتساب" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="whatsapp-fab group fixed bottom-5 left-5 z-40 flex items-center gap-3 print:hidden"
    >
      <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_26px_rgba(37,211,102,.45)] ring-4 ring-white/70 transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
        <span className="whatsapp-fab-ring absolute inset-0 rounded-full bg-[#25D366]" />
        <WhatsAppGlyph className="relative h-7 w-7" />
      </span>
      <span className="pointer-events-none hidden max-w-0 overflow-hidden whitespace-nowrap rounded-full bg-[#0a2342] py-2 text-sm font-extrabold text-white opacity-0 shadow-lg transition-all duration-300 group-hover:max-w-[220px] group-hover:px-4 group-hover:opacity-100 sm:block">
        {label}
      </span>
    </a>
  );
}
