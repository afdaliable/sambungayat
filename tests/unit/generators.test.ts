import { beforeAll, describe, expect, it } from "vitest";
import { createLoader, type QuranData } from "../../src/lib/quran/loader";
import { normalizeArabic } from "../../src/lib/quran/normalize";
import { HAS_LETTER } from "../../src/lib/quran/tokenize";
import type { Ayah } from "../../src/lib/quran/types";
import { generateQuiz } from "../../src/lib/quiz/engine";
import type { Difficulty, Question, QuizConfig, QuizMode, Scope } from "../../src/lib/quiz/types";
import { diskLoader, loadAll } from "./helpers";

const SEEDS = 300;
const MODES: QuizMode[] = [
  "sambung",
  "tebak-surah",
  "lengkapi",
  "tebak-audio",
  "tebak-juz",
  "sebelum",
];
const DIFFS: Difficulty[] = ["mudah", "sulit"];
const SCOPES: Record<string, Scope> = {
  "juz 30": { kind: "juz", juz: [30] },
  "juz 1": { kind: "juz", juz: [1] },
  "al-baqarah": { kind: "surah", surah: [2] },
  "ar-rahman": { kind: "surah", surah: [55] },
  "small range 112-114": { kind: "range", from: 112, to: 114 },
  "surah 113+114": { kind: "surah", surah: [113, 114] },
  "range 1-114": { kind: "range", from: 1, to: 114 },
};

const wordCount = (t: string) => t.split(" ").filter((w) => HAS_LETTER.test(w)).length;
let all: QuranData;
const ayahOf = (s: number, a: number): Ayah => all.surahs.get(s)!.ayahs[a - 1]!;
beforeAll(async () => {
  all = await loadAll();
});

function checkQuestion(q: Question, config: QuizConfig) {
  // structure
  expect(q.options).toHaveLength(4);
  expect(new Set(q.options.map((o) => o.key)).size).toBe(4);
  expect(q.options.filter((o) => o.key === q.correctKey)).toHaveLength(1);
  const norms = q.options.map((o) =>
    o.label.type === "ayah" ? normalizeArabic(o.label.text) : String(o.label.n),
  );
  expect(new Set(norms).size).toBe(4);

  const { s, a } = q.source;
  const src = ayahOf(s, a);
  const correct = q.options.find((o) => o.key === q.correctKey)!;

  if (q.mode === "sambung") {
    const next = ayahOf(s, a + 1); // throws if source was the last ayah
    expect(correct.key).toBe(`${s}:${a + 1}`);
    const l = correct.label;
    if (l.type !== "ayah") throw new Error("label type");
    expect(next.arNorm.startsWith(normalizeArabic(l.text))).toBe(true);
    if (!l.ellipsisEnd) expect(normalizeArabic(l.text)).toBe(next.arNorm);
    expect(q.answerTranslation).toBe(next.id);
    // prompt is (the tail of) the source ayah
    expect(src.arNorm.endsWith(normalizeArabic(q.prompt.text!))).toBe(true);
    // no distractor equals the question ayah or the answer
    for (const o of q.options) {
      if (o.key === q.correctKey || o.label.type !== "ayah") continue;
      expect(normalizeArabic(o.label.text)).not.toBe(next.arNorm);
    }
    // context is unambiguous in the loaded data
    const sameSurah = all.surahs.get(s)!.ayahs;
    for (const other of sameSurah) {
      if (other.a !== a && other.arNorm === src.arNorm) {
        const after = sameSurah[other.a]; // undefined when the repeat is the surah's last ayah
        if (after) expect(after.arNorm).toBe(next.arNorm);
      }
    }
  } else if (q.mode === "tebak-surah") {
    expect(correct.label.type === "surah" && correct.label.n).toBe(s);
    expect(all.ambiguous.has(src.g)).toBe(false);
    expect(src.words.length).toBeGreaterThanOrEqual(3);
    expect(src.arNorm.startsWith(normalizeArabic(q.prompt.text!))).toBe(true);
    expect(q.prompt.ayahRef).toBeUndefined(); // must not leak the answer
    expect(q.prompt).not.toHaveProperty("translation");
  } else if (q.mode === "lengkapi") {
    const k = q.prompt.hiddenWords!;
    expect(k).toBeGreaterThanOrEqual(1);
    expect(config.difficulty === "mudah" ? k === 1 : k <= 3).toBe(true);
    expect(src.words.length - k).toBeGreaterThanOrEqual(3);
    const l = correct.label;
    if (l.type !== "ayah") throw new Error("label type");
    expect(normalizeArabic(`${q.prompt.text} ${l.text}`)).toBe(src.arNorm);
    for (const o of q.options) {
      if (o.label.type === "ayah") expect(wordCount(o.label.text)).toBe(k);
    }
  } else if (q.mode === "tebak-juz") {
    expect(correct.label.type === "juz" && correct.label.n).toBe(src.juz);
    expect(all.ambiguous.has(src.g)).toBe(false);
    expect(q.prompt.ayahRef).toBeUndefined(); // must not leak the answer
  } else if (q.mode === "sebelum") {
    // source is the preceding ayah; the prompt shows the one after it
    expect(q.prompt.ayahRef).toEqual({ s, a: a + 1 });
    expect(correct.key).toBe(`${s}:${a}`);
    const shown = ayahOf(s, a + 1);
    expect(shown.arNorm.startsWith(normalizeArabic(q.prompt.text!))).toBe(true);
    for (const o of q.options) {
      if (o.key === q.correctKey || o.label.type !== "ayah") continue;
      expect(normalizeArabic(o.label.text)).not.toBe(src.arNorm);
    }
    // the shown ayah is preceded by the same ayah everywhere it repeats
    for (const other of all.surahs.get(s)!.ayahs) {
      if (other.a !== a + 1 && other.arNorm === shown.arNorm && other.a > 1) {
        expect(all.surahs.get(s)!.ayahs[other.a - 2]!.arNorm).toBe(src.arNorm);
      }
    }
  } else {
    const l = correct.label;
    if (l.type !== "ayah") throw new Error("label type");
    expect(src.arNorm.startsWith(normalizeArabic(l.text))).toBe(true);
    expect(all.ambiguous.has(src.g)).toBe(false);
    expect(q.prompt.audioUrl).toMatch(
      new RegExp(`/${String(s).padStart(3, "0")}${String(a).padStart(3, "0")}\\.mp3$`),
    );
  }
}

