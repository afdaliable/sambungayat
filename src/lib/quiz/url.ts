import { scopeKey } from "../quran/scope";
import type { Difficulty, QuizConfig, QuizMode, Scope } from "./types";

const MODES: readonly QuizMode[] = [
  "sambung",
  "tebak-surah",
  "lengkapi",
  "tebak-audio",
  "tebak-juz",
  "sebelum",
];
const COUNTS = [5, 10, 20] as const;
const DIFFS: readonly Difficulty[] = ["mudah", "sulit"];
const SEED_RE = /^[a-z0-9-]{1,40}$/;

export const DEFAULT_CONFIG: QuizConfig = {
  mode: "sambung",
  scope: { kind: "juz", juz: [30] },
  count: 10,
  difficulty: "mudah",
  seed: "",
};

const ints = (s: string, min: number, max: number): number[] | null => {
  const parts = s.split(",");
  const nums = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
  return nums.length > 0 && nums.every((n) => n >= min && n <= max) ? [...new Set(nums)] : null;
};

export function parseScope(raw: string | null): Scope | null {
  if (!raw) return null;
  const sep = raw.indexOf(":");
  const kind = sep < 0 ? raw : raw.slice(0, sep);
  const val = sep < 0 ? "" : raw.slice(sep + 1);
  if (kind === "juz") {
    const juz = ints(val, 1, 30);
    return juz ? { kind: "juz", juz } : null;
  }
  if (kind === "surah") {
    const surah = ints(val, 1, 114);
    return surah ? { kind: "surah", surah } : null;
  }
  if (kind === "range") {
    const m = /^(\d{1,3})-(\d{1,3})$/.exec(val);
    const from = Number(m?.[1]);
    const to = Number(m?.[2]);
    return m && from >= 1 && to <= 114 && from <= to ? { kind: "range", from, to } : null;
  }
  if (kind === "ayat") {
    const m = /^(\d{1,3}):(\d{1,3})-(\d{1,3})$/.exec(val);
    const [surah, from, to] = [Number(m?.[1]), Number(m?.[2]), Number(m?.[3])];
    return m && surah >= 1 && surah <= 114 && from >= 1 && from <= to && to <= 286
      ? { kind: "ayat", surah, from, to }
      : null;
  }
  return null;
}

export function encodeConfig(c: QuizConfig): string {
  const p = new URLSearchParams({
    mode: c.mode,
    scope: scopeKey(c.scope),
    n: String(c.count),
    d: c.difficulty,
  });
  if (c.seed) p.set("seed", c.seed);
  // keep ':' and ',' readable (spec format, shorter QR codes); decoding accepts both forms
  return p.toString().replaceAll("%3A", ":").replaceAll("%2C", ",");
}

/** Never throws. Invalid or missing fields fall back to defaults; `complete` needs every field valid incl. seed. */
export function decodeConfig(search: string | URLSearchParams): {
  config: QuizConfig;
  complete: boolean;
  fieldsValid: boolean;
} {
  const p = typeof search === "string" ? new URLSearchParams(search) : search;
  const mode = MODES.find((m) => m === p.get("mode"));
  const scope = parseScope(p.get("scope"));
  const count = COUNTS.find((n) => String(n) === p.get("n"));
  const difficulty = DIFFS.find((d) => d === p.get("d"));
  const seedRaw = p.get("seed") ?? "";
  const seed = SEED_RE.test(seedRaw) ? seedRaw : "";
  return {
    config: {
      mode: mode ?? DEFAULT_CONFIG.mode,
      scope: scope ?? DEFAULT_CONFIG.scope,
      count: count ?? DEFAULT_CONFIG.count,
      difficulty: difficulty ?? DEFAULT_CONFIG.difficulty,
      seed,
    },
    complete: !!(mode && scope && count && difficulty && seed),
    // every field except the seed is valid: enough to start a fresh quiz (e.g. the home page CTA)
    fieldsValid: !!(mode && scope && count && difficulty),
  };
}
