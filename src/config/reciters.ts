// Verified with `npm run data:verify-audio` (HEAD 001001.mp3 on everyayah.com).
export const RECITERS = [
  { id: "Alafasy_128kbps", name: "Mishary Rashid Alafasy" },
  { id: "Husary_128kbps", name: "Mahmoud Khalil Al-Husary" },
  { id: "Abdul_Basit_Murattal_192kbps", name: "Abdul Basit (Murattal)" },
  { id: "Minshawy_Murattal_128kbps", name: "Mohamed Siddiq Al-Minshawi (Murattal)" },
] as const;

export type ReciterId = (typeof RECITERS)[number]["id"];
export const DEFAULT_RECITER: ReciterId = "Alafasy_128kbps";

export const audioUrl = (reciter: ReciterId, s: number, a: number) =>
  `https://everyayah.com/data/${reciter}/${String(s).padStart(3, "0")}${String(a).padStart(3, "0")}.mp3`;

/** Inverse of `audioUrl`; null for anything else. */
export function parseAudioUrl(url: string): { reciter: ReciterId; s: number; a: number } | null {
  const m = /^https:\/\/everyayah\.com\/data\/([^/]+)\/(\d{3})(\d{3})\.mp3$/.exec(url);
  const reciter = RECITERS.find((r) => r.id === m?.[1])?.id;
  return m && reciter ? { reciter, s: Number(m[2]), a: Number(m[3]) } : null;
}
