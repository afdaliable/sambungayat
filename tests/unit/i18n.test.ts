import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const LOCALES = "locales";
type Dict = Record<string, string>;

const langs = readdirSync(LOCALES).filter((d) => statSync(join(LOCALES, d)).isDirectory());
const load = (lang: string): Record<string, Dict> =>
  Object.fromEntries(
    readdirSync(join(LOCALES, lang))
      .filter((f) => f.endsWith(".json"))
      .map((f) => [
        f.slice(0, -5),
        JSON.parse(readFileSync(join(LOCALES, lang, f), "utf8")) as Dict,
      ]),
  );
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();

// Plural categories differ per language (ru: one/few/many/other, ms: other only), so keys are compared by "family":
// "x.one" / "x.few" / "x.other" all map to "x.#". Each family needs ".other"; placeholders are compared on ".other".
const CAT = /\.(zero|one|two|few|many|other)$/;
const families = (d: Dict) => {
  const out = new Map<string, Dict>();
  for (const [k, v] of Object.entries(d)) {
    const stem = CAT.test(k) ? k.replace(CAT, ".#") : k;
    const cat = CAT.exec(k)?.[1] ?? "";
    out.set(stem, { ...(out.get(stem) ?? {}), [cat]: v });
  }
  return out;
};
const isPluralFamily = (f: Dict) => Object.keys(f).some((c) => c !== "");

const base = load("id");

describe("locales", () => {
  it("has Indonesian as the reference language", () => {
    expect(langs).toContain("id");
  });

  for (const lang of langs.filter((l) => l !== "id")) {
    describe(lang, () => {
      const dict = load(lang);
      it("has the same namespaces as id", () => {
        expect(Object.keys(dict).sort()).toEqual(Object.keys(base).sort());
      });
      for (const ns of Object.keys(base)) {
        it(`${ns}: same keys and placeholders as id`, () => {
          const ref = families(base[ns]!);
          const cur = families(dict[ns] ?? {});
          expect([...cur.keys()].sort()).toEqual([...ref.keys()].sort());
          for (const [stem, rf] of ref) {
            const cf = cur.get(stem)!;
            if (isPluralFamily(rf)) {
              expect(cf.other, `${ns}.${stem} needs .other`).toBeTruthy();
              expect(placeholders(cf.other ?? ""), `${ns}.${stem}`).toEqual(
                placeholders(rf.other ?? ""),
              );
            } else {
              expect(placeholders(cf[""] ?? ""), `${ns}.${stem}`).toEqual(
                placeholders(rf[""] ?? ""),
              );
            }
          }
        });
      }
    });
  }

  for (const lang of langs) {
    it(`${lang}: every plural family has a .other form`, () => {
      for (const [ns, d] of Object.entries(load(lang)))
        for (const [stem, f] of families(d))
          if (isPluralFamily(f)) expect(f.other, `${ns}.${stem}`).toBeTruthy();
    });
  }
});

describe("ASCII rule", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  it("keeps src/ and scripts/ pure ASCII (non-ASCII text lives in locales/)", () => {
    const bad = [...walk("src"), ...walk("scripts")]
      .filter((f) => /\.(ts|tsx|astro|css|js|mjs|json)$/.test(f))
      .filter((f) => [...readFileSync(f, "utf8")].some((c) => c.charCodeAt(0) > 127));
    expect(bad).toEqual([]);
  });
});

// A key used in source must exist in the Indonesian dictionary (t() returns the raw key when it is missing,
// which showed up as "quiz.leave.title" on screen). Only literal keys are checked, not template strings.
describe("keys used in source exist", () => {
  const id = load("id");
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(tsx?|astro)$/.test(e.name)) files.push(p);
    }
  };
  walk("src");

  it("every literal t(\"ns.key\") resolves", () => {
    const missing: string[] = [];
    for (const f of files) {
      for (const m of readFileSync(f, "utf8").matchAll(/\bt\(\s*(?:dict,\s*)?"([a-z]+)\.([^"$]+)"/g)) {
        const [, ns, key] = m;
        if (id[ns!] && !(key! in id[ns!]!)) missing.push(`${f}: ${ns}.${key}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
