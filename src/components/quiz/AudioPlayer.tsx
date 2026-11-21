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
  const [buffering, setBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function play(a: HTMLAudioElement) {
    a.play().catch((err: DOMException) => {
      setBuffering(false);
      // AbortError and NotAllowedError are not load failures.
      if (err.name === "NotSupportedError" && ref.current === a) onUnavailable();
    });
  }

  function updateProgress(a: HTMLAudioElement) {
    setDuration(Number.isFinite(a.duration) && a.duration > 0 ? a.duration : 0);
    setCurrentTime(Number.isFinite(a.currentTime) ? a.currentTime : 0);
  }

  useEffect(() => {
    setPlaying(false);
    setBuffering(false);
    setCurrentTime(0);
    setDuration(0);
    if (!ready) return;
    if (!navigator.onLine && !local) {
      onUnavailable();
      return;
    }
    // Browsers only allow autoplay after a user gesture; a rejected play() is fine.
    if (autoplay) ref.current?.play().catch(() => {});
  }, [src, ready]);

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <audio
        ref={ref}
        crossOrigin="anonymous"
        src={ready ? src : undefined}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setBuffering(false);
        }}
        onLoadStart={() => setBuffering(true)}
        onWaiting={() => setBuffering(true)}
        onCanPlay={() => setBuffering(false)}
        onPlaying={() => setBuffering(false)}
        onLoadedMetadata={(e) => updateProgress(e.currentTarget)}
        onDurationChange={(e) => updateProgress(e.currentTarget)}
        onTimeUpdate={(e) => updateProgress(e.currentTarget)}
        onError={() => {
          setBuffering(false);
          onUnavailable();
        }}
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={!ready}
          onClick={() => {
            const a = ref.current;
            if (!a) return;
            if (a.paused) play(a);
            else a.pause();
          }}
          className="btn btn-lg min-w-48"
        >
          <PlayIcon playing={playing} />
          {playing ? t("quiz.pause") : t("quiz.play")}
        </button>
        <button
          type="button"
          disabled={!ready}
          className="btn btn-quiet"
          onClick={() => {
            const a = ref.current;
            if (!a) return;
            a.currentTime = 0;
            setCurrentTime(0);
            play(a);
          }}
        >
          {t("quiz.audio_replay")}
        </button>
      </div>
      <div className="w-full max-w-xs">
        <div
          role="progressbar"
          aria-label={t("quiz.audio_progress")}
          aria-valuemin={0}
          aria-valuemax={duration || 1}
          aria-valuenow={Math.min(currentTime, duration)}
          className="h-2 overflow-hidden rounded-full bg-[var(--line)]"
        >
          <div
            className="h-full bg-[var(--accent)]"
            style={{ width: `${duration ? Math.min(currentTime / duration, 1) * 100 : 0}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-sm text-[var(--muted)]" aria-hidden="true">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <div role="status" className="min-h-5 text-sm text-[var(--muted)]">
        {(!ready || buffering) && t("quiz.loading")}
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}
