# Review the translation of Sambung Ayat in your language

The interface texts of every language except Indonesian were written with an AI assistant and **have not been reviewed by a native speaker**. If you speak one of these languages well, a review is the most useful contribution you can make, and it needs no programming beyond editing a text file.

Languages: English (en), Malay (ms), Turkish (tr), French (fr), Spanish (es), German (de), Russian (ru), Bengali (bn), Hindi (hi), Arabic (ar), Urdu (ur).

## What to review

Files are in `locales/<code>/` (for example `locales/fr/`). Each file is a flat JSON list of `"key": "text"`. Indonesian (`locales/id/`) is the reference for meaning.

- Is it natural, polite and consistent? (formal or informal address, the same word for the same thing)
- Are religious terms right for your community? Examples: murajaah (revision), talaqqi (learning with a teacher), juz, surah, qari. The notes in [i18n-review.md](i18n-review.md) list the open questions per language.
- Does it fit a small phone screen? Long words on buttons and the menu are a known problem (German, Russian, Spanish, French).
- For Arabic and Urdu: check the right-to-left layout, plural forms and fonts.

## What not to change

- Keys (the text on the left of the colon) and `{placeholders}` such as `{name}` or `{total}`: keep them exactly. The test checks it.
- Quran text, translations of the Quran and surah names: these come from the data pipeline, not from `locales/`.
- Mode ids and link formats.

## Newer texts that need a second look

These keys were added recently and are machine-drafted in every language, so check them first:

- `quiz.daily.streak`, `quiz.share.image`, `quiz.share.image_saved`, `quiz.daily.title` (day streak and the result image card)
- `quiz.reminder.*` (Android daily reminder: the notification text is shown on the lock screen)
- `quiz.audio_*` (audio player, offline audio download, retry and skip)
- `quiz.translation_loading`, `quiz.translation_unavailable`
- `common.backup.*`, `common.storage.notice` (progress backup, "storage unavailable" notice)

In the files, search for these key names and edit the text on the right.

## Translate in the browser

A web translation tool (Weblate) is being set up so that you can translate without Git. Until it is live, use a pull request or an issue as described below. Maintainers: see [weblate-setup.md](weblate-setup.md).

## How to send it

1. Fork the repository, edit the files in `locales/<your language>/`.
2. Run `npx vitest run tests/unit/i18n.test.ts` (needs `npm ci` once). It must pass.
3. Open a pull request titled `i18n(<code>): review`, listing what you changed and anything you were unsure about.

Not comfortable with Git? Open an issue with the key and your proposed text, and a maintainer will apply it with credit to you.
