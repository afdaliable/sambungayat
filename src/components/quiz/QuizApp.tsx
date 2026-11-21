import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { I18nProvider, useI18n } from "../../lib/i18n/react";
import type { Dict, Lang } from "../../lib/i18n/core";
import { browserLoader } from "../../lib/quran/loader";
import type { JuzMeta, SurahMeta } from "../../lib/quran/types";
import { generateQuiz } from "../../lib/quiz/engine";
import { newSeed } from "../../lib/quiz/rng";
import type { Quiz, QuizConfig } from "../../lib/quiz/types";
import {
  DAILY_COUNT,
  dailySeed,
  formatCountdown,
  jakartaDate,
  msUntilNextDaily,
} from "../../lib/quiz/daily";
import { DEFAULT_CONFIG, decodeConfig, encodeConfig } from "../../lib/quiz/url";
import { playTone } from "../../lib/sound";
import ReminderToggle from "./ReminderToggle";
import { computeStreak } from "../../lib/streak";
import { getDaily, recordDaily, type DailyRecord } from "../../lib/storage/daily";
import { countQuiz, scoreBucket, track } from "../../lib/analytics";
import { LEAVE_EVENT } from "../../lib/native/platform";
import { addHistory } from "../../lib/storage/history";
import { recordMastery } from "../../lib/storage/mastery";
import { applySettings, getSettings, useSettings } from "../../lib/storage/settings";
import SettingsSheet from "../ui/SettingsSheet";
import ParafStrip from "./ParafStrip";
import QuestionView from "./QuestionView";
import QuizSetup, { modeText } from "./QuizSetup";
import ResultView from "./ResultView";

type State =
  | { phase: "boot" }
  | { phase: "setup" }
  | { phase: "loading"; config: QuizConfig }
  | { phase: "error"; config: QuizConfig }
  | { phase: "playing"; quiz: Quiz; current: number; answers: Record<string, string> }
  | { phase: "result"; quiz: Quiz; answers: Record<string, string> };

type Action =
  | { type: "setup" }
  | { type: "loading"; config: QuizConfig }
  | { type: "error"; config: QuizConfig }
  | { type: "ready"; quiz: Quiz }
  | { type: "answer"; id: string; key: string }
  | { type: "next" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setup":
      return { phase: "setup" };
    case "loading":
      return { phase: "loading", config: action.config };
    case "error":
      return { phase: "error", config: action.config };
    case "ready":
      return { phase: "playing", quiz: action.quiz, current: 0, answers: {} };
    case "answer":
      if (state.phase !== "playing" || state.answers[action.id] !== undefined) return state;
      return { ...state, answers: { ...state.answers, [action.id]: action.key } };
    case "next":
      if (state.phase !== "playing") return state;
      return state.current + 1 >= state.quiz.questions.length
        ? { phase: "result", quiz: state.quiz, answers: state.answers }
        : { ...state, current: state.current + 1 };
  }
}

type Meta = { index: SurahMeta[]; juz: JuzMeta[] };

function Countdown() {
  // Start empty so server HTML and first client render match; the real value needs the client clock.
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setMs(msUntilNextDaily());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="num font-semibold">{ms === null ? "--:--:--" : formatCountdown(ms)}</span>
  );
}

function StreakLine({ dep }: { dep?: unknown }) {
  const { t } = useI18n();
  const [s, setS] = useState({ current: 0, best: 0 });
  useEffect(() => setS(computeStreak(Object.keys(getDaily()), jakartaDate())), [dep]);
  if (s.current < 1) return null;
  return (
    <span className="num font-semibold">
      {t("quiz.daily.streak", { n: s.current, best: s.best })}
    </span>
  );
}

function DailyBanner() {
  const { t } = useI18n();
  const [rec, setRec] = useState<DailyRecord>();
  useEffect(() => setRec(getDaily()[jakartaDate()]), []);
  return (
    <>
      <p className="mb-5 border-y border-line py-3 text-sm text-muted">
        {rec ? `${t("quiz.daily.official", { score: rec.score, total: rec.total })} ` : ""}
        {t("quiz.daily.next")} <Countdown /> {t("quiz.tz")}
        <br />
        <StreakLine />
      </p>
      <ReminderToggle />
    </>
  );
}

const dailyConfig = (): QuizConfig => ({
  mode: "sambung",
  scope: { kind: "juz", juz: [30] },
  count: DAILY_COUNT,
  difficulty: "mudah",
  seed: dailySeed(),
});

type Props = { daily?: boolean; lang: Lang; dict: Dict };

export default function QuizApp({ daily = false, lang, dict }: Props) {
  return (
    <I18nProvider lang={lang} dict={dict}>
      <QuizAppInner daily={daily} />
    </I18nProvider>
  );
}

