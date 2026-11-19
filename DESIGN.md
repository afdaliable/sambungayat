---
name: Sambung Ayat
description: A teacher's memorisation record book turned into a quiz - cream paper, deep teal band, one cell per question, a brown stamp at the end.
colors:
  paper: "#f6f0de"
  card: "#fffcf2"
  ink: "#1f2d2a"
  muted: "#55645f"
  line: "#dcd2b4"
  rule: "#8a8363"
  teal: "#0d5750"
  teal-soft: "#cfe8e0"
  good: "#1b7048"
  bad: "#a03a2c"
  stamp: "#7a4a1e"
  night-paper: "#0f1a18"
  night-card: "#172420"
  night-ink: "#e8efe9"
  night-accent: "#5fc2b2"
  night-band: "#0f433d"
typography:
  display:
    fontFamily: "Sofia Sans Semi Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 1.6rem + 5.6vw, 4.75rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "normal"
  headline:
    fontFamily: "Sofia Sans Semi Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 1.4rem + 2.2vw, 2.75rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Sofia Sans Semi Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1.2
  body:
    fontFamily: "Sofia Sans Semi Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Sofia Sans Semi Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.2
  ayah:
    fontFamily: "Amiri Quran, Noto Naskh Arabic, Traditional Arabic, serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 2.3
rounded:
  cell: "3px"
  key: "4px"
  control: "6px"
  stamp: "8px"
  sheet: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "8px 20px"
    height: "48px"
  button-band:
    backgroundColor: "#ffffff"
    textColor: "{colors.teal}"
    rounded: "{rounded.control}"
    padding: "8px 24px"
    height: "56px"
  button-quiet:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 20px"
    height: "48px"
  field:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "48px"
  option:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
    height: "56px"
  sheet:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
  strip-cell:
    backgroundColor: "{colors.card}"
    textColor: "{colors.muted}"
    rounded: "{rounded.cell}"
    size: "36px"
  stamp:
    textColor: "{colors.stamp}"
    rounded: "{rounded.stamp}"
    padding: "10px 24px 8px"
---

# Design System: Sambung Ayat

## Overview

**Creative North Star: "Buku Setoran"**

The system is the santri's setoran record book made into a tool. Each question is one cell that gets a tick or a stroke; a finished round is stamped by the teacher. The ayah is the content and the chrome stays quiet around it: cream paper, a deep teal band for the header and the home start field, ruled rows instead of stacked cards, and one condensed school-form sans.

The world lends type, palette, density and two signature moves (the paraf strip and the result stamp). Layout, navigation and controls stay ordinary web components. There is no paper texture, no handwriting face and no ledger costume. The owner replaced an earlier ink-blue and violet palette with cream, teal and brown because the blue looked too AI; do not drift back.

Seriousness comes from typography and restraint, not religious decoration. Density is moderate: big tap targets (48-56px), large text, readable by a child and a grandparent on a cheap phone.

**Key Characteristics:**
- Cream paper ground, teal band as the single committed colour field.
- Red and green mean wrong and right only; brown means the stamp only.
- Ruled hairline rows with fixed columns; state changes recolour, never resize.
- Amiri Quran ayah text is large and untouched by any styling.
- Flat at rest; one soft ambient lift on floating sheets.
- Dark theme is "carbon paper": same roles, teal-green tinted darks.

## Colors

A restrained cream-and-teal palette with semantic red, green and brown. Every role has a light and a dark value (dark under `.dark`); roles are the contract, hexes follow them.

