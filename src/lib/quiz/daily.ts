const DAILY_SALT = "harian-v1";

/** YYYY-MM-DD in Asia/Jakarta. Built from parts so the result never depends on a locale's date pattern. */
export function jakartaDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function dailySeed(now: Date = new Date()): string {
  return `${jakartaDate(now)}-${DAILY_SALT}`;
}

export const DAILY_COUNT = 10;
const JAKARTA_OFFSET_MS = 7 * 3600_000; // Asia/Jakarta is UTC+7 with no DST
const DAY_MS = 24 * 3600_000;

/** Milliseconds until the next daily challenge starts (midnight in Jakarta). */
export function msUntilNextDaily(now: Date = new Date()): number {
  const local = now.getTime() + JAKARTA_OFFSET_MS;
  return DAY_MS - (((local % DAY_MS) + DAY_MS) % DAY_MS);
}

export function formatCountdown(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(t / 3600))}:${p(Math.floor((t % 3600) / 60))}:${p(t % 60)}`;
}

/** Share text per spec; the check mark and dash are built from code points to keep sources ASCII. */
export function dailyShareText(
  date: string,
  score: number,
  total: number,
  /** Optional translator for "lib.daily.share"; omitted = Indonesian text. */
  tr?: (key: string, vars: Record<string, string | number>) => string,
): string {
  const check = String.fromCodePoint(0x2705);
  const dash = String.fromCharCode(0x2014);
  if (tr) return tr("lib.daily.share", { date, score, total, check, dash });
  return `Tantangan Harian Sambung Ayat ${date}: ${score}/${total} ${check} ${dash} sambungayat.com/harian`;
}
