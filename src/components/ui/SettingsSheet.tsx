import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../lib/i18n/react";
import { RECITERS } from "../../config/reciters";
import { clearAll } from "../../lib/storage";
import {
  applySettings,
  DEFAULT_SETTINGS,
  resetSettingsCache,
  updateSettings,
  useSettings,
} from "../../lib/storage/settings";

type Props = { open: boolean; onClose: () => void };

const ROW = "flex min-h-12 items-center justify-between gap-3 py-1";

export default function SettingsSheet({ open, onClose }: Props) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const s = useSettings();
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    if (!open) setConfirmClear(false);
    // Scroll lock: keep the page behind the modal still.
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const check = (
    labelKey: string,
    key: "showTranslation" | "showContext" | "autoplay" | "sound",
  ) => (
    <label className={ROW}>
      <span>{t(labelKey)}</span>
      <input
        type="checkbox"
        className="size-5 shrink-0 accent-accent"
        checked={s[key]}
        onChange={(e) => updateSettings({ [key]: e.target.checked })}
      />
    </label>
  );

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="settings-title"
      className="m-auto w-[min(92vw,28rem)] rounded-[0.625rem] border border-line bg-card p-5 text-ink shadow-[var(--lift)] backdrop:bg-[#0f1a18]/60"
    >
      <h2 id="settings-title" className="sub">
        {t("settings.title")}
      </h2>
      <div className="rows mt-4">
        {check("settings.translation", "showTranslation")}
        {check("settings.context", "showContext")}
        {check("settings.autoplay", "autoplay")}
        {check("settings.sound", "sound")}
        <label className={ROW}>
          <span>{t("settings.reciter")}</span>
          <select
            className="field w-auto max-w-[60%]"
            value={s.reciter}
            onChange={(e) => updateSettings({ reciter: e.target.value as typeof s.reciter })}
          >
            {RECITERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className={ROW}>
          <span>{t("settings.arabic_size")}</span>
          <select
            className="field w-auto max-w-[60%]"
            value={s.arabicSize}
            onChange={(e) => updateSettings({ arabicSize: e.target.value as typeof s.arabicSize })}
          >
            {(["S", "M", "L", "XL"] as const).map((z) => (
              <option key={z} value={z}>
                {t(`settings.size.${z}`)}
              </option>
            ))}
          </select>
        </label>
        <label className={ROW}>
          <span>{t("settings.theme")}</span>
          <select
            className="field w-auto max-w-[60%]"
            value={s.theme}
            onChange={(e) => updateSettings({ theme: e.target.value as typeof s.theme })}
          >
            <option value="system">{t("settings.theme.system")}</option>
            <option value="light">{t("settings.theme.light")}</option>
            <option value="dark">{t("settings.theme.dark")}</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          className="btn-quiet text-bad"
          onClick={() => {
            if (!confirmClear) return setConfirmClear(true);
            clearAll();
            resetSettingsCache();
            applySettings(DEFAULT_SETTINGS);
            setConfirmClear(false);
          }}
        >
          {confirmClear ? t("settings.confirm_clear") : t("settings.clear")}
        </button>
        <button
          type="button"
          className="btn"
          onClick={onClose}
        >
          {t("settings.close")}
        </button>
      </div>
    </dialog>
  );
}
