import type { Ayah } from "../../quran/types";
import {
  assembleOptions,
  ayahKey,
  ayahOptionLabels,
  pickDistinct,
  scopeItems,
  type Ctx,
  type Generator,
  type Item,
} from "./shared";

const NEAR = 10;
const LONG_WORDS = 12;
const HEAD_WORDS = 8;

const prevAyah = (ctx: Ctx, s: number, a: Ayah): Ayah | undefined =>
  a.a > 1 ? ctx.view.surahs.get(s)?.ayahs[a.a - 2] : undefined;

/** Mirror of sambung: given an ayah, pick the ayah that comes right before it. */
export const sebelum: Generator = {
  pool(ctx) {
    return scopeItems(ctx.view).filter(({ s, a }) => {
      const prev = prevAyah(ctx, s, a);
      if (!prev) return false;
      const before = ctx.view.prevOf.get(a.arNorm);
      return !before || (before.size === 1 && before.has(prev.arNorm));
    });
  },

  make(ctx: Ctx, { s, a }: Item, index) {
    const { view, rng, config } = ctx;
    const prev = prevAyah(ctx, s, a) as Ayah;
    const surah = view.surahs.get(s)!;
    const legit = view.prevOf.get(a.arNorm) ?? new Set<string>();

    const ok = (c: Item, chosen: readonly Item[]) =>
      c.a.arNorm !== prev.arNorm &&
      c.a.arNorm !== a.arNorm &&
      !legit.has(c.a.arNorm) &&
      !chosen.some((x) => x.a.arNorm === c.a.arNorm);

    const sameSurah = surah.ayahs.map((x) => ({ s, a: x }));
    const near = sameSurah.filter((c) => Math.abs(c.a.a - prev.a) <= NEAR);
    const far = sameSurah.filter((c) => Math.abs(c.a.a - prev.a) > NEAR);
    const otherInScope = view.all.filter((c) => c.s !== s && view.inScope(c));
    const outside = view.all.filter((c) => !view.inScope(c));
    const tiers =
      config.difficulty === "sulit"
        ? [near, far, otherInScope, outside]
        : [otherInScope, near, far, outside];

    const picked = pickDistinct(tiers, 3, rng, ok);
    if (!picked) return null;
    const items = [{ s, a: prev }, ...picked];
    const labels = ayahOptionLabels(items.map((i) => i.a));
    if (!labels) return null;
    const opts = items.map((it, i) => ({ key: ayahKey(it.s, it.a.a), label: labels[i]! }));
    const options = assembleOptions(rng, opts[0]!, opts.slice(1));
    if (!options) return null;

    const long = a.words.length > LONG_WORDS;
    return {
      id: `q${index + 1}-${s}-${a.a}`,
      mode: "sebelum",
      prompt: {
        ayahRef: { s, a: a.a },
        text: a.words.slice(0, long ? HEAD_WORDS : undefined).join(" "),
        ...(long ? { ellipsisEnd: true } : {}),
      },
      options,
      correctKey: opts[0]!.key,
      source: { s, a: prev.a },
      answerTranslation: prev.id,
    };
  },
};
