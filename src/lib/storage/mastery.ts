import type { QuizMode } from "../quiz/types";
import { readJson, writeJson } from "./index";

export type MasteryCell = { attempts: number; correct: number; lastPlayed: string };
/** mode -> surah number -> counters */
export type Mastery = Partial<Record<QuizMode, Record<number, MasteryCell>>>;

export const getMastery = (): Mastery => readJson<Mastery>("mastery", {});

export function recordMastery(
  mode: QuizMode,
  results: { s: number; correct: boolean }[],
  date: string,
): void {
  const all = getMastery();
  const byMode = (all[mode] ??= {});
  for (const r of results) {
    const cell = (byMode[r.s] ??= { attempts: 0, correct: 0, lastPlayed: date });
    cell.attempts++;
    if (r.correct) cell.correct++;
    cell.lastPlayed = date;
  }
  writeJson("mastery", all);
}

export type WeakRow = {
  s: number;
  attempts: number;
  correct: number;
  pct: number;
  last: string;
  priority: number;
  /** The mode this surah scores lowest in, so practice targets the actual weakness. */
  mode: QuizMode;
};

const pctOf = (c: { attempts: number; correct: number }) =>
  Math.round((c.correct / c.attempts) * 100);

/** Surahs sorted by priority = weakness + staleness (1 point per idle day, capped at 30). */
export function weakestSurahs(mastery: Mastery, now = Date.now()): WeakRow[] {
  type Acc = { attempts: number; correct: number; last: string; mode: QuizMode; cell: MasteryCell };
  const bySurah = new Map<number, Acc>();
  for (const [mode, cells] of Object.entries(mastery) as [
    QuizMode,
    Record<number, MasteryCell>,
  ][]) {
    for (const [key, c] of Object.entries(cells)) {
      if (!c.attempts) continue;
      const s = Number(key);
      const acc = bySurah.get(s);
      if (!acc) {
        bySurah.set(s, {
          attempts: c.attempts,
          correct: c.correct,
          last: c.lastPlayed,
          mode,
          cell: c,
        });
        continue;
      }
      acc.attempts += c.attempts;
      acc.correct += c.correct;
      if (c.lastPlayed > acc.last) acc.last = c.lastPlayed;
      const d = pctOf(c) - pctOf(acc.cell);
      if (d < 0 || (d === 0 && c.attempts > acc.cell.attempts)) {
        acc.mode = mode;
        acc.cell = c;
      }
    }
  }
  return [...bySurah.entries()]
    .map(([s, { attempts, correct, last, mode }]) => {
      const pct = pctOf({ attempts, correct });
      const idleDays = last ? Math.min(30, Math.max(0, (now - Date.parse(last)) / 86_400_000)) : 0;
      return { s, attempts, correct, pct, last, mode, priority: 100 - pct + idleDays };
    })
    .sort((a, b) => b.priority - a.priority || b.attempts - a.attempts);
}
