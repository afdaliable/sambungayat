import { useEffect, useState } from "react";
import { useI18n } from "../../lib/i18n/react";
import { isNative } from "../../lib/native/platform";
import { readJson } from "../../lib/storage";

/** Android app only: daily notification for the Daily Challenge. Native code loads on demand. */
export default function ReminderToggle() {
  const { t } = useI18n();
  const [native, setNative] = useState(false);
  const [on, setOn] = useState(false);
  const [time, setTime] = useState("19:00");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!isNative()) return;
    setNative(true);
    const r = readJson<{ on: boolean; time: string }>("reminder", { on: false, time: "19:00" });
    setOn(r.on);
    setTime(r.time);
  }, []);
  if (!native) return null;

  const apply = async (nextOn: boolean, nextTime: string) => {
    const m = await import("../../lib/native/reminder");
    if (!nextOn) {
      await m.disableReminder();
      setOn(false);
      return;
    }
    const ok = await m.enableReminder(nextTime, t("quiz.daily.title"), t("quiz.reminder.body"));
    setOn(ok);
    setMsg(ok ? "" : t("quiz.reminder.denied"));
  };

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 text-sm">
      <span className="font-semibold">{t("quiz.reminder.label")}</span>
      <input
        type="time"
        value={time}
        onChange={(e) => {
          setTime(e.target.value);
          if (on && e.target.value) void apply(true, e.target.value);
        }}
        aria-label={t("quiz.reminder.label")}
        className="field w-auto"
      />
      <button type="button" className="btn-quiet" onClick={() => void apply(!on, time)}>
        {on ? t("quiz.reminder.disable") : t("quiz.reminder.enable")}
      </button>
      <span aria-live="polite" className="text-muted">
        {msg}
      </span>
    </div>
  );
}
