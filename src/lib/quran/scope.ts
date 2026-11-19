import type { Scope } from "../quiz/types";
import type { JuzMeta } from "./types";

export function scopeKey(scope: Scope): string {
  switch (scope.kind) {
    case "juz":
      return `juz:${scope.juz.join(",")}`;
    case "surah":
      return `surah:${scope.surah.join(",")}`;
    case "range":
      return `range:${scope.from}-${scope.to}`;
    case "ayat":
      return `ayat:${scope.surah}:${scope.from}-${scope.to}`;
  }
}

/** Surah numbers (ascending) covered by the scope. */
export function scopeSurahs(scope: Scope, juz: readonly JuzMeta[]): number[] {
  let list: number[];
  if (scope.kind === "juz") {
    list = juz.filter((j) => scope.juz.includes(j.juz)).flatMap((j) => j.surahs);
  } else if (scope.kind === "surah") {
    list = scope.surah;
  } else if (scope.kind === "ayat") {
    list = [scope.surah];
  } else {
    list = Array.from({ length: scope.to - scope.from + 1 }, (_, i) => scope.from + i);
  }
  return [...new Set(list)].sort((a, b) => a - b);
}

/** Scope surahs plus their immediate neighbours (used as fallback distractor source). */
export function neededSurahs(scope: Scope, juz: readonly JuzMeta[]): number[] {
  const set = new Set<number>();
  for (const n of scopeSurahs(scope, juz)) {
    for (const m of [n - 1, n, n + 1]) if (m >= 1 && m <= 114) set.add(m);
  }
  return [...set].sort((a, b) => a - b);
}

/** Juz scopes filter by ayah juz, ayat scopes by ayah number; other scopes cover whole surahs. */
export function ayahInScope(
  scope: Scope,
  surahSet: ReadonlySet<number>,
  s: number,
  ayahNo: number,
  ayahJuz: number,
): boolean {
  if (scope.kind === "juz") return scope.juz.includes(ayahJuz);
  if (scope.kind === "ayat") return s === scope.surah && ayahNo >= scope.from && ayahNo <= scope.to;
  return surahSet.has(s);
}
