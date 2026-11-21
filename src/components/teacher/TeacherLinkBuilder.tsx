import { track } from "../../lib/analytics";
import { useEffect, useState } from "react";
import { I18nProvider, useI18n } from "../../lib/i18n/react";
import type { Dict, Lang } from "../../lib/i18n/core";
import { SITE } from "../../config/site";
import { browserLoader } from "../../lib/quran/loader";
import { newSeed } from "../../lib/quiz/rng";
import type { QuizConfig } from "../../lib/quiz/types";
import { DEFAULT_CONFIG, encodeConfig } from "../../lib/quiz/url";
import QuizSetup from "../quiz/QuizSetup";

export default function TeacherLinkBuilder({ lang, dict }: { lang: Lang; dict: Dict }) {
  return (
    <I18nProvider lang={lang} dict={dict}>
      <TeacherInner />
    </I18nProvider>
  );
}

function TeacherInner() {
  const { t, path } = useI18n();
  const [meta, setMeta] = useState<Awaited<ReturnType<typeof browserLoader.loadMeta>> | null>(null);
  const [link, setLink] = useState("");
  const [qr, setQr] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    browserLoader
      .loadMeta()
      .then(setMeta)
      .catch(() => setNote(t("teacher.load_failed")));
  }, []);

  const build = async (c: Omit<QuizConfig, "seed">) => {
    track("teacher_link_created", { mode: c.mode, count: c.count });
    const url = `${SITE.url}${path("/kuis")}?${encodeConfig({ ...c, seed: newSeed() })}`;
    setLink(url);
    setNote("");
    setQr("");
    try {
      const QRCode = (await import("qrcode")).default; // lazy: only this page needs it
      setQr(await QRCode.toDataURL(url, { margin: 1, width: 240 }));
    } catch {
      setNote(t("teacher.qr_failed"));
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setNote(t("teacher.copied"));
    } catch {
      setNote(t("teacher.copy_failed"));
    }
  };

  if (!meta)
    return (
      <p role="status" className="py-10 text-center text-muted">
        {note || t("quiz.loading")}
      </p>
    );

  return (
    <div className="flex flex-col gap-10">
      <QuizSetup
        initial={DEFAULT_CONFIG}
        index={meta.index}
        juz={meta.juz}
        onStart={build}
        title={t("teacher.title")}
        submitLabel={t("teacher.submit")}
      />

      {link && (
        <section aria-labelledby="link-title" className="fade-in sheet p-5 sm:p-7">
          <h2 id="link-title" className="sub">
            {t("teacher.ready")}
          </h2>
          <p className="mt-1 text-muted">{t("teacher.same_questions")}</p>
          <div className="mt-5 flex flex-wrap items-start gap-x-10 gap-y-5">
            <div className="min-w-0 flex-1 basis-72">
              <input
                readOnly
                aria-label={t("teacher.link_label")}
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                className="field num text-sm"
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={copy} className="btn">
                  {t("teacher.copy")}
                </button>
                <a
                  className="btn-quiet px-2 text-center text-sm"
                  href={`https://wa.me/?text=${encodeURIComponent(t("teacher.wa_text", { link }))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("teacher.wa")}
                </a>
              </div>
              <p aria-live="polite" className="mt-3 min-h-6 text-sm text-muted">
                {note}
              </p>
            </div>
            {qr && (
              <img
                src={qr}
                width={240}
                height={240}
                alt={t("teacher.qr_alt")}
                className="rounded-md border border-line bg-white"
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
