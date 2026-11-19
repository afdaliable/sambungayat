import type { SurahMeta } from "../../quran/types";
import { pickDistinct, assembleOptions, scopeItems, type Generator } from "./shared";

const MIN_WORDS = 3;
const MAX_WORDS = 20;
const NEAR = 5;

const surahOption = (m: SurahMeta) => ({
  key: `s${m.n}`,
  label: { type: "surah" as const, n: m.n, nameLatin: m.nameLatin, nameAr: m.nameAr },
});

export const tebakSurah: Generator = {
  pool(ctx) {
    return scopeItems(ctx.view).filter(
      ({ a }) => a.words.length >= MIN_WORDS && !ctx.view.data.ambiguous.has(a.g),
    );
  },

  make(ctx, { s, a }, index) {
    const { view, rng, config } = ctx;
    const index_ = view.data.index;
    const correct = index_[s - 1]!;
    const others = index_.filter((m) => m.n !== s);
    const near = others.filter((m) => Math.abs(m.n - s) <= NEAR);
    const sameJuz = others.filter((m) => m.juz.some((j) => correct.juz.includes(j)));
    const inScope = others.filter((m) => view.scopeSet.has(m.n));
    const tiers =
      config.difficulty === "sulit"
        ? [near, sameJuz, inScope, others]
        : [inScope, near, sameJuz, others];
    const picked = pickDistinct(tiers, 3, rng, (c, chosen) => !chosen.some((x) => x.n === c.n));
    if (!picked) return null;
    const opts = [correct, ...picked].map(surahOption);
    const options = assembleOptions(rng, opts[0]!, opts.slice(1));
    if (!options) return null;

    const long = a.words.length > MAX_WORDS;
    return {
      id: `q${index + 1}-${s}-${a.a}`,
      mode: "tebak-surah",
      prompt: {
        text: a.words.slice(0, long ? MAX_WORDS : undefined).join(" "),
        ...(long ? { ellipsisEnd: true } : {}),
      },
      options,
      correctKey: opts[0]!.key,
      source: { s, a: a.a },
      answerTranslation: a.id,
    };
  },
};
