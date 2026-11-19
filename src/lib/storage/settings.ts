import { useSyncExternalStore } from "react";
import { DEFAULT_RECITER, type ReciterId } from "../../config/reciters";
import { PREFIX, readJson, writeJson } from "./index";

export type ArabicSize = "S" | "M" | "L" | "XL";
export type Settings = {
  showTranslation: boolean;
  showContext: boolean;
  autoplay: boolean;
  reciter: ReciterId;
  arabicSize: ArabicSize;
  theme: "system" | "light" | "dark";
  sound: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  showTranslation: true,
  showContext: true,
  autoplay: false,
  reciter: DEFAULT_RECITER,
  arabicSize: "M",
  theme: "system",
  sound: false,
};

let current: Settings | null = null;
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  return (current ??= { ...DEFAULT_SETTINGS, ...readJson<Partial<Settings>>("settings", {}) });
}

/** Reflect settings on <html>: theme class and Arabic size. Mirrors the inline script in BaseLayout. */
export function applySettings(s: Settings): void {
  const root = document.documentElement;
  const dark =
    s.theme === "dark" ||
    (s.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  root.dataset.ar = s.arabicSize;
}

export function updateSettings(patch: Partial<Settings>): void {
  current = { ...getSettings(), ...patch };
  writeJson("settings", current);
  applySettings(current);
  listeners.forEach((l) => l());
}

export function resetSettingsCache(): void {
  current = null;
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, () => DEFAULT_SETTINGS);
}

// The header toggle (vanilla JS) and other tabs write settings behind this cache's back.
if (typeof window !== "undefined") {
  window.addEventListener("sa:settings", resetSettingsCache);
  window.addEventListener("storage", (e) => {
    if (e.key === null || e.key === PREFIX + "settings") resetSettingsCache();
  });
}
