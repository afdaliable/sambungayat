import type { QuizConfig } from "../quiz/types";
import { readJson, writeJson } from "./index";

export type HistoryEntry = {
  date: string;
  config: QuizConfig;
  score: number;
  total: number;
  wrong: { s: number; a: number }[];
};

const MAX = 100;

export const getHistory = (): HistoryEntry[] => readJson<HistoryEntry[]>("history", []);

export function addHistory(entry: HistoryEntry): void {
  writeJson("history", [entry, ...getHistory()].slice(0, MAX));
}
