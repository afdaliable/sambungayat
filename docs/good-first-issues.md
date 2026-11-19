# Starter issues (to publish as GitHub issues with the label `good first issue`)

Each one is small and independent. "Check" lists how to confirm it works.

## Translation reviews (one per language, see [translation-review-guide.md](translation-review-guide.md))

1. Review English (en) UI texts.
2. Review Malay (ms): "setor/setoran" is Indonesian usage, check Malaysian wording.
3. Review Turkish (tr): murajaah, "meal", mode names.
4. Review French (fr).
5. Review Spanish (es): long nav labels at 360 px.
6. Review German (de): long compound words at 360 px.
7. Review Russian (ru): informal vs formal address, transliterations.
8. Review Bengali (bn).
9. Review Hindi (hi).
10. Review Arabic (ar): plural forms, terms for student and teacher.
11. Review Urdu (ur): Nastaliq line height at 360 px.

## Other

12. **Surah names in Arabic and Urdu pages.** The ayah card in `/ar` and `/ur` still shows the Latin surah name ("Al-Ghasyiyah"). Show a localized name. Check: `/ar/kuis` and `/ur/kuis` question card.
13. **Meaning of surah names (Indonesian).** `meaningId` is empty for the 114 surahs. Provide a reliable source and a data file addition without touching the Quran text. Check: the surah page shows the meaning.
14. **Add a reciter.** Add one more qari from EveryAyah to `src/config/reciters.ts`. Check: `npm run data:verify-audio` passes for it and audio plays.
15. **Screen reader pass.** Go through the quiz with TalkBack or VoiceOver and list anything unlabelled or in the wrong order. Check: findings written as an issue, then fixes as separate small pull requests.
16. **Screenshots for the README.** Add 3 to 4 screenshots (home, question, result, teacher link) under `docs/screenshots` and link them in `README.md`.
17. **Jawi/Arabic-script companion for the logo.** Confirm the spelling of "Sambung Ayat" in Jawi with a native reader. Written as an issue only; do not draw it into the logo.
