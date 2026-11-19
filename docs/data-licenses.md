# Data licences: findings and decisions (read before making the repo public)

Checked 2026-11-18 against the sources' own pages (not legal advice). Open decisions are marked **DECIDE**.

## What each source says

| Data                                         | Source                                      | Terms found                                                                                                                                                                                                                                                                                                                                                                                                    | Where it is in this repo                                                           |
| -------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Quran text (Uthmani)                         | Tanzil Project, via AlQuran.cloud           | CC BY 3.0. "Permission is granted to copy and distribute verbatim copies of this text, but CHANGING IT IS NOT ALLOWED." Usable in any website or app if Tanzil is clearly credited and a link to tanzil.net is given. The copyright notice must be reproduced in all verbatim copies and in files derived from or containing a substantial portion of the text. Source: <https://tanzil.net/docs/text_license> | `data/raw/quran-uthmani.json`, `public/data/v1/surah/*` (built)                    |
| Translations (11 editions + `id.indonesian`) | Tanzil translations list, via AlQuran.cloud | "For non-commercial purposes only." Any other use needs permission from the translator or publisher. More than 3 translations on a site or in an app must link back to <https://tanzil.net/trans/>. No separate per-edition licence is stated there.                                                                                                                                                           | `data/raw/tr.*.json`, `data/raw/id.indonesian.json`, `public/data/v1/tr/*` (built) |
| Recitation audio                             | EveryAyah                                   | Not checked in writing. The owner allowed offline saving (D4) without a verified source.                                                                                                                                                                                                                                                                                                                       | Not in the repo (streamed, optionally saved on the user's device)                  |
| Fonts                                        | Sofia Sans, Amiri Quran                     | SIL OFL, licence files in `public/fonts`                                                                                                                                                                                                                                                                                                                                                                       | `public/fonts`                                                                     |
| Code                                         | this project                                | MIT                                                                                                                                                                                                                                                                                                                                                                                                            | everything else                                                                    |

## Risks

1. **Modified Quran text.** `scripts/build-data.ts` separates the Basmalah and removes a BOM. Tanzil says changing the text is not allowed. The change is mechanical, but the published data is no longer a verbatim copy. Safer reading: keep the derived data out of the repo and say so in `NOTICE.md`, and/or ask the Tanzil Project in writing whether this transformation is acceptable.
2. **Translations are non-commercial only.** Sambung Ayat is free and has no ads, which fits "non-commercial", but a public repo plus a Play Store app is a wider redistribution than most readers expect. Individual translators and publishers can have stricter terms than the Tanzil page. Nothing here was verified edition by edition.
3. **Git history.** `data/raw` is already committed. Making the repo public publishes the whole history, so removing the files later does not remove them from earlier commits.

## Options

- **A. Ship as is.** Public repo includes `data/raw`. Lowest effort, highest exposure to risks 1 to 3.
- **B. Do not commit translations.** Add `data/raw/tr.*` and `id.indonesian.json` to `.gitignore`, let `npm run data:fetch` download them (CI would fetch before `data:build`). Needs a fresh public history (new repo or history rewrite) because of risk 3. **Recommended.**
- **C. Do not commit any raw data.** Same as B plus `quran-uthmani.json`. Cleanest for risk 1; the site still serves modified text, so a written answer from Tanzil is still worth asking for.

**DECIDED 2026-11-18: option B.** Translations are git-ignored (`data/raw/tr.*.json`, `data/raw/id.indonesian.json`) and fetched with `npm run data:fetch -- --missing-only` (CI caches them). The Uthmani text stays committed, with credit. The public repository must start from a clean history (see "Publishing" below); the existing private history still contains the translations.

## Publishing

The private repository keeps its history. For the public one, export the current tree into a new repository with one initial commit (no translations, no old history). Do not push the old history to a public remote.

## Always, whatever the option

- Keep the credits in the site footer, `/tentang`, README and `NOTICE.md`.
- The Tanzil copyright notice is in `NOTICE.md` and `public/NOTICE-TANZIL.txt` (copied verbatim from their licence page on 2026-11-19). Re-check the page for changes now and then.
- Link back to <https://tanzil.net/trans/> while more than 3 translations are used.
