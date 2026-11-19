import { useState } from "react";
import { useI18n } from "../../lib/i18n/react";
import AudioDownload from "./AudioDownload";
import { MODES } from "../../config/site";
import type { JuzMeta, SurahMeta } from "../../lib/quran/types";
import type { Difficulty, QuizConfig, QuizMode, Scope } from "../../lib/quiz/types";

export const MODE_INFO = Object.fromEntries(
  MODES.map((m) => [m.id, { title: m.title, desc: m.desc }]),
) as Record<QuizMode, { title: string; desc: string }>;

/**
 * Localised mode title/description. Reads `lib.mode.<id>.title|desc`; while a language has no such key
 * (the lookup echoes the key back) it falls back to the Indonesian text in config/site.
 */
export function modeText(
  t: (key: string) => string,
  id: QuizMode,
  field: "title" | "desc",
): string {
  const key = `lib.mode.${id}.${field}`;
  const v = t(key);
  return v === key ? MODE_INFO[id][field] : v;
}

type Props = {
  initial: QuizConfig;
  index: SurahMeta[];
  juz: JuzMeta[];
  onStart: (config: Omit<QuizConfig, "seed">) => void;
  title?: string;
  submitLabel?: string;
};

type Kind = Scope["kind"];

export default function QuizSetup({ initial, index, juz, onStart, title, submitLabel }: Props) {
  const { t, tp } = useI18n();
  const [mode, setMode] = useState<QuizMode>(initial.mode);
  const [count, setCount] = useState<QuizConfig["count"]>(initial.count);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial.difficulty);
  const [kind, setKind] = useState<Kind>(initial.scope.kind);
  const [juzSel, setJuzSel] = useState<number[]>(
    initial.scope.kind === "juz" ? initial.scope.juz : [30],
  );
  const [surahSel, setSurahSel] = useState<number[]>(
    initial.scope.kind === "surah" ? initial.scope.surah : [78],
  );
  const [juzFilter, setJuzFilter] = useState(0); // 0 = all juz; only narrows the surah list
  const [from, setFrom] = useState(initial.scope.kind === "range" ? initial.scope.from : 78);
  const [to, setTo] = useState(initial.scope.kind === "range" ? initial.scope.to : 114);
  const [ayatSurah, setAyatSurah] = useState(
    initial.scope.kind === "ayat" ? initial.scope.surah : 78,
  );
  const ayahCount = index[ayatSurah - 1]?.ayahCount ?? 1;
  const [ayatFrom, setAyatFrom] = useState(initial.scope.kind === "ayat" ? initial.scope.from : 1);
  const [ayatTo, setAyatTo] = useState(initial.scope.kind === "ayat" ? initial.scope.to : 10);
  const clampAyah = (v: number) => Math.min(Math.max(1, Math.trunc(v) || 1), ayahCount);
  const aFrom = clampAyah(Math.min(ayatFrom, ayatTo));
  const aTo = clampAyah(Math.max(ayatFrom, ayatTo));

  const toggle = (list: number[], n: number) =>
    list.includes(n) ? list.filter((x) => x !== n) : [...list, n].sort((x, y) => x - y);

  const scope: Scope =
    kind === "juz"
      ? { kind, juz: juzSel }
      : kind === "surah"
        ? { kind, surah: surahSel }
        : kind === "ayat"
          ? { kind, surah: ayatSurah, from: aFrom, to: aTo }
          : { kind, from: Math.min(from, to), to: Math.max(from, to) };
  const scopeEmpty =
    (kind === "juz" && juzSel.length === 0) || (kind === "surah" && surahSel.length === 0);

  const filterSet = juzFilter ? new Set(juz.find((j) => j.juz === juzFilter)?.surahs) : null;
  const visibleSurahs = index.filter((s) => !filterSet || filterSet.has(s.n));

  const surahOptions = index.map((s) => (
    <option key={s.n} value={s.n}>
      {s.n}. {s.nameLatin}
    </option>
  ));

  const LEGEND = "mb-3 text-lg font-extrabold";

  return (
    <form
      className="grid gap-x-12 gap-y-8 lg:grid-cols-2 lg:grid-rows-[auto_auto_auto_auto_1fr]"
      onSubmit={(e) => {
        e.preventDefault();
        if (scopeEmpty) return;
        onStart({ mode, scope, count, difficulty });
      }}
    >
      <h1 className="title lg:col-span-2">{title ?? t("quiz.setup.title")}</h1>

      <fieldset className="min-w-0 lg:col-start-1 lg:row-start-2">
        <legend className={LEGEND}>{t("quiz.setup.mode")}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.keys(MODE_INFO) as QuizMode[]).map((m) => (
            <label key={m} className="pick min-h-14">
              <input
                type="radio"
                name="mode"
                className="sr-only"
                checked={mode === m}
                onChange={() => setMode(m)}
              />
              {modeText(t, m, "title")}
              <span className="sr-only">. {modeText(t, m, "desc")}</span>
            </label>
          ))}
        </div>
        <p aria-hidden="true" className="mt-3 min-h-10 text-sm text-muted">
          {modeText(t, mode, "desc")}
        </p>
      </fieldset>

      <fieldset className="grid min-w-0 gap-3 lg:col-start-2 lg:row-span-4 lg:row-start-2 lg:content-start">
        <legend className={LEGEND}>{t("quiz.setup.scope")}</legend>
        <select
          aria-label={t("quiz.setup.scope_kind")}
          className="field"
          value={kind}
          onChange={(e) => setKind(e.target.value as Kind)}
        >
          <option value="juz">{t("quiz.setup.kind.juz")}</option>
          <option value="surah">{t("quiz.setup.kind.surah")}</option>
          <option value="range">{t("quiz.setup.kind.range")}</option>
          <option value="ayat">{t("quiz.setup.kind.ayat")}</option>
        </select>
        {kind === "juz" && (
          <div role="group" aria-label={t("quiz.setup.pick_juz_label")}>
            <p className="mb-2 text-sm text-muted">{t("quiz.setup.pick_juz_hint")}</p>
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                <label key={n} className="pick num px-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={juzSel.includes(n)}
                    onChange={() => setJuzSel(toggle(juzSel, n))}
                  />
                  {n}
                </label>
              ))}
            </div>
          </div>
        )}
        {kind === "surah" && (
          <div role="group" aria-label={t("quiz.setup.pick_surah_label")}>
            <label className="mb-3 block text-sm text-muted">
              {t("quiz.setup.juz_filter")}
              <select
                className="field mt-1 text-base"
                value={juzFilter}
                onChange={(e) => setJuzFilter(Number(e.target.value))}
              >
                <option value={0}>{t("quiz.setup.all_juz")}</option>
                {Array.from({ length: 30 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {t("quiz.juz_n", { n: i + 1 })}
                  </option>
                ))}
              </select>
            </label>
            <div className="sheet max-h-72 overflow-y-auto p-1">
              <div className="grid sm:grid-cols-2">
                {visibleSurahs.map((s) => (
                  <label
                    key={s.n}
                    className="num flex min-h-11 cursor-pointer items-center gap-3 rounded px-3 hover:bg-paper has-[:checked]:font-semibold"
                  >
                    <input
                      type="checkbox"
                      className="size-5 shrink-0 accent-accent"
                      checked={surahSel.includes(s.n)}
                      onChange={() => setSurahSel(toggle(surahSel, s.n))}
                    />
                    {s.n}. {s.nameLatin}
                  </label>
                ))}
              </div>
            </div>
            <p className="num mt-2 text-sm text-muted">
              {tp("quiz.setup.surah_selected", surahSel.length)}
            </p>
          </div>
        )}
        {kind === "range" && (
          <div className="grid grid-cols-2 gap-2">
            <select
              aria-label={t("quiz.setup.from_surah")}
              className="field"
              value={from}
              onChange={(e) => setFrom(Number(e.target.value))}
            >
              {surahOptions}
            </select>
            <select
              aria-label={t("quiz.setup.to_surah")}
              className="field"
              value={to}
              onChange={(e) => setTo(Number(e.target.value))}
            >
              {surahOptions}
            </select>
          </div>
        )}
        {kind === "ayat" && (
          <div className="grid gap-3">
            <select
              aria-label={t("quiz.setup.surah")}
              className="field"
              value={ayatSurah}
              onChange={(e) => {
                const n = Number(e.target.value);
                setAyatSurah(n);
                setAyatFrom(1);
                setAyatTo(Math.min(10, index[n - 1]?.ayahCount ?? 1));
              }}
            >
              {surahOptions}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm text-muted">
                {t("quiz.setup.from_ayah")}
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={ayahCount}
                  className="field num mt-1 text-base"
                  value={ayatFrom}
                  onChange={(e) => setAyatFrom(Number(e.target.value))}
                />
              </label>
              <label className="text-sm text-muted">
                {t("quiz.setup.to_ayah")}
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={ayahCount}
                  className="field num mt-1 text-base"
                  value={ayatTo}
                  onChange={(e) => setAyatTo(Number(e.target.value))}
                />
              </label>
            </div>
            <p className="num text-sm text-muted">
              {t("quiz.setup.ayah_range_hint", { from: aFrom, to: aTo, count: ayahCount })}
            </p>
          </div>
        )}
        {scopeEmpty && (
          <p role="alert" className="text-sm font-semibold text-bad">
            {kind === "juz" ? t("quiz.setup.need_juz") : t("quiz.setup.need_surah")}
          </p>
        )}
      </fieldset>

      <fieldset className="min-w-0 lg:col-start-1 lg:row-start-3">
        <legend className={LEGEND}>{t("quiz.setup.count")}</legend>
        <div className="flex gap-2">
          {([5, 10, 20] as const).map((n) => (
            <label key={n} className="pick num flex-1">
              <input
                type="radio"
                name="count"
                className="sr-only"
                checked={count === n}
                onChange={() => setCount(n)}
              />
              {n}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="min-w-0 lg:col-start-1 lg:row-start-4">
        <legend className={LEGEND}>{t("quiz.setup.difficulty")}</legend>
        <div className="flex gap-2">
          {(["mudah", "sulit"] as const).map((d) => (
            <label key={d} className="pick flex-1">
              <input
                type="radio"
                name="difficulty"
                className="sr-only"
                checked={difficulty === d}
                onChange={() => setDifficulty(d)}
              />
              {d === "mudah" ? t("quiz.setup.easy") : t("quiz.setup.hard")}
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">{t("quiz.setup.hard_hint")}</p>
      </fieldset>

      <div className="grid gap-6 lg:col-span-2 lg:row-start-6">
        {mode === "tebak-audio" && juz.length > 0 && (
          <div className="measure">
            <AudioDownload scope={scope} juz={juz} index={index} />
          </div>
        )}
        <button
          type="submit"
          disabled={scopeEmpty}
          className="btn btn-lg w-full lg:w-auto lg:min-w-72 lg:justify-self-start"
        >
          {submitLabel ?? t("quiz.setup.submit")}
        </button>
      </div>
    </form>
  );
}
