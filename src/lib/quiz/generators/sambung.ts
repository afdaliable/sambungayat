import type { Ayah } from "../../quran/types";
import {
  assembleOptions,
  ayahKey,
  ayahOptionLabels,
  nextAyah,
  pickDistinct,
  scopeItems,
  tailExcerpt,
  type Ctx,
  type Generator,
  type Item,
} from "./shared";

const NEAR = 10;

export const sambung: Generator = {
  pool(ctx) {
    return scopeItems(ctx.view).filter(({ s, a }) => {
      const next = nextAyah(ctx.view, s, a);
      if (!next) return false;
      // Ambiguous context: the same ayah text is followed by different ayahs somewhere in loaded data.
      const follow = ctx.view.nextOf.get(a.arNorm);
      return !follow || (follow.size === 1 && follow.has(next.arNorm));
    });
  },

  make(ctx: Ctx, { s, a }: Item, index) {
    const { view, rng, config } = ctx;
    const next = nextAyah(view, s, a) as Ayah;
    const surah = view.surahs.get(s)!;
    const legit = view.nextOf.get(a.arNorm) ?? new Set<string>();

    const ok = (c: Item, chosen: readonly Item[]) =>
      c.a.arNorm !== next.arNorm &&
      c.a.arNorm !== a.arNorm &&
      !legit.has(c.a.arNorm) &&
      !chosen.some((x) => x.a.arNorm === c.a.arNorm);

    const sameSurah = surah.ayahs.map((x) => ({ s, a: x }));
    const near = sameSurah.filter((c) => Math.abs(c.a.a - next.a) <= NEAR);
    const far = sameSurah.filter((c) => Math.abs(c.a.a - next.a) > NEAR);
    const otherInScope = view.all.filter((c) => c.s !== s && view.inScope(c));
    const outside = view.all.filter((c) => !view.inScope(c));
    const tiers =
      config.difficulty === "sulit"
        ? [near, far, otherInScope, outside]
        : [otherInScope, near, far, outside];

    const picked = pickDistinct(tiers, 3, rng, ok);
    if (!picked) return null;
    const items = [{ s, a: next }, ...picked];
    const labels = ayahOptionLabels(items.map((i) => i.a));
    if (!labels) return null;
    const opts = items.map((it, i) => ({ key: ayahKey(it.s, it.a.a), label: labels[i]! }));
    const options = assembleOptions(rng, opts[0]!, opts.slice(1));
    if (!options) return null;

    return {
      id: `q${index + 1}-${s}-${a.a}`,
      mode: "sambung",
      prompt: { ayahRef: { s, a: a.a }, ...tailExcerpt(a.words) },
      options,
      correctKey: opts[0]!.key,
      source: { s, a: a.a },
      answerTranslation: next.id,
    };
  },
};
