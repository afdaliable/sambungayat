import { useMemo, useState } from "react";
import { I18nProvider, useI18n } from "../../lib/i18n/react";
import type { Dict, Lang } from "../../lib/i18n/core";
import { parseRecap } from "../../lib/recap";

export default function RecapView({ lang, dict }: { lang: Lang; dict: Dict }) {
  return (
    <I18nProvider lang={lang} dict={dict}>
      <RecapInner />
    </I18nProvider>
  );
}

function RecapInner() {
  const { t, tp } = useI18n();
  const [text, setText] = useState("");
  const rows = useMemo(() => parseRecap(text), [text]);
  return (
    <div className="grid gap-x-14 gap-y-6 lg:grid-cols-2 lg:items-start">
      <div>
        <label className="text-lg font-extrabold" htmlFor="recap-input">
          {t("teacher.recap.label")}
        </label>
        <textarea
          id="recap-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="field mt-2 text-sm"
          placeholder={t("teacher.recap.placeholder")}
        />
      </div>
      <div aria-live="polite">
        {text && rows.length === 0 && (
          <p role="status" className="text-muted">
            {t("teacher.recap.none")}
          </p>
        )}
        {rows.length > 0 && (
          <table className="w-full text-start">
            <caption className="sub mb-3 text-start">
              {tp("teacher.recap.students", rows.length)}
            </caption>
            <thead className="text-sm text-muted">
              <tr className="border-b border-rule">
                <th className="py-2 text-start font-semibold">{t("teacher.recap.name")}</th>
                <th className="text-start font-semibold">{t("teacher.recap.score")}</th>
                <th className="text-start font-semibold">{t("teacher.recap.code")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.name}#${r.code}`} className="border-b border-line">
                  <td className="py-3">{r.name}</td>
                  <td className="num font-extrabold">
                    {r.score}/{r.total}
                  </td>
                  <td className="num text-sm text-muted">{r.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
