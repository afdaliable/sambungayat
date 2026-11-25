# Sambung Ayat (sambungayat.com)

Static Quran-memorization quiz (web, PWA, Android and iOS). No backend for the quiz itself. See [CONTRIBUTING.md](CONTRIBUTING.md) and the technical guide ([Bahasa Indonesia](docs/developer-guide.id.md) / [English](docs/developer-guide.md)) first; this file is a denser technical reference for people and tools working in the code.

## Stack
Astro 5 (static) + React islands + Tailwind 4 (`@tailwindcss/vite`) + TypeScript strict. Vitest, Playwright, ESLint, Prettier. Node version in `.nvmrc` (`source ~/.nvm/nvm.sh && nvm use`).

## Commands
`dev` `build` (runs data:build first) `preview` `lint` `typecheck` (astro check) `test` (data:verify + vitest) `test:e2e` `data:fetch` (`-- --missing-only` downloads only absent files) `data:build` `data:verify` `data:verify-audio`

## Rules
- Never type Quran text by hand; only from data built by scripts.
- UI texts live in `locales/`; code and comments are English. No `any` without a comment saying why.
- Keep `src/` and `scripts/` pure ASCII (build Arabic patterns from code points, see `normalize.ts`). Check: `grep -rnP "[^\x00-\x7F]" src scripts` must be empty.
- Prettier mangles inline `<a>` in some files (spaces inside the underline): those are in `.prettierignore`; write inline links on one line.

## Dependencies pinned on purpose
Astro 5.x (`@vite-pwa/astro` peer range), `@astrojs/react` 4.x, TypeScript ~6.0 (`typescript-eslint` peer range).

## Data pipeline
`data/raw/*.json` (from api.alquran.cloud) -> `scripts/build-data.ts` -> `public/data/v1/` (gitignored, rebuilt on every `build`). Translations are not committed: `npm run data:fetch -- --missing-only` downloads them (terms: `docs/data-licenses.md`, `NOTICE.md`).
- API quirks: surah 1:1 has a BOM (U+FEFF), stripped. The Basmalah prefix is stripped by matching the first 4 normalized words (surahs 95 and 97 spell it with a different mark order, so an exact match fails). `nameLatin` comes from `data/surah-names-id.json`; `meaningId` is not populated. `id.indonesian` has no translator metadata.
- Slug = lowercase name minus apostrophes, kebab-case (`an-naba`). Slugs are public URLs: do not change. Names come from `data/surah-names-id.json`.
- `hasBasmalah` = render the Basmalah header above ayah 1: false for surah 1 (it is ayah 1) and surah 9.
- DATA VERSIONING: `/data/v1/*` is served `immutable` for a year. Bump the data path when shipping changed data at an existing URL; search all `data/v1` references (see the technical guide).

## Quiz engine
- `src/lib/quiz/engine.ts` `generateQuiz(config, data)`: pure and deterministic. RNG key = `mode|scope|difficulty|seed` (count excluded, so a smaller quiz is a prefix of a larger one).
- The engine only sees `neededSurahs` (scope + 1 neighbour each side) via `getView`, so output is identical whether the caller loaded all 114 surahs or only those. Do not read `data.surahs` directly in generators.
- Returns `{ questions, reduced }`; the pool can be 0 (for example lengkapi on surah 108). The UI handles empty and short quizzes.
- Sambung drops a question when its ayah text is followed by different ayahs anywhere in the loaded data. Tebak-surah/audio drop ayahs listed in `ambiguous.json`.
- Audio URL in a question uses `DEFAULT_RECITER`; the UI rebuilds it with `audioUrl(userReciter, s, a)` from `source`.
- CONTRACT: generator logic, tier order, `neededSurahs`, the RNG key format and `dailySeed` define shared links (daily, teacher). Changing any of them changes every existing link; treat it as a versioned break (new salt/`v2`). Scope keys (`juz:`, `surah:`, `range:`, `ayat:`), mode ids and slugs are pinned by `tests/unit/scope-pins.test.ts`.
- Modes: `sambung`, `tebak-surah`, `lengkapi`, `tebak-audio`, `tebak-juz`, `sebelum`. Scope kinds: juz (one or many), surah (one or many), range, `ayat:S:A-B` (inclusive ayah range in one surah; Sambung prompts the last ayah of the range so its answer can be one past the range, Sebelum the reverse).

## Quiz UI
- `/kuis` = `QuizApp` island (`client:load`). The query drives it: mode/scope/n/d all present -> auto-start (missing seed -> new seed, written back with replaceState); otherwise `QuizSetup`.
- Storage keys `sa:v1:{settings,history,mastery,daily}` via `src/lib/storage`. Theme and Arabic size are applied before first paint by an inline script in `BaseLayout.astro` (must mirror `applySettings`). The header theme toggle is vanilla JS, so static pages ship no React.
- Skipped questions (audio failed or offline) have answer "skip": excluded from score, history and mastery.
- `/harian` = daily quiz (fixed config, seed `dailySeed()` from the Jakarta date; the first attempt per day is the official score). `/guru` = teacher link builder (QR is lazy loaded). `/riwayat` = history and mastery. `/rekap` = class recap from pasted result tags (`src/lib/recap.ts`, no backend).
- Result page "Latih N soal yang salah" is an in-memory practice round (not saved to history, mastery or daily).
- Quiz page JS budget 120 KB gzip, enforced by `scripts/postbuild.ts` for every language's `kuis.html`.
- Static output uses `build.format: "file"` and `trailingSlash: "never"`; the canonical URL strips `.html`.

