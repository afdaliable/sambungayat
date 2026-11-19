import { readFile } from "node:fs/promises";
import { BOM, normalizeArabic } from "../src/lib/quran/normalize";
import { HAS_LETTER } from "../src/lib/quran/tokenize";
import type { JuzMeta, SurahFile, SurahMeta } from "../src/lib/quran/types";

const DIR = "public/data/v1";
const errors: string[] = [];
const check = (ok: boolean, msg: string) => {
  if (!ok) errors.push(msg);
};
const load = async <T>(f: string) => JSON.parse(await readFile(`${DIR}/${f}`, "utf8")) as T;

type RawMeta = {
  data: {
    ayahs: { count: number };
    surahs: { references: { number: number; numberOfAyahs: number }[] };
    juzs: { references: { surah: number; ayah: number }[] };
  };
};
const rawMeta = JSON.parse(await readFile("data/raw/meta.json", "utf8")) as RawMeta;
const index = await load<SurahMeta[]>("index.json");
const juz = await load<JuzMeta[]>("juz.json");
check(index.length === 114, `expected 114 surahs, got ${index.length}`);
check(new Set(index.map((m) => m.slug)).size === index.length, "slugs not unique");
check(/^[a-z0-9-]+$/.test(index.map((m) => m.slug).join("-")), "slug not kebab-case ASCII");

const surahs: SurahFile[] = [];
for (let n = 1; n <= 114; n++)
  surahs.push(await load<SurahFile>(`surah/${String(n).padStart(3, "0")}.json`));

let total = 0;
let expectedG = 1;
const juzSeen = new Set<number>();
for (const s of surahs) {
  const meta = index[s.n - 1]!;
  check(meta.n === s.n && meta.slug === s.slug, `surah ${s.n}: meta mismatch`);
  check(
    meta.ayahCount === s.ayahs.length,
    `surah ${s.n}: ayahCount ${meta.ayahCount} != ${s.ayahs.length}`,
  );
  total += s.ayahs.length;
  s.ayahs.forEach((a, i) => {
    check(a.a === i + 1, `surah ${s.n}: ayah numbering gap at ${i + 1}`);
    check(
      a.g === expectedG,
      `global number gap: expected ${expectedG}, got ${a.g} (${s.n}:${a.a})`,
    );
    expectedG++;
    check(!!a.ar && !!a.arNorm && !!a.id, `empty field at ${s.n}:${a.a}`);
    check(a.words.length > 0, `no words at ${s.n}:${a.a}`);
    check(
      a.words.every((w) => HAS_LETTER.test(w)),
      `symbol-only token at ${s.n}:${a.a}`,
    );
    check(
      normalizeArabic(a.words.join(" ")) === a.arNorm,
      `words/arNorm mismatch at ${s.n}:${a.a}`,
    );
    check(!a.ar.includes(BOM), `BOM left at ${s.n}:${a.a}`);
    juzSeen.add(a.juz);
  });
}
check(total === 6236, `expected 6236 ayahs, got ${total}`);
for (let j = 1; j <= 30; j++) check(juzSeen.has(j), `juz ${j} has no ayah`);
check(total === rawMeta.data.ayahs.count, `total ${total} != meta ayahs.count`);
for (const s of surahs) {
  const ref = rawMeta.data.surahs.references[s.n - 1]!;
  check(
    ref.number === s.n && ref.numberOfAyahs === s.ayahs.length,
    `surah ${s.n}: ayah count differs from meta`,
  );
}
rawMeta.data.juzs.references.forEach((r, i) => {
  const j = juz[i];
  check(
    !!j && j.start.s === r.surah && j.start.a === r.ayah,
    `juz ${i + 1}: start differs from meta`,
  );
});
check(juz.length === 30, `expected 30 juz entries, got ${juz.length}`);

// Basmalah handling
const basmalah = normalizeArabic(surahs[0]!.ayahs[0]!.ar);
for (const s of surahs) {
  if (s.n === 1) continue;
  check(!s.ayahs[0]!.arNorm.startsWith(basmalah), `surah ${s.n} ayah 1 still starts with Basmalah`);
}
check(
  surahs[26]!.ayahs.some((a) => a.arNorm.includes(basmalah)),
  "surah 27 lost its mid-surah Basmalah",
);
check(
  !index[8]!.hasBasmalah && !index[0]!.hasBasmalah && index[1]!.hasBasmalah,
  "hasBasmalah flags wrong",
);

if (errors.length) {
  console.error(`data:verify FAILED (${errors.length}):\n` + errors.slice(0, 30).join("\n"));
  process.exit(1);
}
console.log(`data:verify OK: 114 surahs, ${total} ayahs, 30 juz`);