### Primary
- **Deep Record Teal** (#0d5750): the header band, the home start field, primary buttons, links, focus rings, selected tiles, accent. Dark theme: Lifted Mint Teal (#5fc2b2) for accent/links, with the band deepened to Night Band Teal (#0f433d).
- **Mint Band Text** (#cfe8e0): secondary text on the teal band (green-tinted, never grey) and hover wash on the white band button.

### Tertiary
- **Stamp Brown** (#7a4a1e): the result stamp and the mini score stamp only. Dark theme: Warm Sand (#dfae7e).

### Neutral
- **Cream Paper** (#f6f0de): page ground. Dark: Carbon Paper (#0f1a18).
- **Warm Card** (#fffcf2): sheets, fields, option tiles, strip cells. Dark: #172420.
- **Green-Black Ink** (#1f2d2a): body text. Dark: #e8efe9.
- **Quiet Slate Green** (#55645f): secondary text, option keys, unfilled strip numerals. Dark: #a3b5ad.
- **Parchment Hairline** (#dcd2b4): row dividers and sheet borders. Dark: #2b3b36.
- **Ruled Pen Grey-Olive** (#8a8363): control borders (1.5px), strip cell borders. Dark: #5f776f.
- **Right Green** (#1b7048) and **Wrong Red** (#a03a2c): answer feedback only. Dark: #66c994 and #ee9486.

### Named Rules
**The Three Meanings Rule.** Teal is structure and action, red/green are verdicts, brown is the stamp. Never use red, green or brown decoratively, and never use teal for a verdict.
**The Tinted Secondary Rule.** Secondary text on the teal band uses Mint Band Text, never grey or reduced-opacity white.

## Typography

**Display, UI and body font:** Sofia Sans Semi Condensed (variable 100-900, bundled latin / latin-ext / cyrillic, fallback system-ui)
**Quran font:** Amiri Quran (bundled, fallbacks Noto Naskh Arabic, Traditional Arabic)
**Urdu:** Noto Nastaliq Urdu stack with line-height 1.9 on `html[lang=ur]`.

**Character:** A narrow, sturdy school-form sans with bold tabular numerals, paired with a classical Naskh for the ayah. A condensed face reads small, so the whole size scale is one notch above Tailwind defaults.

### Hierarchy
- **Display** (800, clamp 2.75rem to 4.75rem, 0.95): home h1 only.
- **Headline** (800, clamp 1.875rem to 2.75rem, 1.08, -0.01em): page titles (`.title`).
- **Title** (800, 1.375rem, 1.2): section and sheet headings (`.sub`, prose h2).
- **Body** (400, 1.0625rem, 1.5): running text, measure capped at 68ch (`.measure`).
- **Label** (600, 0.9375rem, 1.2): buttons, tiles, option tags (800 for verdict tags). Small notes use 0.8125rem.
- **Ayah** (Amiri Quran, `--ar-size` 1.875rem, line-height 2.3): user sizes S 1.625 / M 1.875 / L 2.25 / XL 2.75rem. The asked ayah (`.ayah-lead`) is 1.3x the answer size.

### Named Rules
**The Untouched Ayah Rule.** Arabic text is never letter-spaced, clipped, uppercased, recoloured for decoration or given tight line-height.
**The Tabular Numeral Rule.** Scores, counts and numbered steps use tabular lining numerals (`.num`).

## Layout

One page frame (`.wrap`): centred, max 68rem, 16px inline padding (24px from 40rem). Header and home start field are full-bleed teal bands; content below sits on cream. Home at desktop splits the start form (start side) from a live, answerable sample question on a white sheet (end side); on phone they stack. Content sections use two-column ruled lists at desktop. Spacing rhythm is Tailwind's 4px scale, with section gaps around 40px and controls 8px apart.

Responsive and RTL: must hold at 360px with no horizontal overflow; header nav wraps. Use logical properties (start/end, ps/pe, `rtl:` variants). Arabic and Urdu are RTL.

Build note (not a rule): the home page has no 30-juz grid at the fold. The surface brief called for one beginning at the fold; the owner found home too long, so juz selection is a single `<select>` in the start form and a link to `/juz`.

### Named Rules
**The Fixed Slot Rule.** Answer options, strip cells and ruled-row columns keep their size across states; feedback changes colour and a tag, never layout.

## Elevation & Depth

Flat by default, tonal layering instead of shadows: paper, card and band do the work, with 1px parchment borders. One soft ambient lift (`0 1px 0 rgb(31 45 42 / 0.05), 0 14px 28px -16px rgb(31 45 42 / 0.4)`, darker in dark theme) sits under floating sheets only: the home sample sheet and the language menu. Answer verdicts use an inset 1.5px ring in the verdict colour, not an outer shadow.

### Named Rules
**The Lift Is For Floating Things Rule.** Only sheets that float over a field (sample sheet, dropdown) get the lift. Rows, tiles and buttons never do.

## Shapes

Small, practical radii: 3px strip cells, 4px option keys, 6px controls (buttons, fields, tiles, options), 8px stamp, 10px sheets. Controls carry 1.5px borders in Ruled Pen Grey-Olive; sheets 1px in Parchment Hairline. Lists are ruled by hairlines between entries (top and bottom borders), not enclosed in cards. The stamp is a rounded rectangle with a 3px border and a 1px outer ring offset 3px.

## Components

### Buttons
- **Shape:** 6px radius, min height 48px (large 56px), 600 weight (large 800), padding 8px 20px.
- **Primary** (`.btn`): teal fill, white text; hover mixes 14% ink into teal.
- **Band** (`.btn-band`): white fill, teal text, used on the teal field; hover Mint Band Text.
- **Quiet** (`.btn-quiet`): warm card, 1.5px rule border; hover turns border and text teal.
- **Focus / Active:** 3px teal outline, 2px offset (white on the band, teal again inside a sheet on the band); active moves 1px down; disabled 55% opacity.

### Fields and Choice Tiles
- **Field:** 48px, warm card, 1.5px rule border, 6px radius; hover border teal; on the band the border is Mint Band Text.
- **Pick tile** (`.pick`, wraps a hidden radio/checkbox): bordered tile; checked fills teal with white text. On the band tiles are transparent with mint borders and the checked one inverts to white with teal text.

### Answer Option
Fixed 56px slot with a 28px numbered key box (digit keys answer the quiz). Right: green border, 11% green wash, inset green ring, key filled green, tag in green. Wrong: the same in red. Unchosen after answering: dimmed. Colour only, never size.

### Navigation
Header is the teal band: wordmark (800), six links in Mint Band Text, current page white, 800, with a 3px inset underline. Theme toggle and a native `<details>` language switch sit at the end; on phones the nav drops to a second row separated by a 20% white rule. Min tap height 44px.

### Sheets and Ruled Rows
Warm card, 1px hairline border, 10px radius (`.sheet`); `.rows` gives a hairline between entries with fixed columns. Content lists on home, FAQ and history are ruled rows, not nested cards. FAQ uses `<details>` with a drawn chevron that flips in RTL.

### Paraf Strip (signature)
One square cell per question (max 10 columns, 36px, 4px gap), warm card with a 1.5px rule border. The current cell has a 3px ink border; answered cells get a drawn tick (green) or stroke (red), skipped a dash. On the quiz it is the progress bar (`role=progressbar`); on the result it is a decorative summary. The home sample sheet uses a 5-cell strip.

### Result Stamp (signature)
Brown, uppercase, 800, 0.06em tracking, 3px border plus outer ring, rotated -4deg, with a 3.25rem tabular score and the date. It lands once with a 0.32s scale-and-blur animation (the single authored motion; off under reduced motion). The mini stamp (`.stamp-mini`, 2px border, no rotation, no animation) marks a score in lists.

## Do's and Don'ts

### Do:
- **Do** keep the teal band to the header and the home start field; everything else is cream paper and warm card.
- **Do** keep the ayah in Amiri Quran at user-chosen size with line-height 2.3.
- **Do** express list content as ruled hairline rows with fixed columns.
- **Do** make every target at least 44px (48-56px for quiz controls) and keep AA contrast in both themes.
- **Do** keep red, green and brown to their meanings: wrong, right, stamp.
- **Do** use logical (start/end) classes so RTL works, and verify at 360px.
- **Do** use the stamp only for results and score summaries, one large stamp per screen.

### Don't:
- **Don't** reintroduce ink blue or violet; the owner rejected the blue look as AI-generic.
- **Don't** use gradients, glass cards, uniform icon tiles, mascots, confetti, candy colours, dome or star ornaments, gold, or a handwriting face (PRODUCT.md anti-references).
- **Don't** stack bordered cards in a single narrow column; that previous look was rejected as characterless.
- **Don't** let feedback change an option's or cell's size.
- **Don't** add decoration, tracking or case changes to Arabic text.
- **Don't** add motion beyond the 0.12s state transitions, the 0.18s fade-in and the stamp landing.
