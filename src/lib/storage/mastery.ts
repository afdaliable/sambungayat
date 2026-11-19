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