## Security headers and scripts
`public/_headers` holds the CSP with `__SCRIPT_HASHES__`; `scripts/postbuild.ts` fills in the hashes of every inline script, so a new inline script needs no manual hash. The `/kuis` and `/harian` early-fetch scripts mirror `neededSurahs`: keep them in sync if that changes.

## PWA
`@vite-pwa/astro` in `astro.config.mjs`. Precache: html pages, `_astro` assets, fonts, icons, the index/juz/ambiguous json and surahs 077-114 (077 is the neighbour that `neededSurahs` adds for Juz 30). Audio is never precached. `ignoreURLParametersMatching: [/.*/]` so `/kuis?...` hits the precached page. The service worker is registered in `BaseLayout` and skipped when `window.Capacitor` exists.

## i18n
- Layout: `locales/<lang>/<namespace>.json`, flat keys, full key `<namespace>.<key>`. `getDict(lang, namespaces)` merges with an Indonesian fallback; `t(dict, key, vars)` fills `{name}` and returns the key when missing. Plurals: `<key>.one/.other` (+ more) via `tp()`.
- Routing: Indonesian is the root with NO prefix, so older shared links stay valid; other languages live under `/<code>/`. Pages are thin: `src/pages/*.astro` and `src/pages/[lang]/*.astro` render `src/views/*.astro` with a `lang` prop. `/kontribusi` is the one English-only page without a prefix.
- Islands: wrap the root in `I18nProvider lang dict` and use `useI18n()`. Pass only the namespaces an island needs. Client code imports from `src/lib/i18n/core`, never from `src/lib/i18n`.
- NEVER translate or change: mode ids, scope keys, seeds, `dailySeed`, the recap tag format, data paths and slugs.
- Add a language: register it in `LANGS` (`src/lib/i18n/core.ts`), add `locales/<lang>/<ns>.json` for every namespace and its Quran edition in `data/translations.json`. `tests/unit/i18n.test.ts` checks keys, placeholders and plural families against Indonesian. ar and ur are `dir: "rtl"`: use logical classes (`start/end`, `ps/pe`, `rtl:`).
- Offline for non-Indonesian languages: an idle script in `BaseLayout` downloads that language's files once (flag `sa:v1:offline:<lang>`).

## Share, offline audio, recap
- Share links use `SITE.url`, never `location.origin` (it is `https://localhost` in the Android app). `src/lib/share.ts` uses the native share sheet, then Web Share, then the clipboard.
- Offline audio: `AudioStore` interface in `src/lib/audioCache.ts`; on web, the service worker serves audio saved in the Cache API. On Android, the store (`src/lib/native/audioStore.ts`) saves files in app storage and `useAudioSrc` resolves them before trying the remote URL.

## Android (Capacitor 8)
- App id `com.sambungayat.app`, bundles `dist` (offline, no server), `https://localhost` scheme. `npm run android:apk` builds a debug APK (JDK 21, Android SDK). Release signing keys are not in the repository.
- Capacitor falls back to `index.html` for extensionless paths, so `BaseLayout` has click and submit shims that rewrite internal URLs to `.html` inside the app.
- Native code lives in `src/lib/native/*` and is only reached through `isNative()` and dynamic imports, so the web bundle is unchanged. Edge-to-edge handling uses `--sat/--sab` and `html[data-native]` rules in `global.css`.
- App links: `toAppPath()` maps `https://sambungayat.com` URLs to bundled pages; the manifest has an `autoVerify` intent filter.
- Tailwind 4 needs Chrome 111+: on an older WebView the app shows a plain notice (`#old-webview`).

## iOS (Capacitor 8, Swift Package Manager)
- `ios/App`, same app id, iOS 16.4+ (first WebKit that renders Tailwind 4). Serves `dist` from `capacitor://localhost`; the `BaseLayout` `.html` shims accept both schemes. `scripts/ios.sh` backs `ios:sim` (simulator zip) and `ios:test` (XCUITest in `ios/App/AppUITests`); both need macOS + Xcode.
- No Back button: `BridgeViewController` adds a left-edge swipe that calls `webView.goBack()` (the built-in WKWebView gesture did not respond). The native status bar sits over a fixed band strip (`html[data-native] body::before`). `native/chrome.ts` only sets the status bar on iOS.
- Signing team, App Store Connect, TestFlight and review are manual (see the technical guide). Universal Links need `apple-app-site-association` on the site.

## Visual identity ("Buku Setoran")
- Palette: cream paper plus deep teal. Do not introduce blue or violet. Tokens in `src/styles/global.css` (`--paper --card --ink --muted --line --rule --accent --band --band-soft --good --bad --stamp` and dark counterparts). Details: `DESIGN.md`.
- Type: Sofia Sans Semi Condensed (UI, self-hosted, OFL) and Amiri Quran for ayah text, which is never restyled.
- Signature elements: the paraf strip (`ParafStrip`) and the brown result stamp. Shared classes: `.wrap .title .sub .num .measure .band .sheet .rows .btn .btn-quiet .btn-band .field .pick .opt .lnk`.
- Logo "Benang": see [BRAND.md](BRAND.md) and `docs/brand/benang/USE-GUIDE.md`. No Arabic text or scripture in the mark; never mirror the symbol in RTL.
