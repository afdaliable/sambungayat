import { readJson, writeJson } from "./index";

export type DailyRecord = { score: number; total: number; attempts: number };

export const getDaily = (): Record<string, DailyRecord> => readJson("daily", {});

/** The first attempt of a day is the official score; later attempts only bump the counter. */
export function recordDaily(date: string, score: number, total: number): DailyRecord {
  const all = getDaily();
  const prev = all[date];
  const rec = prev ? { ...prev, attempts: prev.attempts + 1 } : { score, total, attempts: 1 };
  writeJson("daily", { ...all, [date]: rec });
  return rec;
}
