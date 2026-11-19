import type { CSSProperties } from "react";
import { useI18n } from "../../lib/i18n/react";
import type { Question } from "../../lib/quiz/types";

const MARK = {
  ok: "M4.5 12.5l5 5L19.5 6.5",
  no: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  skip: "M6.5 12h11",
};

type Props = {
  questions: Question[];
  answers: Record<string, string>;
  /** Index of the question on screen; omit on the result page (the strip is then a plain summary). */
  current?: number;
};

/** One cell per question, marked as the quiz goes: the page a teacher initials after a recitation. */
export default function ParafStrip({ questions, answers, current }: Props) {
  const { t } = useI18n();
  const live = current !== undefined;
  return (
    <div
      className="strip"
      style={{ "--n": Math.min(questions.length, 10) } as CSSProperties}
      {...(live
        ? {
            role: "progressbar",
            "aria-valuemin": 1,
            "aria-valuemax": questions.length,
            "aria-valuenow": current + 1,
            "aria-label": t("quiz.progress_label"),
          }
        : { "aria-hidden": true })}
    >
      {questions.map((q, i) => {
        const a = answers[q.id];
        const mark = a === undefined ? undefined : a === "skip" ? "skip" : a === q.correctKey ? "ok" : "no";
        const state = mark === "ok" || mark === "no" ? mark : i === current ? "now" : undefined;
        return (
          <span key={q.id} data-s={state}>
            {mark && (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d={MARK[mark]}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        );
      })}
    </div>
  );
}