describe.each(Object.entries(SCOPES))("generators / %s", (_name, scope) => {
  let data: QuranData;
  beforeAll(async () => {
    data = await diskLoader.load(scope); // only what the real loader would fetch
  });

  for (const mode of MODES) {
    for (const difficulty of DIFFS) {
      it(`${mode}/${difficulty}: ${SEEDS} seeds satisfy all invariants`, () => {
        let questions = 0;
        for (let i = 0; i < SEEDS; i++) {
          const config: QuizConfig = { mode, scope, count: 10, difficulty, seed: `t${i}` };
          const quiz = generateQuiz(config, data);
          expect(quiz.questions.length).toBeGreaterThan(0);
          expect(quiz.reduced).toBe(quiz.questions.length < 10);
          const sources = quiz.questions.map((q) => `${q.source.s}:${q.source.a}`);
          expect(new Set(sources).size).toBe(sources.length); // no duplicate source ayah
          for (const q of quiz.questions) checkQuestion(q, config);
          questions += quiz.questions.length;
          if (i < 20) {
            expect(generateQuiz(config, data)).toEqual(quiz); // determinism
            expect(generateQuiz(config, all)).toEqual(quiz); // independent of extra loaded data
          }
        }
        expect(questions).toBeGreaterThan(SEEDS * 3);
      });
    }
  }
});

describe("engine", () => {
  it("different seeds give different quizzes", async () => {
    const data = await diskLoader.load(SCOPES["juz 30"]!);
    const mk = (seed: string) =>
      generateQuiz(
        { mode: "sambung", scope: SCOPES["juz 30"]!, count: 10, difficulty: "mudah", seed },
        data,
      );
    expect(mk("a")).not.toEqual(mk("b"));
  });

  it("shrinks and flags when the pool is smaller than count", async () => {
    const scope: Scope = { kind: "surah", surah: [108] }; // 3 ayahs
    const data = await diskLoader.load(scope);
    const quiz = generateQuiz(
      { mode: "sambung", scope, count: 20, difficulty: "mudah", seed: "s" },
      data,
    );
    expect(quiz.reduced).toBe(true);
    expect(quiz.questions.length).toBeLessThanOrEqual(2); // last ayah never a question
    for (const q of quiz.questions) checkQuestion(q, quiz.config);
  });

  it("works with a loader that fails once, then succeeds", async () => {
    let fail = true;
    const loader = createLoader(async (p) => {
      if (fail) {
        fail = false;
        throw new Error("boom");
      }
      return JSON.parse(
        await (await import("node:fs/promises")).readFile(`public/data/v1/${p}`, "utf8"),
      );
    });
    await expect(loader.load(SCOPES["juz 30"]!)).rejects.toThrow("boom");
    await expect(loader.load(SCOPES["juz 30"]!)).resolves.toBeTruthy();
  });
});

describe("ar-rahman (repeated refrain)", () => {
  it("never asks sambung from an ayah whose text repeats with a different continuation", async () => {
    const scope = SCOPES["ar-rahman"]!;
    const data = await diskLoader.load(scope);
    const refrain = all.surahs.get(55)!.ayahs.filter((x) => all.ambiguous.has(x.g));
    expect(refrain.length).toBeGreaterThanOrEqual(30);
    for (let i = 0; i < SEEDS; i++) {
      const quiz = generateQuiz(
        { mode: "sambung", scope, count: 20, difficulty: "sulit", seed: `r${i}` },
        data,
      );
      for (const q of quiz.questions) {
        const src = ayahOf(55, q.source.a);
        expect(all.ambiguous.has(src.g)).toBe(false);
      }
    }
  });
});
