// Safe localStorage wrapper. Works (without persisting) when storage is unavailable, e.g. private mode.

export const PREFIX = "sa:v1:";
export const SCHEMA_VERSION = 1;

const memory = new Map<string, string>();
let temporary = false;
const listeners = new Set<() => void>();

function fallBack(): void {
  if (temporary) return;
  temporary = true;
  for (const listener of listeners) listener();
}

export const isTemporaryStorage = (): boolean => temporary;
export function subscribeStorage(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function checkStorage(): void {
  try {
    const s = backend();
    if (!s) return fallBack();
    s.setItem(PREFIX + "probe", "1");
    s.removeItem(PREFIX + "probe");
  } catch {
    fallBack();
  }
}

function backend(): Storage | null {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
    fallBack();
    return null;
  } catch {
    fallBack();
    return null;
  }
}

export function readJson<T>(key: string, fallback: T): T {
  let raw: string | null | undefined;
  try {
    raw =
      temporary && memory.has(key)
        ? memory.get(key)
        : (backend()?.getItem(PREFIX + key) ?? memory.get(key));
    if (raw != null) memory.set(key, raw);
  } catch {
    fallBack();
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
    fallBack();
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
