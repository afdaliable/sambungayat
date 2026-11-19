// Normalization is for internal comparison only. Displayed text is never altered.
// Patterns are built from numeric code points so this file stays pure ASCII.

const ch = (...codes: number[]) => String.fromCharCode(...codes);
const cls = (body: string) => new RegExp(`[${body}]`, "g");

export const BOM = ch(0xfeff);

// Tatweel, harakat (064B-065F), dagger alif (0670), Quranic annotation signs (06D6-06ED).
const MARKS = cls(`${ch(0x640)}${ch(0x64b)}-${ch(0x65f)}${ch(0x670)}${ch(0x6d6)}-${ch(0x6ed)}`);
// alif with madda/hamza above/hamza below/wasla -> bare alif
const ALIF_VARIANTS = cls(ch(0x622, 0x623, 0x625, 0x671));
const ALIF = ch(0x627);
const ALIF_MAQSURA = new RegExp(ch(0x649), "g");
const YA = ch(0x64a);

export function normalizeArabic(text: string): string {
  return text
    .replaceAll(BOM, "")
    .replace(MARKS, "")
    .replace(ALIF_VARIANTS, ALIF)
    .replace(ALIF_MAQSURA, YA)
    .replace(/\s+/g, " ")
    .trim();
}
