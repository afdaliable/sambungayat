import { isNative } from "./native/platform";
type Props = Record<string, string | number | boolean>;
type Plausible = (name: string, opts?: { props: Props }) => void;

/**
 * Cookieless, anonymous product events. A no-op unless the site was built with PUBLIC_PLAUSIBLE_DOMAIN
 * (see BaseLayout). Never pass anything personal: only coarse values such as mode or score bucket.
 */
export function track(name: string, props?: Props): void {
  try {
    const p = (window as unknown as { plausible?: Plausible }).plausible;
    if (p) p(name, props ? { props } : undefined);
  } catch {
    /* analytics must never break the app */
  }
}

/** 0-100 score as a coarse bucket, so events stay anonymous and easy to chart. */
export const scoreBucket = (pct: number) =>
  pct >= 90 ? "90+" : pct >= 70 ? "70-89" : pct >= 40 ? "40-69" : "0-39";

/**
 * Adds one to the public "quizzes completed" counter (functions/api/stats.ts). Anonymous: only the
 * mode id leaves the device. Skipped inside the Android app (relative /api would hit https://localhost).
 * Failures are ignored; the site has no counter backend in preview or dev.
 */
export function countQuiz(mode: string): void {
  try {
    if (isNative()) return;
    const body = JSON.stringify({ mode });
    if (!navigator.sendBeacon?.("/api/stats", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/stats", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {
    /* counting must never break the app */
  }
}
