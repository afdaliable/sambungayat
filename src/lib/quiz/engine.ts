import type { QuranData } from "../quran/loader";
import { scopeKey } from "../quran/scope";
import { lengkapi } from "./generators/lengkapi";
import { sambung } from "./generators/sambung";
import { getView, type Generator } from "./generators/shared";
import { tebakAudio } from "./generators/tebakAudio";
import { sebelum } from "./generators/sebelum";
import { tebakJuz } from "./generators/tebakJuz";
import { tebakSurah } from "./generators/tebakSurah";
import { createRng } from "./rng";
import type { Quiz, QuizConfig, QuizMode } from "./types";

const GENERATORS: Record<QuizMode, Generator> = {
  sambung,
  "tebak-surah": tebakSurah,
  lengkapi,
  "tebak-audio": tebakAudio,
  "tebak-juz": tebakJuz,
  sebelum,
};

/**
 * Pure and deterministic: same config (incl. seed) + same data => identical quiz on any device.
 * `count` is deliberately not part of the RNG key, so a 5-question quiz is a prefix of the 10-question one.
 */
export function generateQuiz(config: QuizConfig, data: QuranData): Quiz {
  const view = getView(data, config.scope);
  const rng = createRng(
    [config.mode, scopeKey(config.scope), config.difficulty, config.seed].join("|"),
  );
  const gen = GENERATORS[config.mode];
  const ctx = { config, view, rng };
  const questions = [];
  for (const item of rng.shuffle(gen.pool(ctx))) {
    if (questions.length >= config.count) break;
    const q = gen.make(ctx, item, questions.length);
    if (q) questions.push(q);
  }
  return { config, questions, reduced: questions.length < config.count };
}
