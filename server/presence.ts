import { type Device, PRESENCE_ONLINE_WINDOW_MS, stepIndex } from "@shared/presence";

type Entry = {
  sessionId: string;
  view: string;
  product: string | null;
  device: Device;
  firstSeen: number;
  lastSeen: number;
  furthestStage: number;
  /** Last time this session was written to MySQL, so heartbeats do not hammer the database. */
  persistedAt: number;
  persistedView: string;
};

const MAX_ENTRIES = 800;
const entries = new Map<string, Entry>();
let peakOnline = 0;
let peakAt = 0;

function prune(now: number) {
  Array.from(entries.keys()).forEach(id => {
    const entry = entries.get(id);
    if (entry && now - entry.lastSeen > PRESENCE_ONLINE_WINDOW_MS) entries.delete(id);
  });
  if (entries.size <= MAX_ENTRIES) return;
  Array.from(entries.values())
    .sort((a, b) => a.lastSeen - b.lastSeen)
    .slice(0, entries.size - MAX_ENTRIES)
    .forEach(entry => entries.delete(entry.sessionId));
}

export function touch(input: { sessionId: string; view: string; product?: string | null; device: Device }): Entry {
  const now = Date.now();
  prune(now);
  const existing = entries.get(input.sessionId);
  const stage = stepIndex(input.view);
  const entry: Entry = existing
    ? { ...existing, view: input.view, product: input.product ?? null, device: input.device, lastSeen: now, furthestStage: Math.max(existing.furthestStage, stage) }
    : { sessionId: input.sessionId, view: input.view, product: input.product ?? null, device: input.device, firstSeen: now, lastSeen: now, furthestStage: stage, persistedAt: 0, persistedView: "" };
  entries.set(input.sessionId, entry);
  if (entries.size > peakOnline) { peakOnline = entries.size; peakAt = now; }
  return entry;
}

/** True when this heartbeat is worth a database write: first sight, a step change, or once a minute. */
export function shouldPersist(entry: Entry): boolean {
  const now = Date.now();
  if (entry.persistedView !== entry.view || now - entry.persistedAt > 60_000) {
    entry.persistedAt = now;
    entry.persistedView = entry.view;
    return true;
  }
  return false;
}

export function snapshot() {
  const now = Date.now();
  prune(now);
  const online = Array.from(entries.values())
    .sort((a, b) => b.furthestStage - a.furthestStage || a.firstSeen - b.firstSeen)
    .map(entry => ({
      id: entry.sessionId.slice(0, 6).toUpperCase(),
      view: entry.view,
      product: entry.product,
      device: entry.device,
      secondsOnSite: Math.round((now - entry.firstSeen) / 1000),
      secondsIdle: Math.round((now - entry.lastSeen) / 1000),
    }));
  const byStep: Record<string, number> = {};
  const byDevice: Record<string, number> = {};
  entries.forEach(entry => {
    byStep[entry.view] = (byStep[entry.view] ?? 0) + 1;
    byDevice[entry.device] = (byDevice[entry.device] ?? 0) + 1;
  });
  return { online, count: online.length, byStep, byDevice, peakOnline, peakAt: peakAt || null };
}
