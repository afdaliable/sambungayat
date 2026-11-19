# Translation review checklist

UI texts for every language except Indonesian (reference) were written by an AI assistant and have NOT been reviewed by native speakers. Quran translations are the AlQuran.cloud editions listed in `data/translations.json` (check each edition's licence before promoting the language).

| Lang | UI | Quran edition |
|---|---|---|
| en | draft | en.sahih (Saheeh International) |
| ms | draft | ms.basmeih |
| tr | draft | tr.diyanet |
| fr | draft | fr.hamidullah |
| es | draft | es.cortes |
| de | draft | de.bubenheim |
| ru | draft | ru.kuliev |
| bn | draft | bn.bengali |
| hi | draft | hi.hindi |
| ar | draft | ar.muyassar (Tafsir al-Muyassar, a simplified tafsir rather than a translation) |
| ur | draft | ur.jalandhry (Fateh Muhammad Jalandhry) |

## Points to check with a native speaker
- **ms**: "setor/setoran" in the guide is Indonesian usage, prefer a Malaysian equivalent; "Sejarah" for History (maybe "Rekod"); mode names ("Cabaran Harian", "Teka Surah", ...); "anda" register.
- **tr**: "tekrar (muraceaa)" for murajaah, "meal" for translation, mode names, "Kari"/"Tilavet"/"tecvid", spelling "Cakarta".
- **fr**: "Du jour" in the nav, "Recapitulatif", transliterations (muraja'a, 'uthmani), "vous" register.
- **es**: "aleya"/"yuz"/"tayuid" transliterations, "Cuestionario" is long in the nav, "Docente" vs "maestro".
- **de**: "Dschuz", "Tadschwid", long compound words on buttons at 360px.
- **ru**: "talaqqi" left in Latin script, informal imperative in mode names vs formal "vy" in text, transliterations of Masha'Allah / Alhamdulillah, "Locatsiya" phrasing for juz location.
- **bn / hi**: mode names, juz = পারা / पारा, murajaah wording, spelling of reciter/qari, long privacy paragraph.
- **all**: the daily reset time is written "WIB (Jakarta time)"; consider showing the local time.
- **ar**: the ayah label says "التفسير الميسر" (it is a tafsir, not a translation); mode names; plural forms for 1/2/3-10 ("طالبان", "طلاب"); "المعلّم", "طالب" for santri; "(WIB، توقيت جاكرتا)".
- **ur**: "دہرائی (مراجعہ)" for murajaah, "تلقّی", mode names, "تاریخ" for History, word order in "{total} میں سے {score}"; check long paragraphs at 360px (Nastaliq is tall; the CSS asks for Noto Nastaliq Urdu and falls back to Naskh).
- RTL: layout uses logical Tailwind classes; arrows flip with `rtl:-scale-x-100`; Arabic option names use `ltr:self-end rtl:self-start`. Check on a real device with Arabic/Urdu system fonts.
