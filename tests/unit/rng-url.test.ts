import { describe, expect, it } from "vitest";
import { dailySeed, jakartaDate } from "../../src/lib/quiz/daily";
import { createRng, newSeed } from "../../src/lib/quiz/rng";
import { DEFAULT_CONFIG, decodeConfig, encodeConfig } from "../../src/lib/quiz/url";
import type { QuizConfig } from "../../src/lib/quiz/types";

const seq = (seed: string) => {
  const r = createRng(seed);
  return Array.from({ length: 8 }, () => r.next());
};

describe("rng", () => {
  it("same seed gives same sequence, different seed differs", () => {
    expect(seq("abc")).toEqual(seq("abc"));
    expect(seq("abc")).not.toEqual(seq("abd"));
  });
  it("shuffle is deterministic, a permutation, and does not mutate input", () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8];
    const a = createRng("x").shuffle(src);
    expect(a).toEqual(createRng("x").shuffle(src));
    expect([...a].sort()).toEqual(src);
    expect(src).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
  it("newSeed is short base36", () => {
    expect(newSeed()).toMatch(/^[a-z0-9]{1,8}$/);
  });
});

describe("daily seed", () => {
  it("uses the Asia/Jakarta calendar day", () => {
    // 17:30 UTC on 31 Dec is already 1 Jan in Jakarta (UTC+7)
    expect(jakartaDate(new Date("2026-12-31T17:30:00Z"))).toBe("2027-01-01");
    expect(jakartaDate(new Date("2026-12-31T16:30:00Z"))).toBe("2026-12-31");
    expect(dailySeed(new Date("2026-12-31T16:30:00Z"))).toBe("2026-12-31-harian-v1");
  });
});

describe("url", () => {
  const configs: QuizConfig[] = [
    {
      mode: "sambung",
      scope: { kind: "juz", juz: [30] },
      count: 10,
      difficulty: "sulit",
      seed: "abc123",
    },
    {
      mode: "tebak-surah",
      scope: { kind: "surah", surah: [55, 78] },
      count: 5,
      difficulty: "mudah",
      seed: "x-1",
    },
    {
      mode: "lengkapi",
      scope: { kind: "range", from: 1, to: 114 },
      count: 20,
      difficulty: "mudah",
      seed: "zz",
    },
    {
      mode: "tebak-audio",
      scope: { kind: "juz", juz: [1, 2] },
      count: 10,
      difficulty: "sulit",
      seed: "q",
    },
  ];
  it("keeps ':' and ',' readable in the query string", () => {
    expect(encodeConfig(configs[1]!)).toBe(
      "mode=tebak-surah&scope=surah:55,78&n=5&d=mudah&seed=x-1",
    );
  });
  it("round-trips", () => {
    for (const c of configs)
      expect(decodeConfig(encodeConfig(c))).toEqual({
        config: c,
        complete: true,
        fieldsValid: true,
      });
  });
  it("falls back to defaults on garbage without throwing", () => {
    for (const bad of [
      "",
      "mode=nope&scope=juz:99&n=7&d=x&seed=%%%",
      "scope=range:50-10",
      "scope=surah:abc,1",
      "scope=juz:",
      "n=999999999999999999999",
      "seed=" + "a".repeat(500),
    ]) {
      const r = decodeConfig(bad);
      expect(r.complete).toBe(false);
      expect({ ...r.config, seed: "" }).toEqual(DEFAULT_CONFIG);
    }
  });
  it("keeps valid fields when others are broken", () => {
    const r = decodeConfig("mode=lengkapi&scope=bogus&n=5");
    expect(r.config.mode).toBe("lengkapi");
    expect(r.config.count).toBe(5);
    expect(r.config.scope).toEqual(DEFAULT_CONFIG.scope);
    expect(r.complete).toBe(false);
  });
});
