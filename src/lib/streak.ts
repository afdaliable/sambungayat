const dayNo = (d: string) => Math.round(Date.parse(`${d}T00:00:00Z`) / 86_400_000);

/**
 * Consecutive-day streak from Jakarta dates (YYYY-MM-DD) with a finished daily challenge.
 * `current` stays alive until the end of the day after the last play (today still open).
 */
export function computeStreak(dates: string[], today: string): { current: number; best: number } {
  const days = [...new Set(dates.map(dayNo).filter(Number.isFinite))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = -Infinity;
  for (const d of days) {
    run = d === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  const t = dayNo(today);
  const last = days[days.length - 1];
  const current = last === t || last === t - 1 ? run : 0;
  return { current, best };
}
