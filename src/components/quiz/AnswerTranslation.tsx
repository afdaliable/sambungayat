import { useEffect, useState } from "react";
import { useI18n } from "../../lib/i18n/react";
import { answerAyahRef } from "../../lib/quiz/answerRef";
import type { Question } from "../../lib/quiz/types";
import { translationOf } from "../../lib/quran/translation";

/** Translation of the answer ayah in the page language; Indonesian comes with the question itself. */
export default function AnswerTranslation({ q }: { q: Question }) {
  const { lang } = useI18n();
  const [text, setText] = useState<string>();
  const { s, a } = answerAyahRef(q);
  useEffect(() => {
    let alive = true;
    setText(undefined);
    void translationOf(lang, s, a).then((v) => alive && setText(v));
    return () => {
      alive = false;
    };
  }, [lang, s, a]);
  // Falls back to the Indonesian text while loading or if the language has no translation file.
  return <>{text ?? q.answerTranslation}</>;
}
