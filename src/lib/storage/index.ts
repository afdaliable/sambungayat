// Safe localStorage wrapper. Works (without persisting) when storage is unavailable, e.g. private mode.

export const PREFIX = "sa:v1:";
export const SCHEMA_VERSION = 1;

const memory = new Map<string, string>();

function backend(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function readJson<T>(key: string, fallback: T): T {
  let raw: string | null | undefined;
  try {
    raw = backend()?.getItem(PREFIX + key) ?? memory.get(key);
  } catch {
    raw = memory.get(key);
  }
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    backend()?.setItem(PREFIX + key, raw);
  } catch {
    /* quota or privacy mode: keep the in-memory copy only */
  }
}

/** Removes every key written by this app. */
export function clearAll(): void {
  memory.clear();
  try {
    const s = backend();
    if (!s) return;
    for (const k of Object.keys(s)) if (k.startsWith("sa:")) s.removeItem(k);
  } catch {
    /* ignore */
  }
}

/** Hook for future schema bumps: upgrade stored data from `from` to SCHEMA_VERSION. Nothing to do for v1. */
export function migrate(from: number): void {
  void from;
}
