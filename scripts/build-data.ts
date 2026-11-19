import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { BOM, normalizeArabic } from "../src/lib/quran/normalize";
import { tokenize } from "../src/lib/quran/tokenize";
import type { Ayah, JuzMeta, SurahFile, SurahMeta } from "../src/lib/quran/types";

type RawAyah = { number: number; text: string; numberInSurah: number; juz: number; page: number };
type RawSurah = {
  number: number;
  name: string;
  englishName: string;
  revelationType: string;
  ayahs: RawAyah[];
};
type Raw = { data: { surahs: RawSurah[] } };

const OUT = "public/data/v1";
// Indonesian transliterated surah names (hand-maintained, not Quran text); the API only has English transliterations.
const namesId = JSON.parse(await readFile("data/surah-names-id.json", "utf8")) as string[];
if (namesId.length !== 114) throw new Error("data/surah-names-id.json must list 114 names");
const DATA_VERSION = 1;

const read = async (f: string) => JSON.parse(await readFile(`data/raw/${f}`, "utf8")) as Raw;
const ar = (await read("quran-uthmani.json")).data.surahs;
const idn = (await read("id.indonesian.json")).data.surahs;
if (ar.length !== 114 || idn.length !== 114) throw new Error("expected 114 surahs in raw data");

const bom = (s: string) => s.replaceAll(BOM, "").trim();

// Basmalah = surah 1 ayah 1, as word tokens.
const basmalahWords = tokenize(bom(ar[0]!.ayahs[0]!.text));
const basmalahNorm = basmalahWords.map(normalizeArabic);

function stripBasmalah(text: string, surah: number): string {
  if (surah === 1 || surah === 9) return bom(text);
  const words = bom(text).split(/\s+/);
  const head = words.slice(0, basmalahWords.length).map(normalizeArabic);
  if (head.join(" ") !== basmalahNorm.join(" "))
    throw new Error(`surah ${surah} ayah 1 does not start with Basmalah`);
  return words.slice(basmalahWords.length).join(" ");
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replaceAll("'", "")
    .replaceAll(String.fromCharCode(0x2019), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const surahs: SurahFile[] = [];
const metas: SurahMeta[] = [];
const normCount = new Map<string, number>();

for (const s of ar) {
  const tr = idn[s.number - 1]!;
  const nameLatin = namesId[s.number - 1]!;
  const slug = slugify(nameLatin);
  const ayahs: Ayah[] = s.ayahs.map((a, i) => {
    const t = tr.ayahs[i]!;
    if (t.number !== a.number) throw new Error(`translation misaligned at global ${a.number}`);
    const text = a.numberInSurah === 1 ? stripBasmalah(a.text, s.number) : bom(a.text);
    const arNorm = normalizeArabic(text);
    normCount.set(arNorm, (normCount.get(arNorm) ?? 0) + 1);
    return {
      a: a.numberInSurah,
      g: a.number,
      juz: a.juz,
      page: a.page,
      ar: text,
      arNorm,
      words: tokenize(text),
      id: t.text.trim(),
    };
  });
  surahs.push({ n: s.number, slug, nameLatin, ayahs });
  metas.push({
    n: s.number,
    slug,
    nameAr: s.name,
    nameLatin,
    revelation: s.revelationType === "Meccan" ? "Makkiyah" : "Madaniyah",
    ayahCount: ayahs.length,
    juz: [...new Set(ayahs.map((a) => a.juz))],
    hasBasmalah: s.number !== 1 && s.number !== 9, // surah 1 has it as ayah 1
  });
}

const juz: JuzMeta[] = [];
for (let j = 1; j <= 30; j++) {
  const list = surahs.flatMap((s) =>
    s.ayahs.filter((a) => a.juz === j).map((a) => ({ s: s.n, a: a.a })),
  );
  if (list.length === 0) throw new Error(`juz ${j} empty`);
  juz.push({
    juz: j,
    start: list[0]!,
    end: list[list.length - 1]!,
    surahs: [...new Set(list.map((x) => x.s))],
  });
}

const ambiguous = surahs.flatMap((s) =>
  s.ayahs.filter((a) => normCount.get(a.arNorm)! > 1).map((a) => a.g),
);

await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/surah`, { recursive: true });
const hashes: Record<string, string> = {};
async function emit(rel: string, value: unknown) {
  const body = JSON.stringify(value);
  await writeFile(`${OUT}/${rel}`, body);
  hashes[rel] = createHash("sha256").update(body).digest("hex").slice(0, 16);
}
await emit("index.json", metas);
await emit("juz.json", juz);
await emit("ambiguous.json", ambiguous);
for (const s of surahs) await emit(`surah/${String(s.n).padStart(3, "0")}.json`, s);
// Extra translation languages: one array of ayah texts per surah, under tr/<lang>/ (additive; surah files stay as is).
const trConfig = JSON.parse(await readFile("data/translations.json", "utf8")) as Record<
  string,
  { edition: string }
>;
for (const [lang, { edition }] of Object.entries(trConfig)) {
  const raw = (await read(`tr.${edition}.json`)).data.surahs;
  if (raw.length !== 114) throw new Error(`${edition}: expected 114 surahs`);
  await mkdir(`${OUT}/tr/${lang}`, { recursive: true });
  for (const s of surahs) {
    const src = raw[s.n - 1]!;
    if (src.ayahs.length !== s.ayahs.length) throw new Error(`${edition}: ayah count mismatch in ${s.n}`);
    const texts = src.ayahs.map((a: { text: string }) => a.text.trim());
    if (texts.some((x: string) => !x)) throw new Error(`${edition}: empty text in surah ${s.n}`);
    await emit(`tr/${lang}/${String(s.n).padStart(3, "0")}.json`, texts);
  }
}
await writeFile(
  `${OUT}/manifest.json`,
  JSON.stringify({ version: DATA_VERSION, builtAt: new Date().toISOString(), files: hashes }),
);
console.log(`data built: ${surahs.length} surahs, ${ambiguous.length} ambiguous ayahs`);
