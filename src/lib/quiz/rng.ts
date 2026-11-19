// Deterministic PRNG: string seed -> xmur3 hash -> mulberry32.

export type Rng = {
  next(): number;
  /** Integer in [0, n). */
  int(n: number): number;
  /** New shuffled copy (Fisher-Yates). */
  shuffle<T>(items: readonly T[]): T[];
};

export function hashString(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function createRng(seed: string): Rng {
  let state = hashString(seed);
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (n: number) => Math.floor(next() * n);
  const shuffle = <T>(items: readonly T[]): T[] => {
    const a = items.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = int(i + 1);
      [a[i], a[j]] = [a[j] as T, a[i] as T];
    }
    return a;
  };
  return { next, int, shuffle };
}

/** Short random base36 seed for non-deterministic quizzes. */
export function newSeed(): string {
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => n.toString(36))
    .join("")
    .slice(0, 8);
}
