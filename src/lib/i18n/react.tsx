import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LANG, localePath, t as tr, tp as tpl, type Dict, type Lang } from "./core";

type Ctx = {
  lang: Lang;
  dict: Dict;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tp: (key: string, n: number, vars?: Record<string, string | number>) => string;
  /** Language-aware internal path. */
  path: (p: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

/** Wrap each island root. `dict` holds only the namespaces that island needs (keeps props small). */
export function I18nProvider({
  lang,
  dict,
  children,
}: {
  lang: Lang;
  dict: Dict;
  children: ReactNode;
}) {
  const value = useMemo<Ctx>(
    () => ({
      lang,
      dict,
      t: (key, vars) => tr(dict, key, vars),
      tp: (key, n, vars) => tpl(lang, dict, key, n, vars),
      path: (p) => localePath(lang, p),
    }),
    [lang, dict],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Used outside a provider (e.g. an isolated test): behave like Indonesian with raw keys.
    return {
      lang: DEFAULT_LANG,
      dict: {},
      t: (key, vars) => tr({}, key, vars),
      tp: (key, n, vars) => tpl(DEFAULT_LANG, {}, key, n, vars),
      path: (p) => p,
    };
  }
  return ctx;
}
