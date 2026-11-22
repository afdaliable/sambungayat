import { useState } from "react";
import { useI18n } from "../../lib/i18n/react";
import { downloadBackup, importBackup } from "../../lib/storage/backup";

export default function BackupControls({ onImport }: { onImport: () => void }) {
  const { t } = useI18n();
  const [message, setMessage] = useState("");
  return (
    <section className="sheet mb-6 p-4" aria-labelledby="backup-title">
      <h2 id="backup-title" className="sub">
        {t("common.backup.title")}
      </h2>
      <p className="mt-2 text-muted">{t("common.backup.description")}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          className="btn btn-quiet"
          onClick={() => {
            try {
              downloadBackup();
              setMessage("common.backup.exported");
            } catch {
              setMessage("common.backup.error");
            }
          }}
        >
          {t("common.backup.export")}
        </button>
        <label className="btn btn-quiet relative cursor-pointer">
          {t("common.backup.import")}
          <input
            type="file"
            accept=".json,application/json"
            className="absolute inset-0 w-full cursor-pointer opacity-0"
            aria-label={t("common.backup.import")}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              try {
                if (file.size > 5_000_000) throw new Error("Backup too large");
                const raw = await file.text();
                if (!window.confirm(t("common.backup.confirm"))) return;
                importBackup(raw);
                onImport();
                setMessage("common.backup.imported");
              } catch {
                setMessage("common.backup.error");
              }
            }}
          />
        </label>
      </div>
      {message && (
        <p role="status" className="mt-3">
          {t(message)}
        </p>
      )}
    </section>
  );
}