function QuizAppInner({ daily = false }: { daily?: boolean }) {
  const { t, path } = useI18n();
  const settings = useSettings();
  const [state, dispatch] = useReducer(reducer, { phase: "boot" });
  const [meta, setMeta] = useState<Meta | null>(null);
  const [initial, setInitial] = useState<QuizConfig>(DEFAULT_CONFIG);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const saved = useRef<Quiz | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const [dailyRec, setDailyRec] = useState<DailyRecord>();

  const start = useCallback(
    async (config: QuizConfig, mode: "push" | "replace" | "none") => {
      dispatch({ type: "loading", config });
      track("quiz_start", {
        mode: config.mode,
        scope: config.scope.kind,
        count: config.count,
        difficulty: config.difficulty,
      });
      const url = `${path("/kuis")}?${encodeConfig(config)}`;
      if (mode === "push") history.pushState(null, "", url);
      else if (mode === "replace") history.replaceState(null, "", url);
      try {
        const data = await browserLoader.load(config.scope);
        setMeta({ index: data.index, juz: data.juz });
        dispatch({ type: "ready", quiz: generateQuiz(config, data) });
      } catch {
        dispatch({ type: "error", config });
      }
    },
    [path],
  );

  useEffect(() => {
    applySettings(getSettings());
    browserLoader
      .loadMeta()
      .then(setMeta)
      .catch(() => dispatch({ type: "error", config: DEFAULT_CONFIG }));
    if (daily) {
      void start(dailyConfig(), "none");
      return;
    }
    const { config, fieldsValid } = decodeConfig(location.search);
    setInitial(config);
    if (fieldsValid) void start({ ...config, seed: config.seed || newSeed() }, "replace");
    else dispatch({ type: "setup" });
  }, [start, daily]);

  // Browser/Android back: the URL is the source of truth (reload is avoided: it would 404 inside the app).
  useEffect(() => {
    if (daily) return;
    const onPop = () => {
      const { config, fieldsValid } = decodeConfig(location.search);
      if (fieldsValid) void start({ ...config, seed: config.seed || newSeed() }, "none");
      else {
        setInitial(config);
        dispatch({ type: "setup" });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [start, daily]);

  // Persist once per finished quiz.
  useEffect(() => {
    if (state.phase !== "result" || saved.current === state.quiz) return;
    saved.current = state.quiz;
    if (state.quiz.retry) {
      track("retry_wrong_done");
      return;
    }
    const { quiz, answers } = state;
    const played = quiz.questions.filter((q) => answers[q.id] !== "skip");
    const date = new Date().toISOString();
    const score = played.filter((q) => answers[q.id] === q.correctKey).length;
    countQuiz(quiz.config.mode);
    track("quiz_complete", {
      mode: quiz.config.mode,
      score: scoreBucket(played.length ? Math.round((score / played.length) * 100) : 0),
      daily: Boolean(daily),
    });
    if (daily) setDailyRec(recordDaily(quiz.config.seed.slice(0, 10), score, played.length));
    addHistory({
      date,
      config: quiz.config,
      score,
      total: played.length,
      wrong: played.filter((q) => answers[q.id] !== q.correctKey).map((q) => q.source),
    });
    recordMastery(
      quiz.config.mode,
      played.map((q) => ({ s: q.source.s, correct: answers[q.id] === q.correctKey })),
      date,
    );
  }, [state, daily]);

  // Android Back button: while a quiz is in progress it asks first (src/lib/native/back.ts).
  const busy = state.phase === "playing" && state.quiz.questions.length > 0;
  useEffect(() => {
    if (!busy) return;
    const root = document.documentElement;
    root.dataset.quizBusy = "1";
    const ask = () => setLeaveOpen(true);
    window.addEventListener(LEAVE_EVENT, ask);
    return () => {
      delete root.dataset.quizBusy;
      window.removeEventListener(LEAVE_EVENT, ask);
      setLeaveOpen(false);
    };
  }, [busy]);

  // Move focus to the page heading when the screen changes (keyboard and screen reader users).
  useEffect(() => heading.current?.focus(), [state.phase]);

  const onAnswer = useCallback(
    (key: string) => {
      if (state.phase !== "playing") return;
      const q = state.quiz.questions[state.current];
      if (!q) return;
      dispatch({ type: "answer", id: q.id, key });
      if (getSettings().sound) playTone(key === q.correctKey);
    },
    [state],
  );

  return (
    <div>
      <div className="mb-4 flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="min-w-0">
          {state.phase === "playing" && state.quiz.questions.length > 0 && (
            <>
              <span className="num text-lg font-extrabold">
                {t("quiz.progress", {
                  current: state.current + 1,
                  total: state.quiz.questions.length,
                })}
              </span>{" "}
              <span className="ms-1 text-sm text-muted">
                {modeText(t, state.quiz.config.mode, "title")}
              </span>
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="btn-quiet ms-auto min-h-11 px-4 text-sm"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 7h8M20 7h-1M4 17h1M12 17h8" />
            <circle cx="15.5" cy="7" r="2.75" />
            <circle cx="8.5" cy="17" r="2.75" />
          </svg>
          {t("quiz.settings")}
        </button>
      </div>

      {leaveOpen && (
        <div role="alertdialog" aria-labelledby="leave-title" className="sheet measure mb-4 p-5">
          <h2 id="leave-title" className="sub">
            {t("quiz.leave.title")}
          </h2>
          <p className="mt-2">{t("quiz.leave.body")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn" autoFocus onClick={() => setLeaveOpen(false)}>
              {t("quiz.leave.stay")}
            </button>
            <button
              type="button"
              className="btn-quiet"
              onClick={() => {
                setLeaveOpen(false);
                void import("../../lib/native/back").then((m) => m.goBack());
              }}
            >
              {t("quiz.leave.confirm")}
            </button>
          </div>
        </div>
      )}

      {daily && state.phase !== "result" && <DailyBanner />}

      {(state.phase === "boot" ||
        state.phase === "loading" ||
        (state.phase === "setup" && !meta)) && (
        <p role="status" className="min-h-[50vh] py-10 text-center text-muted">
          {t("quiz.loading")}
        </p>
      )}

      {state.phase === "setup" && meta && (
        <QuizSetup
          initial={initial}
          index={meta.index}
          juz={meta.juz}
          onStart={(c) => start({ ...c, seed: newSeed() }, "push")}
        />
      )}

      {state.phase === "error" && (
        <div role="alert" className="sheet measure p-5">
          <h1 ref={heading} tabIndex={-1} className="sub text-bad">
            {t("quiz.error.title")}
          </h1>
          <p className="mt-2">{t("quiz.error.body")}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn"
              onClick={() => start(state.config, daily ? "none" : "replace")}
            >
              {t("quiz.error.retry")}
            </button>
            {!daily && (
              <button
                type="button"
                className="btn-quiet"
                onClick={() => dispatch({ type: "setup" })}
              >
                {t("quiz.change_settings")}
              </button>
            )}
          </div>
        </div>
      )}

      {state.phase === "playing" && state.quiz.questions.length === 0 && (
        <div className="sheet measure p-5">
          <h1 ref={heading} tabIndex={-1} className="sub">
            {t("quiz.empty.title")}
          </h1>
          <p className="mt-2">{t("quiz.empty.body")}</p>
          <button type="button" className="btn mt-5" onClick={() => dispatch({ type: "setup" })}>
            {t("quiz.change_settings")}
          </button>
        </div>
      )}

      {state.phase === "playing" && state.quiz.questions.length > 0 && meta && (
        <div>
          <h1 ref={heading} tabIndex={-1} className="sr-only">
            {t("quiz.title")}
          </h1>
          {state.quiz.reduced && (
            <p role="status" className="mb-4 border-y border-line py-2 text-sm text-muted">
              {t("quiz.reduced", { n: state.quiz.questions.length })}
            </p>
          )}
          <ParafStrip
            questions={state.quiz.questions}
            answers={state.answers}
            current={state.current}
          />
          {(() => {
            const q = state.quiz.questions[state.current]!;
            return (
              <div className="mt-6 lg:mt-8">
                <QuestionView
                  key={q.mode === "tebak-audio" ? `${q.id}:${settings.reciter}` : q.id}
                  question={q}
                  index={meta.index}
                  settings={settings}
                  answer={state.answers[q.id]}
                  isLast={state.current + 1 >= state.quiz.questions.length}
                  onAnswer={onAnswer}
                  onSkip={() => dispatch({ type: "answer", id: q.id, key: "skip" })}
                  onNext={() => dispatch({ type: "next" })}
                />
              </div>
            );
          })()}
        </div>
      )}

      {state.phase === "result" && meta && (
        <>
          <span ref={heading} tabIndex={-1} className="sr-only">
            {t("quiz.result_heading")}
          </span>
          <ResultView
            quiz={state.quiz}
            answers={state.answers}
            index={meta.index}
            settings={settings}
            daily={
              daily
                ? {
                    date: state.quiz.config.seed.slice(0, 10),
                    official: dailyRec,
                    countdown: <Countdown />,
                    streak: <StreakLine dep={dailyRec} />,
                  }
                : undefined
            }
            onRepeat={() => start(state.quiz.config, daily ? "none" : "replace")}
            onNew={() => start({ ...state.quiz.config, seed: newSeed() }, "push")}
            onRetryWrong={(questions) => {
              track("retry_wrong_start", { count: questions.length });
              dispatch({
                type: "ready",
                quiz: { config: state.quiz.config, questions, reduced: false, retry: true },
              });
            }}
            onSetup={() => {
              setInitial(state.quiz.config);
              history.pushState(null, "", path("/kuis"));
              dispatch({ type: "setup" });
            }}
          />
        </>
      )}

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
