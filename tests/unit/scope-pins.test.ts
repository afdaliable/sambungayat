import { describe, expect, it } from "vitest";
import { generateQuiz } from "../../src/lib/quiz/engine";
import { decodeConfig, encodeConfig, parseScope } from "../../src/lib/quiz/url";
import { diskLoader } from "./helpers";
import type { QuizMode } from "../../src/lib/quiz/types";

// Shared links depend on these ids (see CONTRACT in CLAUDE.md). Values recorded before the "ayat" scope kind existed.
const PINS: Record<string, string> = {
  "sambung|juz:30": "q1-91-7,q2-94-1,q3-114-3,q4-85-21,q5-89-13",
  "lengkapi|juz:30": "q1-93-4,q2-83-3,q3-105-2,q4-90-17,q5-79-25",
  "tebak-surah|juz:30": "q1-113-3,q2-85-9,q3-79-25,q4-90-17,q5-80-11",
  "sambung|surah:78": "q1-78-29,q2-78-30,q3-78-26,q4-78-39,q5-78-23",
  "lengkapi|surah:78": "q1-78-14,q2-78-35,q3-78-17,q4-78-18,q5-78-40",
  "tebak-surah|surah:78": "q1-78-40,q2-78-37,q3-78-6,q4-78-11,q5-78-13",
  "sambung|range:78-80": "q1-78-6,q2-80-16,q3-80-4,q4-78-11,q5-78-2",
  "lengkapi|range:78-80": "q1-79-27,q2-79-46,q3-79-12,q4-78-40,q5-79-45",
  "tebak-surah|range:78-80": "q1-79-46,q2-78-3,q3-79-12,q4-78-28,q5-80-24",
  "sambung|juz:29,30": "q1-90-14,q2-76-11,q3-68-1,q4-78-31,q5-77-21",
  "lengkapi|juz:29,30": "q1-85-11,q2-71-7,q3-72-2,q4-109-4,q5-93-3",
  "tebak-surah|juz:29,30": "q1-85-7,q2-83-4,q3-91-2,q4-111-4,q5-82-9",
};

describe("existing links keep their questions", () => {
  for (const [key, ids] of Object.entries(PINS)) {
    it(
      key,
      async () => {
        const [mode, sc] = key.split("|") as [QuizMode, string];
        const scope = parseScope(sc)!;
        const data = await diskLoader.load(scope);
        const { questions } = generateQuiz(
          { mode, scope, count: 5, difficulty: "mudah", seed: "pin" },
          data,
        );
        expect(questions.map((q) => q.id).join(",")).toBe(ids);
      },
      30000,
    );
  }
});

describe("ayat scope", () => {
  it("round-trips and rejects bad input", () => {
    expect(parseScope("ayat:2:255-257")).toEqual({ kind: "ayat", surah: 2, from: 255, to: 257 });
    expect(parseScope("ayat:2:257-255")).toBeNull();
    expect(parseScope("ayat:0:1-2")).toBeNull();
    expect(parseScope("ayat:2")).toBeNull();
    const c = decodeConfig("mode=sambung&scope=ayat:78:1-10&n=5&d=mudah&seed=x").config;
    expect(encodeConfig(c)).toContain("scope=ayat:78:1-10");
  });
  it("only asks about ayahs inside the range", async () => {
    const scope = parseScope("ayat:2:10-30")!;
    const data = await diskLoader.load(scope);
    for (const mode of ["sambung", "lengkapi", "tebak-surah", "sebelum"] as QuizMode[]) {
      const { questions } = generateQuiz(
        { mode, scope, count: 10, difficulty: "mudah", seed: "t" },
        data,
      );
      expect(questions.length, mode).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q.source.s).toBe(2);
        expect(q.source.a).toBeGreaterThanOrEqual(9); // Sebelum: source is the answer, one before the prompt
        expect(q.source.a).toBeLessThanOrEqual(30);
      }
    }
  }, 30000);
});
