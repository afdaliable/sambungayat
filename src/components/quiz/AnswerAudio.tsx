import { useI18n } from "../../lib/i18n/react";
import { useEffect, useRef, useState } from "react";
import { PlayIcon } from "./AudioPlayer";
import { useAudioSrc } from "../../lib/useAudioSrc";

/** Small play button shown under the correct option after answering. Hides itself if the audio cannot load. */
export default function AnswerAudio({ src: remote }: { src: string }) {
  const { t } = useI18n();
  const { src, ready, local } = useAudioSrc(remote);
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setFailed(false);
  }, [src]);

  if (failed || !ready || (!navigator.onLine && !local)) return null;

  return (
    <div className="mt-2">
      <audio
        ref={ref}
        crossOrigin="anonymous"
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      <button
        type="button"
        onClick={() => {
          const a = ref.current;
          if (!a) return;
          if (a.paused) a.play().catch(() => {});
          else a.pause();
        }}
        className="btn-quiet min-h-11 min-w-44 px-4 text-sm"
      >
        <PlayIcon playing={playing} />
        {playing ? t("quiz.pause") : t("quiz.play_correct")}
      </button>
    </div>
  );
}
