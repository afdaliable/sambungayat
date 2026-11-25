import { track } from "../../lib/analytics";
import { LANGS } from "../../lib/i18n/core";
import { useI18n } from "../../lib/i18n/react";
import { SITE } from "../../config/site";
import { useState, type ReactNode } from "react";
import { dailyShareText } from "../../lib/quiz/daily";
import type { SurahMeta } from "../../lib/quran/types";
import type { Question, Quiz } from "../../lib/quiz/types";
import { shareLinks } from "../../lib/shareLinks";
import { recapTag } from "../../lib/recap";
import { shareText } from "../../lib/share";
import { shareCard } from "../../lib/shareCard";
import { computeStreak } from "../../lib/streak";
import { getDaily } from "../../lib/storage/daily";
import { jakartaDate } from "../../lib/quiz/daily";
import { readJson, writeJson } from "../../lib/storage";
import type { Settings } from "../../lib/storage/settings";
import ParafStrip from "./ParafStrip";
import { modeText } from "./QuizSetup";
import ReviewList from "./ReviewList";

type Props = {
  quiz: Quiz;
  answers: Record<string, string>;
  index: SurahMeta[];
  settings: Settings;
  onRepeat: () => void;
  onNew: () => void;
  /** Starts a practice round with only the questions answered wrong (in memory, not a shareable link). */
  onRetryWrong: (questions: Question[]) => void;
  onSetup: () => void;
  /** Daily challenge mode: custom share text, official score, no "new quiz"/"settings". */
  daily?: {
    date: string;
    official: { score: number; total: number } | undefined;
    countdown: ReactNode;
    streak?: ReactNode;
  };
};

