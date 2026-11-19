import { LANGS } from "../../lib/i18n/core";
import { useI18n } from "../../lib/i18n/react";

type Props = {
  text?: string;
  ellipsisStart?: boolean;
  ellipsisEnd?: boolean;
  /** Number of hidden words, shown as dashed placeholders after the text. */
  hidden?: number;
  className?: string;
};

export default function AyahText({
  text,
  ellipsisStart,
  ellipsisEnd,
  hidden,
  className = "",
}: Props) {
  const { t, lang } = useI18n();
  return (
    <p lang="ar" dir="rtl" className={`ayah text-start ${className}`}>
      {ellipsisStart && <span aria-hidden="true">... </span>}
      {text}
      {ellipsisEnd && <span aria-hidden="true"> ...</span>}
      {hidden ? (
        <>
          {" "}
          <span className="sr-only" lang={lang} dir={LANGS[lang].dir}>
            {t("quiz.hidden_words", { n: hidden })}
          </span>
          {Array.from({ length: hidden }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="mx-1 inline-block h-8 w-14 rounded-sm border-2 border-dashed border-rule align-middle"
            />
          ))}
        </>
      ) : null}
    </p>
  );
}
