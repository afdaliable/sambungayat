import type { Question } from "./types";

/**
 * The ayah that is the correct answer (or, for surah/juz questions, the ayah shown in the prompt).
 * Ayah options encode it in the option key ("s:a"); lengkapi keeps the source ayah.
 */
export function answerAyahRef(q: Question): { s: number; a: number } {
  const m = /^(\d+):(\d+)$/.exec(q.correctKey);
  return q.mode !== "lengkapi" && m ? { s: Number(m[1]), a: Number(m[2]) } : q.source;
}
