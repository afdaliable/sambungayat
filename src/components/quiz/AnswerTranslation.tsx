import { useEffect, useState } from "react";
import { useI18n } from "../../lib/i18n/react";
import { answerAyahRef } from "../../lib/quiz/answerRef";
import type { Question } from "../../lib/quiz/types";
import { translationOf } from "../../lib/quran/translation";

/** Translation of the answer ayah in the page language; Indonesian comes with the question itself. */
export default function AnswerTranslation({ q }: { q: Question }) {
  const { lang } = useI18n();
  const { s, a } = answerAyahRef(q);
  if (lang === "id") return <>{q.answerTranslation}</>;
  return <TranslatedAyah key={`${lang}:${s}:${a}`} s={s} a={a} />;
}

function TranslatedAyah({ s, a }: { s: number; a: number }) {
  const { lang, t } = useI18n();
  const [text, setText] = useState<string | null>();
  useEffect(() => {
    let alive = true;
    void translationOf(lang, s, a).then((v) => alive && setText(v || null));
    return () => {
      alive = false;
    };
  }, [lang, s, a]);
  return (
    <span role="status">
      {text === undefined
        ? t("quiz.translation_loading")
        : (text ?? t("quiz.translation_unavailable"))}
    </span>
  );
}
