import { useI18n } from "../../lib/i18n/react";
import { useEffect, useRef, useState } from "react";
import { useAudioSrc } from "../../lib/useAudioSrc";

type Props = { src: string; autoplay: boolean; onUnavailable: () => void };

export function PlayIcon({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 shrink-0 fill-current">
      <path d={playing ? "M5 3h3.5v14H5zM11.5 3H15v14h-3.5z" : "M5.5 2.8v14.4L17 10z"} />
    </svg>
  );
}

export default function AudioPlayer({ src: remote, autoplay, onUnavailable }: Props) {
  const { t } = useI18n();
  const { src, ready, local } = useAudioSrc(remote);
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const fail = () => {
    setFailed(true);
    onUnavailable();
  };

  useEffect(() => {
    setPlaying(false);
    setFailed(false);
    if (!ready) return;
    if (!navigator.onLine && !local) {
      setFailed(true);
      onUnavailable();
      return;
    }
    // Browsers only allow autoplay after a user gesture; a rejected play() is fine.
    if (autoplay) ref.current?.play().catch(() => {});
  }, [src, ready]);

  if (failed) {
    return (
      <p role="status" className="text-muted">
        {t("quiz.audio_failed")}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-center py-6">
      <audio
        ref={ref}
        crossOrigin="anonymous"
        src={ready ? src : undefined}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={fail}
      />
      <button
        type="button"
        disabled={!ready}
        onClick={() => {
          const a = ref.current;
          if (!a) return;
          if (a.paused)
            a.play().catch((err: DOMException) => {
              // AbortError (quick pause) and NotAllowedError are not load failures
              if (err.name === "NotSupportedError") fail();
            });
          else a.pause();
        }}
        className="btn btn-lg min-w-48"
      >
        <PlayIcon playing={playing} />
        {playing ? t("quiz.pause") : t("quiz.play")}
      </button>
    </div>
  );
}
