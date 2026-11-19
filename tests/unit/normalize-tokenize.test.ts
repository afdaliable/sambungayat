import { describe, expect, it } from "vitest";
import { BOM, normalizeArabic } from "../../src/lib/quran/normalize";
import { HAS_LETTER, tokenize } from "../../src/lib/quran/tokenize";
import { loadAll } from "./helpers";

const ch = (...c: number[]) => String.fromCharCode(...c);
const MARK_RE = new RegExp(
  `[${ch(0x640)}${ch(0x64b)}-${ch(0x65f)}${ch(0x670)}${ch(0x6d6)}-${ch(0x6ed)}]`,
);

describe("normalizeArabic", () => {
  it("unifies alif variants and alif maqsura", () => {
    expect(normalizeArabic(ch(0x623, 0x625, 0x622, 0x671))).toBe(ch(0x627, 0x627, 0x627, 0x627));
    expect(normalizeArabic(ch(0x649))).toBe(ch(0x64a));
  });

  it("strips BOM, tatweel and collapses whitespace", () => {
    expect(normalizeArabic(`${BOM} ${ch(0x628)}${ch(0x640)}  ${ch(0x628)} `)).toBe(
      `${ch(0x628)} ${ch(0x628)}`,
    );
  });

  it("removes harakat and waqf marks from real ayahs, and is idempotent", async () => {
    const data = await loadAll();
    let withMarks = 0;
    for (const f of data.surahs.values()) {
      for (const a of f.ayahs) {
        if (MARK_RE.test(a.ar)) withMarks++;
        expect(MARK_RE.test(a.arNorm)).toBe(false);
        expect(normalizeArabic(a.ar)).toBe(a.arNorm);
        expect(normalizeArabic(a.arNorm)).toBe(a.arNorm);
      }
    }
    expect(withMarks).toBeGreaterThan(6000);
  });
});

describe("tokenize", () => {
  it("merges symbol-only tokens into the previous word", () => {
    const w = ch(0x628, 0x6d6);
    expect(tokenize(`${w} ${ch(0x6d6)} ${w}`)).toEqual([`${w} ${ch(0x6d6)}`, w]);
  });

  it("never yields a symbol-only token in real data", async () => {
    const data = await loadAll();
    let merged = 0;
    for (const f of data.surahs.values()) {
      for (const a of f.ayahs) {
        expect(a.words.length).toBeGreaterThan(0);
        for (const w of a.words) expect(HAS_LETTER.test(w)).toBe(true);
        if (a.words.some((w) => w.includes(" "))) merged++;
      }
    }
    expect(merged).toBeGreaterThan(0); // the merge path is actually exercised by the data
  });
});
