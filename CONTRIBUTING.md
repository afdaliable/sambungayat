# Contributing to Sambung Ayat

Thank you for helping. Sambung Ayat is a free Quran-memorization quiz (web, PWA and Android). Contributions of any size are welcome, and the easiest start is a **translation review** in your own language, which you can do entirely in the GitHub web editor, with no Git or coding (see [docs/translation-review-guide.md](docs/translation-review-guide.md)) or an issue labelled `good first issue` (ideas: [docs/good-first-issues.md](docs/good-first-issues.md)).

Please read the [code of conduct](CODE_OF_CONDUCT.md). By contributing you agree that your contribution is licensed under the project's [MIT licence](LICENSE).

Technical guide: [Bahasa Indonesia](docs/developer-guide.id.md) · [English](docs/developer-guide.md).

## Rules that protect users

1. **Never type or edit Quran text by hand.** Quran text and translations come only from the data pipeline (`data/raw` through `scripts/build-data.ts`; translations are downloaded by `npm run data:fetch`). A pull request that edits `data/raw/*` or `public/data/*` will be closed.
2. **Do not change shared-link behaviour by accident.** Quiz generators, the tier order, `neededSurahs`, the RNG key (`mode|scope|difficulty|seed`), `dailySeed`, scope keys (`juz:`, `surah:`, `range:`, `ayat:`), mode ids, slugs and data paths define links that teachers have already shared. Changing them breaks those links. If you think a change is needed, open an issue first.
3. **Quran translations are not editable here.** Their licence terms come from the translators. Only the interface texts in `locales/` are open for improvement.
4. **No tracking, no ads, no accounts.** Changes that send user data anywhere need an issue and a discussion first.

## Set up

Node version is in `.nvmrc` (use `nvm use`).

```sh
npm ci
npm run data:fetch -- --missing-only   # downloads the Quran translations (not stored in the repo)
npm run data:build                     # builds public/data/v1 from data/raw
npm run dev            # http://localhost:4321
```

Before opening a pull request, run what CI runs:

```sh
npm run lint
npm run typecheck
npm test                # data checks + unit tests
npm run build
npm run test:e2e        # for UI changes
```

## Conventions

- UI text: add the key to **every** language folder under `locales/` (the test `tests/unit/i18n.test.ts` checks that all languages have the same keys and `{placeholders}`). Indonesian is the reference. Flat keys, full key is `<namespace>.<key>`.
- Source files under `src/` and `scripts/` are plain ASCII. Build Arabic strings from code points, or put them in `locales/`.
- Use logical CSS classes (`start/end`, `ps/pe`) so Arabic and Urdu stay correct right-to-left.
- Code and comments in English. Keep changes small and focused, one topic per pull request.
- Do not commit secrets, keystores or `.env` files.

## Pull requests

- Fork, branch from `main`, make the change, run the checks above.
- Describe what and why. Add a screenshot for visible changes (at 360 px wide, light and dark).
- A maintainer reviews every pull request. For translations, a second native speaker may be asked to confirm.

## Questions

Open an issue, or write to halo@sambungayat.com.

_Ringkasan (Indonesia):_ jangan mengetik atau mengubah teks Al-Qur'an manual, jangan ubah logika kuis yang memengaruhi tautan yang sudah dibagikan, jalankan `npm run lint`, `typecheck`, `test`, `build` sebelum PR, dan tambahkan teks UI ke semua bahasa di `locales/`.
