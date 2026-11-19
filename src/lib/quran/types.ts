export type SurahMeta = {
  n: number;
  slug: string;
  nameAr: string;
  nameLatin: string;
  meaningId?: string;
  revelation: "Makkiyah" | "Madaniyah";
  ayahCount: number;
  juz: number[];
  /** Show Basmalah as a header above ayah 1 (false for surah 9; surah 1 has it as ayah 1). */
  hasBasmalah: boolean;
};

export type JuzMeta = {
  juz: number;
  start: { s: number; a: number };
  end: { s: number; a: number };
  surahs: number[];
};

export type Ayah = {
  a: number;
  g: number;
  juz: number;
  page: number;
  ar: string;
  arNorm: string;
  words: string[];
  id: string;
};

export type SurahFile = { n: number; slug: string; nameLatin: string; ayahs: Ayah[] };
