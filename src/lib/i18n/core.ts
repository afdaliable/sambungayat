/**
 * Language-neutral i18n core (pure; safe for the browser bundle - the dictionary loader lives in index.ts). Indonesian is the default and lives at the site root (no prefix), so every
 * link shared before i18n keeps working; other languages live under /<code>/.
 *
 * Dictionaries are JSON files at locales/<lang>/<namespace>.json (outside src/ because they hold non-ASCII
 * text). A key is "<namespace>.<key>". Missing keys fall back to Indonesian, then to the key itself.
 */
export type Dir = "ltr" | "rtl";
export type LangInfo = { name: string; dir: Dir; locale: string; ogLocale: string };

export const DEFAULT_LANG = "id";
export const LANGS = {
  id: { name: "Bahasa Indonesia", dir: "ltr", locale: "id-ID", ogLocale: "id_ID" },
  en: { name: "English", dir: "ltr", locale: "en-US", ogLocale: "en_US" },
  ms: { name: "Bahasa Melayu", dir: "ltr", locale: "ms-MY", ogLocale: "ms_MY" },
  tr: { name: "Turkce", dir: "ltr", locale: "tr-TR", ogLocale: "tr_TR" },
  fr: { name: "Francais", dir: "ltr", locale: "fr-FR", ogLocale: "fr_FR" },
  es: { name: "Espanol", dir: "ltr", locale: "es-ES", ogLocale: "es_ES" },
  de: { name: "Deutsch", dir: "ltr", locale: "de-DE", ogLocale: "de_DE" },
  ru: { name: "Russkij", dir: "ltr", locale: "ru-RU", ogLocale: "ru_RU" },
  bn: { name: "Bangla", dir: "ltr", locale: "bn-BD", ogLocale: "bn_BD" },
  hi: { name: "Hindi", dir: "ltr", locale: "hi-IN", ogLocale: "hi_IN" },
  ar: { name: "Arabic", dir: "rtl", locale: "ar", ogLocale: "ar_AR" },
  ur: { name: "Urdu", dir: "rtl", locale: "ur-PK", ogLocale: "ur_PK" },
} as const satisfies Record<string, LangInfo>;
export type Lang = keyof typeof LANGS;
export const LANG_CODES = Object.keys(LANGS) as Lang[];
/** Languages served under a /<code>/ prefix. */
export const PREFIXED_LANGS = LANG_CODES.filter((l) => l !== DEFAULT_LANG);

export const isLang = (v: unknown): v is Lang => typeof v === "string" && v in LANGS;

export type Dict = Record<string, string>;

/** Translate with {name} placeholders. Falls back to the key so a missing string is visible, not blank. */
export function t(dict: Dict, key: string, vars?: Record<string, string | number>): string {
  const raw = dict[key] ?? key;
  return vars ? raw.replace(/\{(\w+)\}/g, (_, n: string) => String(vars[n] ?? `{${n}}`)) : raw;
}

/** Plural form: looks up "<key>.<category>" (zero|one|two|few|many|other) and falls back to "<key>.other". */
export function tp(
  lang: Lang,
  dict: Dict,
  key: string,
  n: number,
  vars?: Record<string, string | number>,
) {
  const cat = new Intl.PluralRules(LANGS[lang].locale).select(n);
  const k = `${key}.${cat}` in dict ? `${key}.${cat}` : `${key}.other`;
  return t(dict, k, { n, ...vars });
}

/** Prefix an absolute site path with the language ("/kuis?x" -> "/en/kuis?x"; Indonesian unchanged). */
export function localePath(lang: Lang, path: string): string {
  if (lang === DEFAULT_LANG) return path;
  if (path === "/") return `/${lang}`;
  return `/${lang}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Strip a leading language prefix from a pathname. */
export function stripLang(pathname: string): { lang: Lang; path: string } {
  const m = /^\/([a-z]{2,3})(\/.*)?$/.exec(pathname);
  if (m && isLang(m[1]) && m[1] !== DEFAULT_LANG) return { lang: m[1], path: m[2] || "/" };
  return { lang: DEFAULT_LANG, path: pathname };
}
