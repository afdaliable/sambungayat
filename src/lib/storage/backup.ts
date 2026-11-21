import { decodeConfig, encodeConfig } from "../quiz/url";
import type { QuizConfig } from "../quiz/types";
import { getHistory } from "./history";
import { getMastery } from "./mastery";
import { getDaily } from "./daily";
import { writeJson } from "./index";

const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const integer = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= min && v <= max;
const date = (v: unknown): boolean => typeof v === "string" && Number.isFinite(Date.parse(v));
const modes = ["sambung", "tebak-surah", "lengkapi", "tebak-audio", "tebak-juz", "sebelum"];
const score = (v: Record<string, unknown>): boolean =>
  integer(v.total, 0, 20) && integer(v.score, 0, v.total);

function config(v: unknown): boolean {
  if (!object(v) || !object(v.scope) || typeof v.seed !== "string") return false;
  try {
    const parsed = decodeConfig(encodeConfig(v as QuizConfig));
    return parsed.fieldsValid && (v.seed === "" || parsed.complete);
  } catch {
    return false;
  }
}

export function exportBackup(): string {
  return JSON.stringify(
    {
      format: "sambungayat",
      version: 1,
      history: getHistory(),
      mastery: getMastery(),
      daily: getDaily(),
    },
    null,
    2,
  );
}

/** Replaces progress only after the entire backup has been validated. Settings stay unchanged. */
export function importBackup(raw: string): void {
  const v: unknown = JSON.parse(raw);
  if (
    !object(v) ||
    v.format !== "sambungayat" ||
    v.version !== 1 ||
    !Array.isArray(v.history) ||
    v.history.length > 100 ||
    !v.history.every(
      (h: unknown) =>
        object(h) &&
        date(h.date) &&
        config(h.config) &&
        score(h) &&
        Array.isArray(h.wrong) &&
        h.wrong.length <= 20 &&
        h.wrong.every((r: unknown) => object(r) && integer(r.s, 1, 114) && integer(r.a, 1, 286)),
    ) ||
    !object(v.mastery) ||
    !Object.entries(v.mastery).every(
      ([mode, cells]) =>
        modes.includes(mode) &&
        object(cells) &&
        Object.entries(cells).every(
          ([s, c]) =>
            integer(Number(s), 1, 114) &&
            object(c) &&
            integer(c.attempts, 1) &&
            integer(c.correct, 0, c.attempts) &&
            date(c.lastPlayed),
        ),
    ) ||
    !object(v.daily) ||
    !Object.entries(v.daily).every(
      ([day, d]) =>
        /^\d{4}-\d{2}-\d{2}$/.test(day) &&
        date(day) &&
        object(d) &&
        score(d) &&
        integer(d.attempts, 1),
    )
  ) {
    throw new Error("Invalid progress backup");
  }
  writeJson("history", v.history);
  writeJson("mastery", v.mastery);
  writeJson("daily", v.daily);
}

export function downloadBackup(): void {
  const url = URL.createObjectURL(new Blob([exportBackup()], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "sambungayat-progress.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
