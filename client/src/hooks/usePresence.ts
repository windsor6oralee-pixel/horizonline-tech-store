import { PRESENCE_PING_INTERVAL_MS, type Device, type PresenceStepKey } from "@shared/presence";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

const STORAGE_KEY = "hz_visit_id";
let cachedId: string | null = null;

/** Random per-visit id. Never leaves the browser except as an opaque string; no personal data. */
function visitId(): string {
  if (cachedId) return cachedId;
  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing) { cachedId = existing; return existing; }
  } catch { /* storage blocked (private mode) */ }
  const id = (crypto.randomUUID?.() ?? `${Math.random()}${Date.now()}`).replace(/[^a-z0-9]/gi, "").slice(0, 24);
  cachedId = id;
  try { sessionStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  return id;
}

function deviceType(): Device {
  const ua = navigator.userAgent;
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "tablet";
  if (/Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua)) return "mobile";
  return "desktop";
}

/** Reports the visitor's current step to the admin live panel. Pass null to stop reporting. */
export function usePresence(view: PresenceStepKey | null, product?: string | null) {
  const { mutate } = trpc.presence.ping.useMutation({ onError: () => { /* presence is best-effort */ } });
  useEffect(() => {
    if (!view) return;
    const payload = { sessionId: visitId(), view, product: product ?? null, device: deviceType() };
    const send = () => mutate(payload);
    send();
    const timer = window.setInterval(send, PRESENCE_PING_INTERVAL_MS);
    const onVisibility = () => { if (document.visibilityState === "visible") send(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [view, product, mutate]);
}
