import { normalizeArabic } from "../../quran/normalize";
import {
  assembleOptions,
  ayahKey,
  pickDistinct,
  scopeItems,
  type Generator,
  type Item,
} from "./shared";

const MIN_WORDS = 5;
const MIN_VISIBLE = 3;

export const lengkapi: Generator = {
  pool: (ctx) => scopeItems(ctx.view).filter(({ a }) => a.words.length >= MIN_WORDS),

  make(ctx, { s, a }, index) {
    const { view, rng, config } = ctx;
    const want = config.difficulty === "mudah" ? 1 : 2 + rng.int(2);
    const k = Math.min(want, a.words.length - MIN_VISIBLE);
    const visible = a.words.slice(0, a.words.length - k);
    const tail = a.words.slice(a.words.length - k);
    const tailNorm = normalizeArabic(tail.join(" "));
    const prefixNorm = normalizeArabic(visible.join(" ")) + " ";

    // Reject if the same opening is completed differently elsewhere in loaded data.
    for (const o of view.all) {
      if (
        o.a.g !== a.g &&
        o.a.arNorm.startsWith(prefixNorm) &&
        !o.a.arNorm.endsWith(" " + tailNorm)
      )
        return null;
    }

    const tailOf = (it: Item) => it.a.words.slice(it.a.words.length - k).join(" ");
    const ok = (c: Item, chosen: readonly Item[]) => {
      if (c.a.g === a.g || c.a.words.length < k) return false;
      const n = normalizeArabic(tailOf(c));
      return n !== tailNorm && !chosen.some((x) => normalizeArabic(tailOf(x)) === n);
    };
    const sameSurah = view.surahs.get(s)!.ayahs.map((x) => ({ s, a: x }));
    const inScope = view.all.filter(view.inScope);
    const outside = view.all.filter((c) => !view.inScope(c));
    const tiers =
      config.difficulty === "sulit" ? [sameSurah, inScope, outside] : [inScope, outside];
    const picked = pickDistinct(tiers, 3, rng, ok);
    if (!picked) return null;

    const mk = (it: Item) => ({
      key: ayahKey(it.s, it.a.a),
      label: { type: "ayah" as const, text: tailOf(it) },
    });
    const correct = {
      key: ayahKey(s, a.a),
      label: { type: "ayah" as const, text: tail.join(" ") },
    };
    const options = assembleOptions(rng, correct, picked.map(mk));
    if (!options) return null;

    return {
      id: `q${index + 1}-${s}-${a.a}`,
      mode: "lengkapi",
      prompt: { ayahRef: { s, a: a.a }, text: visible.join(" "), hiddenWords: k },
      options,
      correctKey: correct.key,
      source: { s, a: a.a },
      answerTranslation: a.id,
    };
  },
};
