// Server-side entry: re-exports the pure core and adds the dictionary loader (Vite globs all locale files,
// so client code must import from "./core" instead to keep dictionaries out of the browser bundle).
import { DEFAULT_LANG, type Dict, type Lang } from "./core";
export * from "./core";

const files = import.meta.glob("../../../locales/*/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Dict>;

const byLang = new Map<string, Map<string, Dict>>(); // lang -> namespace -> dict
for (const [file, dict] of Object.entries(files)) {
  const m = /locales\/([^/]+)\/([^/]+)\.json$/.exec(file);
  if (!m) continue;
  const [, lang, ns] = m as unknown as [string, string, string];
  if (!byLang.has(lang)) byLang.set(lang, new Map());
  byLang.get(lang)!.set(ns, dict);
}

/** Flat dictionary ("ns.key" -> text) for the given namespaces (all when omitted), with Indonesian fallback. */
export function getDict(lang: Lang, namespaces?: readonly string[]): Dict {
  const out: Dict = {};
  for (const l of lang === DEFAULT_LANG ? [DEFAULT_LANG] : [DEFAULT_LANG, lang]) {
    const nss = byLang.get(l);
    if (!nss) continue;
    for (const [ns, dict] of nss) {
      if (namespaces && !namespaces.includes(ns)) continue;
      for (const [k, v] of Object.entries(dict)) out[`${ns}.${k}`] = v;
    }
  }
  return out;
}
