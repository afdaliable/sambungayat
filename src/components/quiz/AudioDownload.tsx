import { useI18n } from "../../lib/i18n/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { RECITERS } from "../../config/reciters";
import {
  downloadAudio,
  getAudioStore,
  scopeAyahRefs,
  type DownloadResult,
  type Ref,
} from "../../lib/audioCache";
import type { JuzMeta, SurahMeta } from "../../lib/quran/types";
import type { Scope } from "../../lib/quiz/types";
import { isNative } from "../../lib/native/platform";
import { useSettings } from "../../lib/storage/settings";

type Props = { scope: Scope; juz: JuzMeta[]; index: SurahMeta[] };

export default function AudioDownload({ scope, juz, index }: Props) {
  const { t } = useI18n();
  const { reciter } = useSettings();
  const refs = useMemo(() => scopeAyahRefs(scope, juz, index), [scope, juz, index]);
  const [supported, setSupported] = useState(false);
  const [have, setHave] = useState(0);
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const [warn, setWarn] = useState(false);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    let live = true;
    setResult(null);
    setProgress(null);
    setWarn(false);
    setHave(0);
    void getAudioStore()
      .then(async (st) => {
        if (!live) return;
        const ok = st.supported();
        setSupported(ok);
        if (ok) {
          const count = await st.count(reciter, refs);
          if (live) setHave(count);
        }
      })
      .catch(() => {});
    return () => {
      live = false;
      controller.current?.abort();
      controller.current = null;
    };
  }, [reciter, refs]);

  if (!supported || refs.length === 0) return null;
  const reciterName = RECITERS.find((r) => r.id === reciter)?.name;

  const mb = Math.round((refs.length * 0.1) / 5) * 5 || 1;

  const run = async (targets: Ref[] = refs) => {
    if (controller.current) return;
    if (!warn && isNative() && (await (await import("../../lib/native/network")).onCellular())) {
      setWarn(true);
      return;
    }
    setWarn(false);
    const ac = new AbortController();
    controller.current = ac;
    setResult(null);
    setProgress([0, targets.length]);
    await downloadAudio(
      reciter,
      targets,
      (d, n) => {
        if (controller.current === ac) setProgress([d, n]);
      },
      ac.signal,
      (value) => {
        if (controller.current === ac) setResult(value);
      },
      () => {
        if (controller.current !== ac) return;
        controller.current = null;
        setProgress(null);
        void getAudioStore()
          .then((st) => st.count(reciter, refs))
          .then(setHave)
          .catch(() => {});
      },
    );
  };

  return (
    <section aria-labelledby="audio-dl" className="sheet p-4">
      <h3 id="audio-dl" className="font-extrabold">
        {t("quiz.audio_dl.title")}
      </h3>
      <p className="num mt-1 text-sm text-muted">
        {t("quiz.audio_dl.status", {
          have,
          total: refs.length,
          reciter: reciterName ?? "",
          mb,
        })}
      </p>
      {warn && (
        <p role="alert" className="mt-2 text-sm">
          {t("quiz.audio_dl.cellular", { mb })}
        </p>
      )}
      <p aria-live="polite" aria-atomic="true" className="mt-2 text-sm">
        {result && t("quiz.audio_dl.result", { saved: result.saved, failed: result.failed.length })}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={progress !== null || have === refs.length}
          onClick={() => void run()}
          className="btn num flex-1"
        >
          {progress
            ? t("quiz.audio_dl.downloading", { done: progress[0], total: progress[1] })
            : warn
              ? t("quiz.audio_dl.cellular_go")
              : t("quiz.audio_dl.save")}
        </button>
        {progress && (
          <button type="button" className="btn-quiet" onClick={() => controller.current?.abort()}>
            {t("quiz.audio_dl.cancel")}
          </button>
        )}
        {!progress && result && result.failed.length > 0 && (
          <button type="button" className="btn" onClick={() => void run(result.failed)}>
            {t("quiz.audio_dl.retry")}
          </button>
        )}
        <button
          type="button"
          disabled={progress !== null || have === 0}
          onClick={async () => {
            await (await getAudioStore()).clear();
            setHave(0);
          }}
          className="btn-quiet"
        >
          {t("quiz.audio_dl.clear")}
        </button>
      </div>
    </section>
  );
}
