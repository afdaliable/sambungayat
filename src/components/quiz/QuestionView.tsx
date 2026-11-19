import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../lib/i18n/react";
import { audioUrl } from "../../config/reciters";
import type { SurahMeta } from "../../lib/quran/types";
import type { Question } from "../../lib/quiz/types";
import type { Settings } from "../../lib/storage/settings";
import AnswerTranslation from "./AnswerTranslation";
import { answerAyahRef } from "../../lib/quiz/answerRef";
import AnswerAudio from "./AnswerAudio";
import AudioPlayer from "./AudioPlayer";
import AyahText from "./AyahText";
import OptionButton, { type OptionState } from "./OptionButton";

type Props = {
  question: Question;
  index: SurahMeta[];
  settings: Settings;
  /** Chosen option key, or "skip"; undefined while unanswered. */
  answer: string | undefined;
  isLast: boolean;
  onAnswer: (key: string) => void;
  onSkip: () => void;
  onNext: () => void;
};

export default function QuestionView({
  question: q,
  index,
  settings,
  answer,
  isLast,
  onAnswer,
  onSkip,
  onNext,
}: Props) {
  const { t } = useI18n();
  const [audioFailed, setAudioFailed] = useState(false);
  useEffect(() => setAudioFailed(false), [q.id]);

  // Bring the new question into view (the page is scrolled down after answering the previous one).
  const sectionRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    sectionRef.current?.scrollIntoView({ block: "start" });
  }, [q.id]);

  const revealed = answer !== undefined;
  const correct = answer === q.correctKey;

  // Keyboard: 1-4 choose, Enter continues (the Next button is focused, so Enter works natively).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey || revealed || audioFailed) return;
      const n = Number(e.key);
      const opt = n >= 1 && n <= 4 ? q.options[n - 1] : undefined;
      if (opt) onAnswer(opt.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, revealed, audioFailed, onAnswer]);

  const nextRef = (el: HTMLButtonElement | null) => el?.focus();
  const surahName = q.prompt.ayahRef ? index[q.prompt.ayahRef.s - 1]?.nameLatin : undefined;
  const showContext = settings.showContext && q.mode === "sambung" && surahName && q.prompt.ayahRef;

  // Ayah of the correct answer: encoded in the key ("s:a") for ayah options; otherwise the source ayah.
  const answerRef = answerAyahRef(q);
  const answerAudio = audioUrl(settings.reciter, answerRef.s, answerRef.a);

  const stateOf = (key: string): OptionState => {
    if (!revealed) return "idle";
    if (key === q.correctKey) return "correct";
    if (key === answer) return "wrong";
    return "dim";
  };

  return (
    <section
      ref={sectionRef}
      aria-label={t("quiz.question_label")}
      className="fade-in grid scroll-mt-32 gap-x-10 gap-y-4 lg:grid-cols-2 lg:items-start"
    >
      <h2 className="sub lg:col-span-2">{t(`quiz.prompt.${q.mode}`)}</h2>

      <div className="sheet p-4 sm:p-6 lg:sticky lg:top-4">
        {showContext && q.prompt.ayahRef && (
          <p className="num mb-1 text-sm text-muted">
            {t("quiz.context", { surah: surahName ?? "", ayah: q.prompt.ayahRef.a })}
          </p>
        )}
        {q.mode === "tebak-audio" ? (
          <AudioPlayer
            src={audioUrl(settings.reciter, q.source.s, q.source.a)}
            autoplay={settings.autoplay}
            onUnavailable={() => setAudioFailed(true)}
          />
        ) : (
          <AyahText
            className="ayah-lead"
            text={q.prompt.text}
            ellipsisStart={q.prompt.ellipsisStart}
            ellipsisEnd={q.prompt.ellipsisEnd}
            hidden={q.prompt.hiddenWords}
          />
        )}
      </div>

      <div>
      {audioFailed && !revealed ? (
        <button type="button" onClick={onSkip} className="btn-quiet">
          {t("quiz.skip")}
        </button>
      ) : (
        <div className="flex flex-col gap-2.5" role="group" aria-label={t("quiz.options_label")}>
          {q.options.map((o, i) => (
            <div key={o.key}>
              <OptionButton
                option={o}
                number={i + 1}
                state={stateOf(o.key)}
                disabled={revealed}
                onSelect={onAnswer}
              />
            </div>
          ))}
        </div>
      )}

      <div aria-live="polite" className="mt-4 min-h-7">
        {revealed && answer !== "skip" && (
          <p className={`text-lg font-extrabold ${correct ? "text-good" : "text-bad"}`}>
            {correct ? t("quiz.right") : t("quiz.not_right")}
          </p>
        )}
        {revealed && answer !== "skip" && settings.showTranslation && (
          <p className="mt-1 text-sm text-muted">
            {t("quiz.translation")}: <AnswerTranslation q={q} />
          </p>
        )}
        {revealed && answer !== "skip" && <AnswerAudio src={answerAudio} />}
      </div>

      {revealed && (
        <div className="sticky bottom-0 -mx-1 bg-paper px-1 pt-3 pb-[calc(0.75rem+var(--sab))]">
          <button
            ref={nextRef}
            type="button"
            onClick={onNext}
            className="btn btn-lg w-full"
          >
            {isLast ? t("quiz.see_result") : t("quiz.next")}
          </button>
        </div>
      )}
      </div>
    </section>
  );
}
