import { audioUrl, DEFAULT_RECITER } from "../../../config/reciters";
import {
  assembleOptions,
  ayahKey,
  ayahOptionLabels,
  pickDistinct,
  scopeItems,
  type Generator,
  type Item,
} from "./shared";

export const tebakAudio: Generator = {
  // Repeated ayahs sound identical, so they cannot be told apart by audio.
  pool: (ctx) => scopeItems(ctx.view).filter(({ a }) => !ctx.view.data.ambiguous.has(a.g)),

  make(ctx, { s, a }, index) {
    const { view, rng, config } = ctx;
    const ok = (c: Item, chosen: readonly Item[]) =>
      c.a.arNorm !== a.arNorm && !chosen.some((x) => x.a.arNorm === c.a.arNorm);
    const sameSurah = view.surahs.get(s)!.ayahs.map((x) => ({ s, a: x }));
    const inScope = view.all.filter(view.inScope);
    const outside = view.all.filter((c) => !view.inScope(c));
    const tiers =
      config.difficulty === "sulit" ? [sameSurah, inScope, outside] : [inScope, outside];
    const picked = pickDistinct(tiers, 3, rng, ok);
    if (!picked) return null;

    const items = [{ s, a }, ...picked];
    const labels = ayahOptionLabels(items.map((i) => i.a));
    if (!labels) return null;
    const opts = items.map((it, i) => ({ key: ayahKey(it.s, it.a.a), label: labels[i]! }));
    const options = assembleOptions(rng, opts[0]!, opts.slice(1));
    if (!options) return null;

    return {
      id: `q${index + 1}-${s}-${a.a}`,
      mode: "tebak-audio",
      prompt: { ayahRef: { s, a: a.a }, audioUrl: audioUrl(DEFAULT_RECITER, s, a.a) },
      options,
      correctKey: opts[0]!.key,
      source: { s, a: a.a },
      answerTranslation: a.id,
    };
  },
};
