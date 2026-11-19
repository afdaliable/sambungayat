import type { QuranData } from "../../quran/loader";
import { normalizeArabic } from "../../quran/normalize";
import { ayahInScope, neededSurahs, scopeKey, scopeSurahs } from "../../quran/scope";
import type { Ayah, SurahFile } from "../../quran/types";
import type { Rng } from "../rng";
import type { Option, OptionLabel, Question, QuizConfig, Scope } from "../types";

export type Item = { s: number; a: Ayah };

/** Data restricted to what the loader fetches for a scope, so output never depends on what else is loaded. */
export type View = {
  data: QuranData;
  scope: Scope;
  surahs: Map<number, SurahFile>;
  scopeSet: Set<number>;
  /** All loaded ayahs in surah order. */
  all: Item[];
  /** arNorm -> set of arNorm of the ayah that follows it (within a surah), across loaded surahs. */
  nextOf: Map<string, Set<string>>;
  /** arNorm -> set of arNorm of the ayah that precedes it (within a surah), across loaded surahs. */
  prevOf: Map<string, Set<string>>;
  inScope(item: Item): boolean;
};

export type Ctx = { config: QuizConfig; view: View; rng: Rng };

export type Generator = {
  pool(ctx: Ctx): Item[];
  make(ctx: Ctx, item: Item, index: number): Question | null;
};

const viewCache = new WeakMap<QuranData, Map<string, View>>();

export function getView(data: QuranData, scope: Scope): View {
  const key = scopeKey(scope);
  let perData = viewCache.get(data);
  if (!perData) viewCache.set(data, (perData = new Map()));
  const hit = perData.get(key);
  if (hit) return hit;

  const surahs = new Map<number, SurahFile>();
  for (const n of neededSurahs(scope, data.juz)) {
    const f = data.surahs.get(n);
    if (f) surahs.set(n, f);
  }
  const scopeSet = new Set(scopeSurahs(scope, data.juz));
  const all: Item[] = [];
  const nextOf = new Map<string, Set<string>>();
  const prevOf = new Map<string, Set<string>>();
  for (const f of [...surahs.values()].sort((x, y) => x.n - y.n)) {
    f.ayahs.forEach((a, i) => {
      all.push({ s: f.n, a });
      const before = f.ayahs[i - 1];
      if (before) {
        let set = prevOf.get(a.arNorm);
        if (!set) prevOf.set(a.arNorm, (set = new Set()));
        set.add(before.arNorm);
      }
      const nxt = f.ayahs[i + 1];
      if (nxt) {
        let set = nextOf.get(a.arNorm);
        if (!set) nextOf.set(a.arNorm, (set = new Set()));
        set.add(nxt.arNorm);
      }
    });
  }
  const view: View = {
    data,
    scope,
    surahs,
    scopeSet,
    all,
    nextOf,
    prevOf,
    inScope: (it) => ayahInScope(scope, scopeSet, it.s, it.a.a, it.a.juz),
  };
  perData.set(key, view);
  return view;
}

export const scopeItems = (view: View) => view.all.filter(view.inScope);

/**
 * Picks `need` items walking tiers in order (each tier shuffled).
 * `accept` sees already chosen items. Returns null if not enough.
 */
export function pickDistinct<T>(
  tiers: T[][],
  need: number,
  rng: Rng,
  accept: (candidate: T, chosen: readonly T[]) => boolean,
): T[] | null {
  const chosen: T[] = [];
  for (const tier of tiers) {
    for (const c of rng.shuffle(tier)) {
      if (chosen.length === need) return chosen;
      if (accept(c, chosen)) chosen.push(c);
    }
    if (chosen.length === need) return chosen;
  }
  return chosen.length === need ? chosen : null;
}

const LONG_WORDS = 12;
const EXCERPT_WORDS = 8;

/** Last words of a long ayah for use as a prompt. */
export function tailExcerpt(words: readonly string[]) {
  return words.length > LONG_WORDS
    ? { text: words.slice(-EXCERPT_WORDS).join(" "), ellipsisStart: true as const }
    : { text: words.join(" ") };
}

/**
 * Option labels for ayahs: long ayahs show their first words; collisions after truncation
 * are resolved by showing more words. Returns null if two labels stay identical when normalized.
 */
export function ayahOptionLabels(ayahs: readonly Ayah[]): OptionLabel[] | null {
  const n = ayahs.map((a) => (a.words.length > LONG_WORDS ? EXCERPT_WORDS : a.words.length));
  const text = (i: number) => (ayahs[i] as Ayah).words.slice(0, n[i]).join(" ");
  for (;;) {
    const keys = ayahs.map((_, i) => normalizeArabic(text(i)));
    let changed = false;
    keys.forEach((k, i) => {
      const clash = keys.some((o, j) => j !== i && o === k);
      if (clash && (n[i] as number) < (ayahs[i] as Ayah).words.length) {
        (n[i] as number)++;
        changed = true;
      }
    });
    if (!changed) {
      if (new Set(keys).size !== keys.length) return null;
      break;
    }
  }
  return ayahs.map((a, i) => ({
    type: "ayah" as const,
    text: text(i),
    ...((n[i] as number) < a.words.length ? { ellipsisEnd: true as const } : {}),
  }));
}

export const labelNorm = (l: OptionLabel) =>
  l.type === "ayah" ? normalizeArabic(l.text) : String(l.n);

/** Shuffle correct + distractors into the final 4 options. Null if labels are not unique. */
export function assembleOptions(
  rng: Rng,
  correct: Option,
  distractors: readonly Option[],
): Option[] | null {
  const options = rng.shuffle([correct, ...distractors]);
  const norms = new Set(options.map((o) => labelNorm(o.label)));
  const keys = new Set(options.map((o) => o.key));
  return options.length === 4 && norms.size === 4 && keys.size === 4 ? options : null;
}

export const ayahKey = (s: number, a: number) => `${s}:${a}`;
export const nextAyah = (view: View, s: number, a: Ayah): Ayah | undefined =>
  view.surahs.get(s)?.ayahs[a.a]; // ayah numbers are 1-based, so index a.a is the following ayah
