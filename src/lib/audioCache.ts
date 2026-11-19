import { isNative } from "./native/platform";
import { audioUrl, type ReciterId } from "../config/reciters";
import { scopeSurahs } from "./quran/scope";
import type { JuzMeta, SurahMeta } from "./quran/types";
import type { Scope } from "./quiz/types";

/** Cache name must match the runtimeCaching entry in astro.config.mjs. */
export const AUDIO_CACHE = "sa-audio";

/** (surah, ayah) pairs of the scope. Juz scopes use the juz start/end; others cover whole surahs. */
export function scopeAyahRefs(
  scope: Scope,
  juz: readonly JuzMeta[],
  index: readonly SurahMeta[],
): { s: number; a: number }[] {
  const refs: { s: number; a: number }[] = [];
  const bounds =
    scope.kind === "juz"
      ? juz.filter((j) => scope.juz.includes(j.juz)).map((j) => [j.start, j.end] as const)
      : undefined;
  for (const s of scopeSurahs(scope, juz)) {
    const count = index[s - 1]?.ayahCount ?? 0;
    for (let a = 1; a <= count; a++) {
      const inside =
        !bounds ||
        bounds.some(
          ([st, en]) =>
            (s > st.s || (s === st.s && a >= st.a)) && (s < en.s || (s === en.s && a <= en.a)),
        );
      if (inside && (scope.kind !== "ayat" || (a >= scope.from && a <= scope.to)))
        refs.push({ s, a });
    }
  }
  return refs;
}

export type Ref = { s: number; a: number };

/** Offline audio storage. Web = Cache API (needs the service worker); a native store can implement the same. */
export interface AudioStore {
  supported(): boolean;
  /** How many of `refs` are stored for this reciter. */
  count(reciter: ReciterId, refs: Ref[]): Promise<number>;
  /** Stores full (non-Range) files, skipping ones already stored. Returns count newly stored. */
  download(
    reciter: ReciterId,
    refs: Ref[],
    onProgress: (done: number, total: number) => void,
    signal?: AbortSignal,
  ): Promise<number>;
  clear(): Promise<void>;
  /** Playable URL of a stored file, or null when it is not stored (play the remote URL then). */
  resolve(reciter: ReciterId, s: number, a: number): Promise<string | null>;
}

/** Cache API implementation; storage and fetch are injectable so tests can use fakes. */
export function createWebAudioStore(
  getCaches: () => CacheStorage | undefined = () =>
    typeof caches === "undefined" ? undefined : caches,
  doFetch: typeof fetch = (...a) => fetch(...a),
): AudioStore {
  const open = () => getCaches()!.open(AUDIO_CACHE);
  return {
    supported: () => !!getCaches() && "serviceWorker" in navigator && !isNative(),
    async count(reciter, refs) {
      const cache = await open();
      let n = 0;
      for (const r of refs) if (await cache.match(audioUrl(reciter, r.s, r.a))) n++;
      return n;
    },
    async download(reciter, refs, onProgress, signal) {
      const cache = await open();
      let done = 0;
      let stored = 0;
      const queue = [...refs];
      const worker = async () => {
        for (let r = queue.shift(); r && !signal?.aborted; r = queue.shift()) {
          const url = audioUrl(reciter, r.s, r.a);
          try {
            if (!(await cache.match(url))) {
              const res = await doFetch(url, { mode: "cors", signal });
              if (res.ok) {
                await cache.put(url, res);
                stored++;
              }
            }
          } catch {
            /* network error or abort: leave it out, counted as not stored */
          }
          onProgress(++done, refs.length);
        }
      };
      await Promise.all([worker(), worker(), worker()]);
      return stored;
    },
    async clear() {
      await getCaches()!.delete(AUDIO_CACHE);
    },
    // The service worker already serves stored files for the remote URL.
    resolve: async () => null,
  };
}

const web = createWebAudioStore();

/** Native (Filesystem) store inside the Android app, Cache API store in a browser. Native code loads lazily. */
export async function getAudioStore(): Promise<AudioStore> {
  return isNative() ? (await import("./native/audioStore")).nativeAudioStore : web;
}
