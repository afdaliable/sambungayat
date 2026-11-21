import { describe, expect, it } from "vitest";
import { weakestSurahs, type Mastery } from "../../src/lib/storage/mastery";

const NOW = Date.parse("2026-11-21T10:00:00Z");
const cell = (attempts: number, correct: number, lastPlayed = "2026-11-21T09:00:00Z") => ({
  attempts,
  correct,
  lastPlayed,
});

describe("weakestSurahs", () => {
  it("empty", () => expect(weakestSurahs({}, NOW)).toEqual([]));

  it("keeps the mode the weakness was recorded in", () => {
    const m: Mastery = { "tebak-audio": { 112: cell(5, 1) } };
    expect(weakestSurahs(m, NOW)[0]).toMatchObject({ s: 112, mode: "tebak-audio", pct: 20 });
  });

  it("picks the lowest-scoring mode per surah and aggregates the totals", () => {
    const m: Mastery = {
      sambung: { 78: cell(10, 9), 112: cell(4, 4) },
      "tebak-surah": { 78: cell(5, 2) },
    };
    const rows = weakestSurahs(m, NOW);
    expect(rows.map((r) => r.s)).toEqual([78, 112]);
    expect(rows[0]).toMatchObject({ mode: "tebak-surah", attempts: 15, correct: 11, pct: 73 });
    expect(rows[1]).toMatchObject({ mode: "sambung", pct: 100 });
  });

  it("breaks a score tie toward the mode with more attempts", () => {
    const m: Mastery = { sambung: { 1: cell(2, 1) }, lengkapi: { 1: cell(6, 3) } };
    expect(weakestSurahs(m, NOW)[0]!.mode).toBe("lengkapi");
  });

  it("lets a stale weak spot outrank a fresh one", () => {
    const m: Mastery = {
      sambung: { 2: cell(10, 5) },
      "tebak-juz": { 3: cell(10, 6, "2026-10-01T00:00:00Z") },
    };
    expect(weakestSurahs(m, NOW)[0]).toMatchObject({ s: 3, mode: "tebak-juz" });
  });
});
