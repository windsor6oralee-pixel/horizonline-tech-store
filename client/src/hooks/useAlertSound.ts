import { useCallback, useEffect, useRef, useState } from "react";

const MUTE_KEY = "hz_admin_sound_muted";

/**
 * Two-tone chime generated with the Web Audio API (no asset to load). Browsers only allow
 * audio after a user gesture, so the context is created lazily and resumed on the first click.
 */
export function useAlertSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState<boolean>(() => { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; } });

  useEffect(() => {
    const arm = () => {
      try {
        ctxRef.current ??= new AudioContext();
        if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
      } catch { /* no audio support */ }
    };
    window.addEventListener("pointerdown", arm, { passive: true });
    window.addEventListener("keydown", arm);
    return () => { window.removeEventListener("pointerdown", arm); window.removeEventListener("keydown", arm); };
  }, []);

  const play = useCallback((kind: "receipt" | "message" = "receipt") => {
    document.dispatchEvent(new CustomEvent("hz:alert-sound", { detail: kind }));
    if (muted) return;
    try {
      ctxRef.current ??= new AudioContext();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const notes = kind === "receipt" ? [880, 1175, 1568] : [660, 880];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = "sine"; osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.16;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.32);
      });
    } catch { /* ignore */ }
  }, [muted]);

  const toggleMuted = useCallback(() => {
    setMuted(value => { const next = !value; try { localStorage.setItem(MUTE_KEY, next ? "1" : "0"); } catch { /* ignore */ } return next; });
  }, []);

  return { play, muted, toggleMuted };
}

/** Fires `onNew` for keys that appear after the first load — the trigger for a sound. */
export function useNewItems(keys: string[], onNew: (added: string[]) => void) {
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (seen.current === null) { seen.current = new Set(keys); return; }
    const added = keys.filter(key => !seen.current!.has(key));
    keys.forEach(key => seen.current!.add(key));
    if (added.length) onNew(added);
  }, [keys.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
}
