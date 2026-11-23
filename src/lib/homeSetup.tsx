import { createRoot } from "react-dom/client";
import QuizSetup from "../components/quiz/QuizSetup";
import { I18nProvider } from "./i18n/react";
import { DEFAULT_CONFIG, encodeConfig } from "./quiz/url";
import { browserLoader } from "./quran/loader";
import type { Dict, Lang } from "./i18n/core";
import { localePath } from "./i18n/core";

/**
 * Home page: swap the static mode/juz form for the full setup (multi-juz, surahs, ayah range, count,
 * difficulty). Loaded on demand so the home page itself ships no framework JS.
 */
export async function mountHomeSetup(
  host: HTMLElement,
  lang: Lang,
  dict: Dict,
  initial = DEFAULT_CONFIG,
) {
  const meta = await browserLoader.loadMeta();
  createRoot(host).render(
    <I18nProvider lang={lang} dict={dict}>
      <QuizSetup
        initial={initial}
        index={meta.index}
        juz={meta.juz}
        onStart={(c) => {
          // A real anchor click, so the Android app's link shim rewrites the path like any other link.
          const a = document.createElement("a");
          a.href = `${localePath(lang, "/kuis")}?${encodeConfig({ ...c, seed: "" })}`;
          a.click();
        }}
      />
    </I18nProvider>,
  );
}
