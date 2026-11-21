import { useEffect, useSyncExternalStore, useState } from "react";
import { t, type Dict } from "../../lib/i18n/core";
import { checkStorage, isTemporaryStorage, subscribeStorage } from "../../lib/storage";
import { downloadBackup } from "../../lib/storage/backup";

export default function StorageNotice({ dict }: { dict: Dict }) {
  const temporary = useSyncExternalStore(subscribeStorage, isTemporaryStorage, () => false);
  const [error, setError] = useState(false);
  useEffect(checkStorage, []);
  if (!temporary) return null;
  return (
    <aside className="wrap mt-4" aria-label={t(dict, "common.backup.title")}>
      <div className="sheet p-4">
        <p role="status">{t(dict, "common.storage.notice")}</p>
        <button
          className="btn btn-quiet mt-3"
          onClick={() => {
            try {
              downloadBackup();
              setError(false);
            } catch {
              setError(true);
            }
          }}
        >
          {t(dict, "common.backup.export")}
        </button>
        {error && <p role="status">{t(dict, "common.backup.error")}</p>}
      </div>
    </aside>
  );
}
