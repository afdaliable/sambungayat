import AnswerTranslation from "./AnswerTranslation";
import { answerAyahRef } from "../../lib/quiz/answerRef";
import { useI18n } from "../../lib/i18n/react";
import { audioUrl } from "../../config/reciters";
import type { SurahMeta } from "../../lib/quran/types";
import type { Question } from "../../lib/quiz/types";
import type { Settings } from "../../lib/storage/settings";
import AnswerAudio from "./AnswerAudio";
import AyahText from "./AyahText";
import { OptionLabelView } from "./OptionButton";

type Props = {
  questions: Question[];
  answers: Record<string, string>;
  index: SurahMeta[];
  settings: Settings;
};

export default function ReviewList({ questions, answers, index, settings }: Props) {
  const { t } = useI18n();
  const wrong = questions.filter(
    (q) =>
      answers[q.id] !== undefined && answers[q.id] !== "skip" && answers[q.id] !== q.correctKey,
  );
  if (wrong.length === 0) return null;

  return (
    <section aria-labelledby="review-title" className="mt-12">
      <h2 id="review-title" className="sub">
        {t("quiz.review.title", { n: wrong.length })}
      </h2>
      <ul className="rows mt-4">
        {wrong.map((q) => {
          const mine = q.options.find((o) => o.key === answers[q.id]);
          const right = q.options.find((o) => o.key === q.correctKey);
          const { s, a } = q.source;
          const answerAyah = answerAyahRef(q);
          return (
            <li key={q.id} className="grid gap-x-10 gap-y-3 py-5 lg:grid-cols-2">
              <div>
              <p className="num text-sm font-semibold text-muted">
                {t("quiz.context", { surah: index[s - 1]?.nameLatin ?? "", ayah: a })}
              </p>
              {q.mode !== "tebak-audio" && (
                <AyahText
                  text={q.prompt.text}
                  ellipsisStart={q.prompt.ellipsisStart}
                  ellipsisEnd={q.prompt.ellipsisEnd}
                  hidden={q.prompt.hiddenWords}
                />
              )}
              </div>
              <div>
              <p className="text-sm font-extrabold text-bad">{t("quiz.review.yours")}</p>
              {mine && <OptionLabelView label={mine.label} />}
              <p className="mt-3 text-sm font-extrabold text-good">{t("quiz.review.correct")}</p>
              {right && <OptionLabelView label={right.label} />}
              <AnswerAudio src={audioUrl(settings.reciter, answerAyah.s, answerAyah.a)} />
              <p className="mt-2 text-sm text-muted">
                {t("quiz.translation")}: <AnswerTranslation q={q} />
              </p>
              <a
                className="lnk mt-1 inline-flex min-h-11 items-center text-sm"
                href={`https://quran.com/${s}/${a}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("quiz.review.read")}
              </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
