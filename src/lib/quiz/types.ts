export type QuizMode =
  "sambung" | "tebak-surah" | "lengkapi" | "tebak-audio" | "tebak-juz" | "sebelum";
export type Scope =
  | { kind: "juz"; juz: number[] }
  | { kind: "surah"; surah: number[] }
  | { kind: "range"; from: number; to: number }
  /** Ayah range inside one surah (inclusive). Additive kind: existing links keep their keys. */
  | { kind: "ayat"; surah: number; from: number; to: number };
export type Difficulty = "mudah" | "sulit";
export type QuizConfig = {
  mode: QuizMode;
  scope: Scope;
  count: 5 | 10 | 20;
  difficulty: Difficulty;
  seed: string;
};

export type OptionLabel =
  | { type: "ayah"; text: string; ellipsisStart?: boolean; ellipsisEnd?: boolean }
  | { type: "surah"; n: number; nameLatin: string; nameAr: string }
  | { type: "juz"; n: number };
export type Option = { key: string; label: OptionLabel };

export type Question = {
  id: string;
  mode: QuizMode;
  prompt: {
    ayahRef?: { s: number; a: number };
    text?: string;
    ellipsisStart?: boolean;
    ellipsisEnd?: boolean;
    hiddenWords?: number;
    audioUrl?: string;
  };
  options: Option[];
  correctKey: string;
  source: { s: number; a: number };
  /** Indonesian translation of the verse that is the correct answer (shown after answering). */
  answerTranslation: string;
};

export type Quiz = {
  config: QuizConfig;
  questions: Question[];
  /** True when the pool was smaller than config.count. */
  reduced: boolean;
  /** Set on a practice round built from earlier wrong answers; not saved to history or mastery. */
  retry?: boolean;
};
