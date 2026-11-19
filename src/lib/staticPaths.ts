import { readFileSync } from "node:fs";
import type { JuzMeta, SurahMeta } from "./quran/types";
import { PREFIXED_LANGS, type Lang } from "./i18n";

/** Reads the built data at build time, so `npm run data:build` must run first. */
const readJson = <T>(file: string) =>
  JSON.parse(readFileSync(`public/data/v1/${file}`, "utf8")) as T;

export function surahPaths() {
  const all = readJson<SurahMeta[]>("index.json");
  return all.map((s, i) => {
    // First ayahs, taken from the built data (never typed by hand).
    const file = readJson<{ ayahs: { a: number; ar: string; id: string }[] }>(
      `surah/${String(s.n).padStart(3, "0")}.json`,
    );
    return {
      slug: s.slug,
      props: { s, prev: all[i - 1], next: all[i + 1], sample: file.ayahs.slice(0, 3) },
    };
  });
}

export function juzPaths() {
  const surahs = readJson<SurahMeta[]>("index.json");
  return readJson<JuzMeta[]>("juz.json").map((j) => ({
    n: String(j.juz),
    props: { j, list: j.surahs.map((n) => surahs[n - 1]!) },
  }));
}

/** Cross product of prefixed languages and page paths, for [lang]/ routes. */
export function forLangs<P extends { props: object }>(
  paths: P[],
  key: keyof P & string,
): { params: { lang: Lang } & Record<string, string>; props: P["props"] & { lang: Lang } }[] {
  return PREFIXED_LANGS.flatMap((lang) =>
    paths.map((p) => ({
      params: { lang, [key]: String(p[key]) } as { lang: Lang } & Record<string, string>,
      props: { ...p.props, lang },
    })),
  );
}