export default function ResultView({
  quiz,
  answers,
  index,
  settings,
  onRepeat,
  onNew,
  onRetryWrong,
  onSetup,
  daily,
}: Props) {
  const { t, tp, path, lang } = useI18n();
  const modeTitle = modeText(t, quiz.config.mode, "title");
  const message = (pct: number) =>
    t(
      pct >= 90
        ? "quiz.msg.90"
        : pct >= 70
          ? "quiz.msg.70"
          : pct >= 40
            ? "quiz.msg.40"
            : "quiz.msg.0",
    );
  const [shareMsg, setShareMsg] = useState("");
  const [student, setStudent] = useState(() => readJson<string>("student", ""));
  const skipped = quiz.questions.filter((q) => answers[q.id] === "skip").length;
  const total = quiz.questions.length - skipped;
  const score = quiz.questions.filter((q) => answers[q.id] === q.correctKey).length;
  const wrongQs = quiz.questions.filter(
    (q) =>
      answers[q.id] !== undefined && answers[q.id] !== "skip" && answers[q.id] !== q.correctKey,
  );
  const pct = total ? Math.round((score / total) * 100) : 0;

  const share = async () => {
    track("share_click", { where: "result" });
    const r = daily
      ? await shareText(dailyShareText(daily.date, score, total))
      : await shareText(
          t("quiz.share_text", { mode: modeTitle, score, total }),
          `${SITE.url}${path("/")}`,
        );
    if (r === "canceled") return;
    setShareMsg(
      r === "copied"
        ? t("quiz.share.copied")
        : r === "failed"
          ? t("quiz.share.failed")
          : t("quiz.share.done"),
    );
  };

  const shareImage = async () => {
    track("share_click", { where: "result_image" });
    const st = daily ? computeStreak(Object.keys(getDaily()), jakartaDate()) : undefined;
    const r = await shareCard(
      {
        site: SITE.name,
        title: daily ? t("quiz.daily.title") : modeTitle,
        score,
        total,
        date: stampDate,
        extra:
          st && st.current > 0
            ? t("quiz.daily.streak", { n: st.current, best: st.best })
            : undefined,
        footer: "sambungayat.com",
        dir: LANGS[lang].dir,
      },
      daily
        ? dailyShareText(daily.date, score, total)
        : t("quiz.share_text", { mode: modeTitle, score, total }),
    );
    setShareMsg(
      r === "saved" ? t("quiz.share.image_saved") : r === "failed" ? "" : t("quiz.share.done"),
    );
  };

  const sendToTeacher = async () => {
    writeJson("student", student);
    const line = `${t("quiz.recap_line", { score, total })} ${recapTag(student, score, total, quiz.config.seed.slice(0, 12))}`;
    const r = await shareText(line);
    setShareMsg(
      r === "copied" ? t("quiz.recap.copied") : r === "failed" ? t("quiz.share.failed") : "",
    );
  };

  const stampDate = (daily ? new Date(`${daily.date}T12:00:00`) : new Date()).toLocaleDateString(
    LANGS[lang].locale,
    { day: "numeric", month: "short", year: "numeric" },
  );

  return (
    <div className="fade-in">
      <div className="grid gap-x-14 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <section className="sheet p-5 sm:p-7">
          <h1 className="sub">{t("quiz.result_of", { mode: modeTitle })}</h1>
          <div className="mt-7 flex flex-wrap items-center gap-x-9 gap-y-6 ps-2">
            <div className="stamp" role="img" aria-label={t("quiz.score_label", { score, total })}>
              <span className="text-xs">{SITE.name}</span>
              <span className="stamp-score">
                {score}/{total}
              </span>
              <span className="num text-xs tracking-normal">{stampDate}</span>
            </div>
            <div className="min-w-0 flex-1 basis-48">
              {total > 0 && <p className="text-lg font-semibold">{message(pct)}</p>}
              {skipped > 0 && (
                <p className="mt-1 text-sm text-muted">{tp("quiz.skipped", skipped)}</p>
              )}
            </div>
          </div>
          <div className="mt-8">
            <ParafStrip questions={quiz.questions} answers={answers} />
          </div>
          {daily && (
            <div className="mt-6 border-t border-line pt-4">
              {daily.official && (
                <p>
                  {t("quiz.daily.official_first")}{" "}
                  <strong className="num font-extrabold">
                    {daily.official.score}/{daily.official.total}
                  </strong>
                </p>
              )}
              <p className="mt-1 text-sm text-muted">
                {t("quiz.daily.next")} {daily.countdown} {t("quiz.tz")}
              </p>
              {daily.streak && <p className="mt-1 text-sm">{daily.streak}</p>}
            </div>
          )}
        </section>

        <div>
          {wrongQs.length > 0 && (
            <button
              type="button"
              onClick={() => onRetryWrong(wrongQs)}
              className="btn btn-lg mb-2 w-full"
            >
              {tp("quiz.retry_wrong", wrongQs.length)}
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onRepeat} className="btn-quiet">
              {t("quiz.repeat")}
            </button>
            <button
              type="button"
              onClick={onNew}
              className={wrongQs.length > 0 ? "btn-quiet" : "btn"}
            >
              {t("quiz.new")}
            </button>
            <button type="button" onClick={share} className="btn-quiet">
              {t("quiz.share")}
            </button>
            <button type="button" onClick={shareImage} className="btn-quiet col-span-2">
              {t("quiz.share.image")}
            </button>
            <button type="button" onClick={onSetup} className="btn-quiet">
              {t("quiz.change_settings")}
            </button>
          </div>
          {!daily && (
            <details className="mt-5 border-y border-line">
              <summary className="font-semibold">{t("quiz.teacher.summary")}</summary>
              <label htmlFor="student-name" className="sr-only">
                {t("quiz.teacher.name")}
              </label>
              <div className="flex flex-wrap gap-2 pb-4 pt-1">
                <input
                  id="student-name"
                  value={student}
                  maxLength={40}
                  onChange={(e) => setStudent(e.target.value)}
                  placeholder={t("quiz.teacher.name")}
                  className="field min-w-0 flex-1 basis-40"
                />
                <button
                  type="button"
                  disabled={!student.trim()}
                  onClick={sendToTeacher}
                  className="btn"
                >
                  {t("quiz.teacher.send")}
                </button>
              </div>
            </details>
          )}
          <p aria-live="polite" className="mt-3 min-h-6 text-sm text-muted">
            {shareMsg}
          </p>
          <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={t("quiz.share_to")}>
            {shareLinks(
              daily
                ? `${SITE.url}${path("/harian")}`
                : `${SITE.url}${path("/")}`.replace(/\/$/, ""),
              daily
                ? dailyShareText(daily.date, score, total)
                : t("quiz.share_social", { score, total, mode: modeTitle }),
            ).map((l) => (
              <a
                key={l.id}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-quiet min-h-11 px-4 text-sm"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <ReviewList questions={quiz.questions} answers={answers} index={index} settings={settings} />
    </div>
  );
}
