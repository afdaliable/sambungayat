# Developer guide

For people who want to change the code of Sambung Ayat. Read [CONTRIBUTING.md](../CONTRIBUTING.md) first (rules that protect users). Translators: see [translation-review-guide.md](translation-review-guide.md). `CLAUDE.md` is a longer, denser technical reference.

## 1. What it is

A static Quran-memorization quiz: no accounts, no backend for the quiz itself.

- **Web:** Astro 5 (static output) with React islands, Tailwind 4, TypeScript (strict). Deployed on Cloudflare Pages. A PWA (offline for Juz 30).
- **Android:** the same build wrapped with Capacitor 8 (`android/`, app id `com.sambungayat.app`). The app bundles `dist`, so it works offline.
- **Only server code:** one Cloudflare Pages Function, the public "quizzes completed" counter (`functions/api/stats.ts`, D1 database). It is optional and nothing depends on it.
- **Tests:** Vitest (unit), Playwright (end to end). ESLint and `astro check` for lint and types.

## 2. Set up

```sh
nvm use                                # Node version is in .nvmrc
npm ci
npm run data:fetch -- --missing-only   # downloads the Quran translations (not stored in the repo)
npm run data:build                     # builds public/data/v1
npm run dev                            # http://localhost:4321
```

Everything under `public/data/v1` is generated and git-ignored. If data is missing, the quiz fails to load.

Checks that CI runs (run them before a pull request):

```sh
npm run lint
npm run typecheck
npm test              # builds data, verifies it, runs the unit tests
npm run build         # also enforces the quiz JS size budget (120 KB gzip)
npx playwright install chromium   # once
npm run test:e2e
```

If e2e tests behave strangely, kill any old preview server on port 4321 (`playwright.config.ts` reuses a running server).

## 3. Repository map

| Path                            | What is there                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages`, `src/pages/[lang]` | Thin routes. Each renders a file from `src/views` with a `lang` prop. Indonesian has no URL prefix, other languages live under `/<code>/`.    |
| `src/views`                     | Page templates (Astro).                                                                                                                       |
| `src/components`                | `quiz/` (the React quiz app and its parts), `teacher/`, `ui/` (header, footer, share bar, paraf strip).                                       |
| `src/lib/quiz`                  | The quiz engine: `engine.ts`, `generators/*` (one file per mode), `rng.ts`, `url.ts` (config in the URL), `daily.ts`. Pure and deterministic. |
| `src/lib/quran`                 | Data loading (`loader.ts`), scope helpers, text normalisation and tokenising.                                                                 |
| `src/lib/storage`               | `localStorage` access (settings, history, mastery, daily score) and storage migrations.                                                       |
| `src/lib/i18n`                  | Translation helpers. `core.ts` is the pure part that client code imports.                                                                     |
| `src/lib/native`                | Android-only code (back button, system bars, app links, offline audio files, network status). Loaded lazily, never in the browser.            |
| `locales/<lang>/*.json`         | Interface texts, one folder per language.                                                                                                     |
| `scripts/`                      | `fetch-quran.ts`, `build-data.ts`, `verify-data.ts`, `verify-audio.ts`, `postbuild.ts`.                                                       |
| `data/`                         | `raw/` source data, `translations.json` (language to Quran edition), `surah-names-id.json`.                                                   |
| `functions/`, `migrations/`     | The counter function and its D1 schema.                                                                                                       |
| `tests/unit`, `tests/e2e`       | Vitest and Playwright tests.                                                                                                                  |
| `android/`                      | The Capacitor Android project.                                                                                                                |

## 4. Data pipeline

`data/raw/*.json` (from api.alquran.cloud) goes through `scripts/build-data.ts` into `public/data/v1/` (JSON per surah, plus `tr/<lang>/` for translations). `scripts/verify-data.ts` checks it (114 surahs, ayah counts, no stray characters).

- Never type or edit Quran text by hand.
- `public/data/v1/*` is served `immutable` for a year. A change to what `build-data` outputs after launch needs a new version path (`v2`), see `CLAUDE.md` before touching it.

## 5. The quiz engine and shared links

`generateQuiz(config, data)` is a pure function of `mode | scope | difficulty | seed` (plus `count`, which only trims the list). The same URL gives the same questions on every device. That is how the daily quiz and teacher links work.

So these are a **contract**: generator logic, tier order, `neededSurahs`, the RNG key format, `dailySeed`, scope keys (`juz:`, `surah:`, `range:`, `ayat:`), mode ids. Changing them changes questions for every link people already shared. Open an issue before you touch them. `tests/unit/scope-pins.test.ts` and `rng-url.test.ts` pin some of this.

Engine rules: it must give identical output whether the caller loaded all 114 surahs or only the needed ones, so use `getView` and `neededSurahs`, never `data.surahs` directly.

## 6. Interface text (i18n)

- Texts live in `locales/<lang>/<namespace>.json`, flat keys. The full key is `<namespace>.<key>`, for example `common.nav.quiz`.
- In Astro: `getDict(lang, ["ns"])` and `t(dict, "ns.key", { vars })`. In React islands: wrap in `I18nProvider` and use `useI18n()`. Import from `src/lib/i18n/core`, never from `src/lib/i18n` (it globs every locale and bloats the bundle).
- Every key must exist in all 12 languages, with the same `{placeholders}`. `tests/unit/i18n.test.ts` enforces it. Plurals use `.one` / `.other` (and more where the language needs them).
- Never translate: mode ids, scope keys, seeds, data paths, slugs, the recap tag format.
- Use logical classes (`start`/`end`, `ps`/`pe`, `rtl:` variants) so Arabic and Urdu stay correct.

## 7. Common tasks

**Add a page.** Create the view in `src/views`, two thin route files (`src/pages/x.astro` and `src/pages/[lang]/x.astro`), add its texts to every language, and add it to the footer or nav if it should be reachable.

**Add a language.** Register it in `LANGS` in `src/lib/i18n/index.ts`, add `locales/<lang>/<ns>.json` for every namespace, add its Quran edition to `data/translations.json` and check that edition's licence terms (see `docs/data-licenses.md`). Right-to-left languages need a layout pass.

**Add a reciter.** Add it to `src/config/reciters.ts` and run `npm run data:verify-audio`. Do not rename existing ids: they are stored in users' settings.

**Add a quiz mode.** Rare and sensitive. Add a generator under `src/lib/quiz/generators`, register the mode, add its texts and tests. Existing modes and their output must not change.

**Change the look.** Tokens and shared classes are in `src/styles/global.css` and `DESIGN.md`. Palette is cream paper plus deep teal; do not introduce blue or violet. Quran text always uses Amiri Quran and is never restyled.

## 8. Code style

- TypeScript strict. No `any` without a comment saying why.
- Code and comments in English. Source files in `src/` and `scripts/` stay plain ASCII (Arabic text goes in `locales/` or is built from code points).
- Keep static pages free of framework JS. The quiz page has a size budget, checked by the build.
- Prettier formats; a few files with inline links are in `.prettierignore` on purpose.

## 9. Android

Needs JDK 21 and the Android SDK (`ANDROID_HOME`).

```sh
npm run android:apk    # debug APK (builds the web app, syncs, runs Gradle)
```

Native code is only reached through `isNative()` (`src/lib/native/platform.ts`) and dynamic imports, so the web bundle stays unchanged. The release signing key is not in the repository; release builds are made by the maintainer.

## 10. Pull request checklist

Small, focused, one topic. Checks above pass. A screenshot at 360 px width (light and dark) for visible changes. Mention anything you were unsure about. A maintainer reviews every pull request.
