import { BOM } from "./normalize";

// A token counts as a word only if it contains a base Arabic letter (0621-064A, 0671).
export const HAS_LETTER = new RegExp(
  `[${String.fromCharCode(0x621)}-${String.fromCharCode(0x64a)}${String.fromCharCode(0x671)}]`,
);

/** Split by whitespace; symbol-only tokens (waqf, ayah/sajdah signs) merge into the previous token. */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  let pendingPrefix = "";
  for (const raw of text.replaceAll(BOM, "").split(/\s+/)) {
    if (!raw) continue;
    if (HAS_LETTER.test(raw)) {
      out.push(pendingPrefix + raw);
      pendingPrefix = "";
    } else if (out.length > 0) {
      out[out.length - 1] += " " + raw;
    } else {
      pendingPrefix += raw + " "; // symbol before the first word: attach to the next word
    }
  }
  return out;
}
