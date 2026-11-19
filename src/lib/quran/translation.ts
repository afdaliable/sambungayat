import type { Lang } from "../i18n/core";
import { DEFAULT_LANG } from "../i18n/core";

const pad = (n: number) => String(n).padStart(3, "0");
const cache = new Map<string, Promise<string[]>>();

/** Ayah texts of one surah in a non-default language (Indonesian ships inside the surah files). */
export function loadTranslation(lang: Lang, surah: number): Promise<string[]> {
  const key = `${lang}/${pad(surah)}`;
  let p = cache.get(key);
  if (!p) {
    p = fetch(`/data/v1/tr/${key}.json`).then((r) => {
      if (!r.ok) throw new Error(`translation ${key}: ${r.status}`);
      return r.json() as Promise<string[]>;
    });
    cache.set(key, p);
    p.catch(() => cache.delete(key)); // allow retry
  }
  return p;
}

/** One ayah's translation, or undefined for the default language or when it cannot be loaded. */
export async function translationOf(lang: Lang, s: number, a: number): Promise<string | undefined> {
  if (lang === DEFAULT_LANG) return undefined;
  try {
    return (await loadTranslation(lang, s))[a - 1];
  } catch {
    return undefined;
  }
}
