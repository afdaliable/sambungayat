import { readFileSync } from "node:fs";
import { DEFAULT_LANG, type Lang } from "./i18n/core";

/** Build-time: ayah texts for one surah in `lang` (undefined for Indonesian, which is inside the surah file). */
export function trTexts(lang: Lang, surah: number): string[] | undefined {
  if (lang === DEFAULT_LANG) return undefined;
  return JSON.parse(
    readFileSync(`public/data/v1/tr/${lang}/${String(surah).padStart(3, "0")}.json`, "utf8"),
  ) as string[];
}
