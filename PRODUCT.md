# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Everyone who memorises the Quran and wants to check it alone, as inclusively as possible (owner's answer, 2026-11-13: no single primary group):

- Students and santri, mostly on a phone, in short sessions of about five minutes.
- TPQ teachers who send one quiz link to a class over WhatsApp and collect scores from the chat.
- Parents sitting next to a primary-school child; the child taps the answers.
- Adults keeping a larger memorisation alive (many juz).

Indonesian first; 11 more languages, two of them right-to-left (Arabic, Urdu). Ages range from children to the elderly, so nothing may depend on small text, fine motor control or prior app habits.

## Product Purpose

Sambung Ayat (sambungayat.com) is a free quiz for murajaah: it shows an ayah and asks what comes next, what came before, which surah or juz it is from, which word is missing, or which text matches a recitation. It exists so a memoriser can test themselves at any moment without waiting for a turn with a teacher. Success: a visitor starts a quiz within seconds, finishes it, sees which ayahs are weak, and comes back the next day.

## Positioning

- The same link produces the same questions for everyone (seeded, deterministic), so a teacher link or the daily challenge is one shared paper without any server or account.
- Quran text is never typed by hand: it is built by script from Tanzil Project data (Uthmani rasm).
- No login, no ads, history stays on the device, Juz 30 works offline after the first visit.

## Operating Context

- Six modes: sambung (next ayah), sebelum (previous ayah), tebak-surah, tebak-juz, lengkapi (missing words), tebak-audio (recitation from EveryAyah).
- Scope: one or several juz, one or several surahs, or an ayah range inside a surah. 5, 10 or 20 questions; easy or hard distractors.
- Daily challenge: ten questions, identical for everyone per Jakarta day; first attempt is the official score.
- Teacher flow: `/guru` builds a link and QR; students send a result tag through chat; `/rekap` turns the pasted chat into a class table.
- `/riwayat` ranks surahs by weakness. Result page can replay only the wrong answers.
- Reference pages: `/juz`, `/juz/N`, `/surah`, 114 `/surah/slug`, `/panduan`, `/faq`, `/tentang`, `/kontak`.
- Real usage so far (D1 counter, 2026-11-09): 24 finished quizzes, 23 of them Sambung Ayat, mostly Juz 30.
- Installed as a PWA and as an Android APK (Capacitor) built from the same static output.

## Capabilities and Constraints

- Static Astro 5 site, React islands only on quiz, teacher, recap and history pages. Home, juz and surah pages ship no framework JavaScript. `/kuis` budget: 120 KB gzip.
- Shared links are a contract: mode ids, scope keys, seeds, slugs, data paths and the recap tag must never change.
- User-adjustable: light/dark theme and four Arabic text sizes, applied before first paint.
- Arabic Quran text is set in Amiri Quran (bundled, OFL); it must stay large, fully vowelled and never be clipped, letter-spaced or restyled.
- All UI strings live in `locales/<lang>/*.json` with parity across 12 languages; layout must hold at 360px and in RTL.
- A tool for murajaah, not a replacement for talaqqi with a teacher; the footer says so.
- Undecided: final app icon and OG image (placeholders now), contact email, translator credit for the Indonesian translation.

## Brand Commitments

- Name "Sambung Ayat", domain sambungayat.com. No logo exists yet (placeholder tile "SA").
- Voice: plain Indonesian, second person "kamu", short sentences, no hype.
- Anti-references confirmed by the owner (2026-11-13). A polished result is still wrong if it looks like:
  - a children's game (mascots, confetti, points, candy colours),
  - a stiff government or institutional site,
  - Islamic cliche (dome silhouettes, gold ornaments, pasted eight-point stars, greeting-card mood),
  - a generic startup or AI template (gradients, glass cards, uniform icon tiles).
- The previous look (cream paper, teal accent, stacked bordered cards in one 640px column) was rejected by the owner as generic and characterless; it is an anti-reference, not a brand asset.

## Evidence on Hand

- Full Quran text, Indonesian translation and 11 other translations in `data/raw/`, built to `public/data/v1/`.
- Public counter `/api/stats` (total and last seven days); shown on home from 20 completions.
- No testimonials, press, user photos or illustrations exist. Do not invent them.

## Product Principles

1. The ayah is the content. Chrome never competes with Quran text.
2. One tap to start: the default path (Sambung Ayat, Juz 30, ten questions) is always the most obvious thing on the page.
3. Respectful without ornament: seriousness comes from typography and restraint, not from religious decoration.
4. Works for a child and a grandparent on the same cheap phone: big targets, big text, no hidden gestures.
5. Honest about limits: says what it does not replace and what needs internet.

## Accessibility & Inclusion

- WCAG AA contrast in both themes; Lighthouse accessibility currently 100 and must not drop.
- Tap targets at least 44px; quiz answerable with digit keys.
- Full RTL support (ar, ur); long labels in fr, es, ru must not overflow at 360px.
- Honour `prefers-reduced-motion`.
