import type { Scope } from "../quiz/types";
import { neededSurahs } from "./scope";
import type { JuzMeta, SurahFile, SurahMeta } from "./types";

export type QuranData = {
  index: SurahMeta[];
  juz: JuzMeta[];
  ambiguous: Set<number>;
  surahs: Map<number, SurahFile>;
};

export type FetchJson = (path: string) => Promise<unknown>;

const pad = (n: number) => String(n).padStart(3, "0");

/** Loader with in-memory cache. `fetchJson` receives paths relative to the data root. */
export function createLoader(fetchJson: FetchJson) {
  const cache = new Map<string, Promise<unknown>>();
  const get = <T>(path: string) => {
    let p = cache.get(path);
    if (!p) {
      p = fetchJson(path);
      cache.set(path, p);
      p.catch(() => cache.delete(path)); // allow retry after failure
    }
    return p as Promise<T>;
  };

  const loadMeta = async () => {
    const [index, juz] = await Promise.all([
      get<SurahMeta[]>("index.json"),
      get<JuzMeta[]>("juz.json"),
    ]);
    return { index, juz };
  };

  return {
    loadMeta,
    /** Loads metadata plus every surah file the scope may need. */
    async load(scope: Scope): Promise<QuranData> {
      const [index, juz, amb] = await Promise.all([
        get<SurahMeta[]>("index.json"),
        get<JuzMeta[]>("juz.json"),
        get<number[]>("ambiguous.json"),
      ]);
      const wanted = neededSurahs(scope, juz);
      const files = await Promise.all(wanted.map((n) => get<SurahFile>(`surah/${pad(n)}.json`)));
      return { index, juz, ambiguous: new Set(amb), surahs: new Map(files.map((f) => [f.n, f])) };
    },
  };
}

export const DATA_ROOT = "/data/v1/";

export const browserLoader = createLoader(async (path) => {
  const res = await fetch(DATA_ROOT + path);
  if (!res.ok) throw new Error(`failed to load ${path}: ${res.status}`);
  return res.json();
});
