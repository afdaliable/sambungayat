import { useEffect, useState } from "react";
import { LANGS, type Dict, type Lang } from "../../lib/i18n/core";
import { I18nProvider, useI18n } from "../../lib/i18n/react";
import { browserLoader } from "../../lib/quran/loader";
import type { SurahMeta } from "../../lib/quran/types";
import { getHistory, type HistoryEntry } from "../../lib/storage/history";
import { getMastery } from "../../lib/storage/mastery";
import { modeText } from "./QuizSetup";
import BackupControls from "./BackupControls";

type Row = {
  s: number;
  attempts: number;
  correct: number;
  pct: number;
  last: string;
  priority: number;
};

function weakestRows(): Row[] {
  const bySurah = new Map<number, { attempts: number; correct: number; last: string }>();
  for (const cells of Object.values(getMastery())) {
    for (const [s, c] of Object.entries(cells)) {
      const acc = bySurah.get(Number(s)) ?? { attempts: 0, correct: 0, last: "" };
      acc.attempts += c.attempts;
      acc.correct += c.correct;
      if (c.lastPlayed > acc.last) acc.last = c.lastPlayed;
      bySurah.set(Number(s), acc);
    }
  }
  // Priority = weakness + staleness (1 point per idle day, capped at 30), so old weak spots resurface.
  const now = Date.now();
  return [...bySurah.entries()]
    .map(([s, v]) => {
      const pct = Math.round((v.correct / v.attempts) * 100);
      const idleDays = v.last
        ? Math.min(30, Math.max(0, (now - Date.parse(v.last)) / 86_400_000))
        : 0;
      return { s, ...v, pct, priority: 100 - pct + idleDays };
    })
    .sort((a, b) => b.priority - a.priority || b.attempts - a.attempts);
}

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
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
    setRows(weakestRows());
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
  const backup = (
    <BackupControls
      onImport={() => {
        setHistory(getHistory());
        setRows(weakestRows());
      }}
    />
  );

  return (
    <>
      {backup}
      {history.length === 0 ? (
        <div className="measure">
          <p className="text-lg">{t("quiz.history.empty")}</p>
          <a href={path("/kuis")} className="btn btn-lg mt-5">
            {t("quiz.history.start")}
          </a>
        </div>
      ) : (
        <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
          {weakest && (
            <a
              href={`${path("/kuis")}?mode=sambung&scope=surah:${weakest.s}&n=10&d=mudah`}
              className="btn btn-lg justify-self-start lg:col-span-2"
            >
              {t("quiz.history.weakest", { name: name(weakest.s) })}
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
                      <a
                        className="lnk inline-flex min-h-11 items-center"
                        href={`${path("/kuis")}?mode=sambung&scope=surah:${r.s}&n=10&d=mudah`}
                      >
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
                    <span className="block font-semibold">
                      {modeText(t, h.config.mode, "title")}
                    </span>
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
      )}
    </>
  );
}
