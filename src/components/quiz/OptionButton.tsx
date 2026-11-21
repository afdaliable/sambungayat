import type { Option, OptionLabel } from "../../lib/quiz/types";
import { useI18n } from "../../lib/i18n/react";
import AyahText from "./AyahText";

// The sajdah sign (U+06E9) appears only on some ayahs, so on an option it would hint at the right answer.
const SAJDAH = new RegExp(" ?" + String.fromCharCode(0x06e9));

export type OptionState = "idle" | "correct" | "wrong" | "dim";

export function OptionLabelView({
  label,
  className = "",
}: {
  label: OptionLabel;
  className?: string;
}) {
  const { t } = useI18n();
  if (label.type === "ayah") {
    return (
      <AyahText
        text={label.text?.replace(SAJDAH, "")}
        ellipsisStart={label.ellipsisStart}
        ellipsisEnd={label.ellipsisEnd}
        className={className}
      />
    );
  }
  if (label.type === "juz") {
    return <span className={`num text-lg font-semibold ${className}`}>{t("quiz.juz_n", { n: label.n })}</span>;
  }
  return (
    <span className={`flex flex-col gap-0 ${className}`}>
      <span className="num font-semibold">
        <bdi dir="ltr">{label.n}. {label.nameLatin}</bdi>
      </span>
      <span lang="ar" dir="rtl" className="ayah ltr:self-end rtl:self-start !text-2xl !leading-normal">
        {label.nameAr}
      </span>
    </span>
  );
}

const DATA: Record<OptionState, string | undefined> = {
  idle: undefined,
  correct: "ok",
  wrong: "no",
  dim: "dim",
};

type Props = {
  option: Option;
  number: number;
  state: OptionState;
  disabled: boolean;
  onSelect: (key: string) => void;
};

export default function OptionButton({ option, number, state, disabled, onSelect }: Props) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(option.key)}
      data-s={DATA[state]}
      className="opt"
    >
      <span aria-hidden="true" className="opt-key">
        {number}
      </span>
      <span className="min-w-0 flex-1">
        <OptionLabelView label={option.label} />
      </span>
      {state === "correct" && <span className="opt-tag">{t("quiz.correct_tag")}</span>}
      {state === "wrong" && <span className="opt-tag">{t("quiz.wrong_tag")}</span>}
    </button>
  );
}
