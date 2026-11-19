import { useI18n } from "../../lib/i18n/react";
import { useEffect, useMemo, useState } from "react";
import { RECITERS } from "../../config/reciters";
import { getAudioStore, scopeAyahRefs } from "../../lib/audioCache";
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

  useEffect(() => {
    let live = true;
    void getAudioStore().then(async (st) => {
      if (!live) return;
      const ok = st.supported();
      setSupported(ok);
      if (ok) setHave(await st.count(reciter, refs));
    });
    return () => {
      live = false;
    };
  }, [reciter, refs]);

  if (!supported || refs.length === 0) return null;
  const reciterName = RECITERS.find((r) => r.id === reciter)?.name;

  const mb = Math.round((refs.length * 0.1) / 5) * 5 || 1;

  const run = async () => {
    if (!warn && isNative() && (await (await import("../../lib/native/network")).onCellular())) {
      setWarn(true);
      return;
    }
    setWarn(false);
    setProgress([0, refs.length]);
    const st = await getAudioStore();
    await st.download(reciter, refs, (d, n) => setProgress([d, n]));
    setHave(await st.count(reciter, refs));
    setProgress(null);
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
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={progress !== null || have === refs.length}
          onClick={run}
          className="btn num flex-1"
        >
          {progress
            ? t("quiz.audio_dl.downloading", { done: progress[0], total: progress[1] })
            : warn
              ? t("quiz.audio_dl.cellular_go")
              : t("quiz.audio_dl.save")}
        </button>
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
