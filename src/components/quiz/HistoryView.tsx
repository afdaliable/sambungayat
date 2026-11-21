import { useEffect, useState } from "react";
import { LANGS, type Dict, type Lang } from "../../lib/i18n/core";
import { I18nProvider, useI18n } from "../../lib/i18n/react";
import { browserLoader } from "../../lib/quran/loader";
import type { SurahMeta } from "../../lib/quran/types";
import { getHistory, type HistoryEntry } from "../../lib/storage/history";
import { getMastery, weakestSurahs, type WeakRow } from "../../lib/storage/mastery";
import { modeText } from "./QuizSetup";

export default function HistoryView({ lang, dict }: { lang: Lang; dict: Dict }) {
  return (
    <I18nProvider lang={lang} dict={dict}>
      <HistoryInner />
    </I18nProvider>
  );
}

function HistoryInner() {
  const { t, lang, path } = useI18n();
  const [index, setIndex] = useState<SurahMeta[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [rows, setRows] = useState<WeakRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
    setRows(weakestSurahs(getMastery()));
    setReady(true);
    browserLoader
      .loadMeta()
      .then((m) => setIndex(m.index))
      .catch(() => {});
  }, []);

  if (!ready)
    return (
      <p role="status" className="py-10 text-center text-muted">
        {t("quiz.loading")}
      </p>
    );
  const name = (s: number) => index[s - 1]?.nameLatin ?? t("quiz.surah_n", { n: s });
  const weakest = rows[0];
  const practiceHref = (r: WeakRow) =>
    `${path("/kuis")}?mode=${r.mode}&scope=surah:${r.s}&n=10&d=mudah`;

  if (history.length === 0) {
    return (
      <div className="measure">
        <p className="text-lg">{t("quiz.history.empty")}</p>
        <a href={path("/kuis")} className="btn btn-lg mt-5">
          {t("quiz.history.start")}
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
      {weakest && (
        <a href={practiceHref(weakest)} className="btn btn-lg justify-self-start lg:col-span-2">
          {t("quiz.history.weakest", {
            name: name(weakest.s),
            mode: modeText(t, weakest.mode, "title"),
          })}
        </a>
      )}

      <section aria-labelledby="mastery-title">
        <h2 id="mastery-title" className="sub">
          {t("quiz.history.mastery")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("quiz.history.sorted")}</p>
        <ul className="rows mt-4">
          {rows.map((r) => (
            <li key={r.s} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-x-4">
                <span className="font-semibold">{name(r.s)}</span>
                <span className="flex items-center gap-4">
                  <span className="num text-lg font-extrabold">{r.pct}%</span>
                  <a className="lnk inline-flex min-h-11 items-center" href={practiceHref(r)}>
                    {t("quiz.history.practice")}
                  </a>
                </span>
              </div>
              <div role="presentation" className="h-1 bg-line">
                <div className="h-full bg-accent" style={{ width: `${r.pct}%` }} />
              </div>
              <p className="num mt-2 text-sm text-muted">
                {t("quiz.history.correct_of", { correct: r.correct, total: r.attempts })}
                {r.attempts < 5 && <> {t("quiz.history.low_data", { n: r.attempts })}</>}
                {" \u00b7 "}
                {t("quiz.history.weak_mode", { mode: modeText(t, r.mode, "title") })}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="history-title">
        <h2 id="history-title" className="sub">
          {t("quiz.history.recent")}
        </h2>
        <ul className="rows mt-4">
          {history.map((h, i) => (
            <li key={`${h.date}-${i}`} className="flex items-center justify-between gap-3 py-3">
              <span>
                <span className="block font-semibold">{modeText(t, h.config.mode, "title")}</span>
                <span className="num block text-sm text-muted">
                  {new Date(h.date).toLocaleString(LANGS[lang].locale)}
                </span>
              </span>
              <span className="stamp-mini text-lg">
                {h.score}/{h.total}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
