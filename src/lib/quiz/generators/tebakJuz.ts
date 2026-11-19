import { pickDistinct, assembleOptions, scopeItems, type Generator } from "./shared";

const MIN_WORDS = 3;
const MAX_WORDS = 20;
const NEAR = 3;

const juzOption = (n: number) => ({ key: `j${n}`, label: { type: "juz" as const, n } });
const ALL_JUZ = Array.from({ length: 30 }, (_, i) => i + 1);

export const tebakJuz: Generator = {
  pool(ctx) {
    return scopeItems(ctx.view).filter(
      ({ a }) => a.words.length >= MIN_WORDS && !ctx.view.data.ambiguous.has(a.g),
    );
  },

  make(ctx, { s, a }, index) {
    const { rng, config } = ctx;
    const others = ALL_JUZ.filter((j) => j !== a.juz);
    const near = others.filter((j) => Math.abs(j - a.juz) <= NEAR);
    const tiers = config.difficulty === "sulit" ? [near, others] : [others];
    const picked = pickDistinct(tiers, 3, rng, (c, chosen) => !chosen.includes(c));
    if (!picked) return null;
    const opts = [a.juz, ...picked].map(juzOption);
    const options = assembleOptions(rng, opts[0]!, opts.slice(1));
    if (!options) return null;
    const long = a.words.length > MAX_WORDS;
    return {
      id: `q${index + 1}-${s}-${a.a}`,
      mode: "tebak-juz",
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
