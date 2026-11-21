import { afterEach, describe, expect, it, vi } from "vitest";
import { audioUrl, parseAudioUrl } from "../../src/config/reciters";
import {
  AUDIO_CACHE,
  createWebAudioStore,
  downloadAudio,
  downloadRefs,
} from "../../src/lib/audioCache";

// Minimal in-memory CacheStorage: enough for match/put/delete.
function fakeCaches() {
  const stores = new Map<string, Map<string, unknown>>();
  const cs = {
    open: async (name: string) => {
      const m = stores.get(name) ?? new Map();
      stores.set(name, m);
      return {
        match: async (u: string) => m.get(u),
        put: async (u: string, r: unknown) => void m.set(u, r),
      };
    },
    match: async (url: string, { cacheName }: CacheQueryOptions & { cacheName: string }) =>
      stores.get(cacheName)?.get(url),
    delete: async (name: string) => stores.delete(name),
  };
  return { cs: cs as unknown as CacheStorage, stores };
}

const refs = [
  { s: 1, a: 1 },
  { s: 1, a: 2 },
  { s: 2, a: 1 },
];
const ok = (async () => ({ ok: true })) as unknown as typeof fetch;

describe("web AudioStore", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("downloads, counts, skips stored, clears", async () => {
    const { cs, stores } = fakeCaches();
    let calls = 0;
    const store = createWebAudioStore(
      () => cs,
      (async () => (calls++, { ok: true })) as unknown as typeof fetch,
    );
    const prog: number[] = [];
    expect(await store.count("Alafasy_128kbps", refs)).toBe(0);
    expect(await store.download("Alafasy_128kbps", refs, (d) => prog.push(d))).toEqual({
      saved: 3,
      failed: [],
    });
    expect(prog.sort()).toEqual([1, 2, 3]);
    expect(await store.count("Alafasy_128kbps", refs)).toBe(3);
    expect(await store.download("Alafasy_128kbps", refs, () => {})).toEqual({
      saved: 3,
      failed: [],
    });
    expect(calls).toBe(3);
    await store.clear();
    expect(stores.has(AUDIO_CACHE)).toBe(false);
    expect(await store.count("Alafasy_128kbps", refs)).toBe(0);
  });

  it("does not store failed responses or network errors", async () => {
    const { cs } = fakeCaches();
    let n = 0;
    const flaky = (async () => {
      if (n++ === 0) throw new Error("offline");
      return { ok: n !== 2 };
    }) as unknown as typeof fetch;
    const store = createWebAudioStore(() => cs, flaky);
    const progress = vi.fn();
    const result = await store.download("Alafasy_128kbps", refs, progress);
    expect(result).toEqual({ saved: 1, failed: [refs[0], refs[1]] });
    expect(progress.mock.calls.every(([saved]) => saved <= 1)).toBe(true);
    expect(await store.count("Alafasy_128kbps", refs)).toBe(1);
    const retry = createWebAudioStore(() => cs, ok);
    expect(await retry.download("Alafasy_128kbps", result.failed, () => {})).toEqual({
      saved: 2,
      failed: [],
    });
  });

  it("stops when aborted", async () => {
    const { cs } = fakeCaches();
    const ac = new AbortController();
    ac.abort();
    const store = createWebAudioStore(() => cs, ok);
    expect(await store.download("Alafasy_128kbps", refs, () => {}, ac.signal)).toEqual({
      saved: 0,
      failed: [],
    });
  });

  it("aborts in-flight fetches and does not start queued files", async () => {
    const { cs } = fakeCaches();
    const ac = new AbortController();
    const fetcher = vi.fn(
      (_url, options) =>
        new Promise<Response>((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    const store = createWebAudioStore(() => cs, fetcher);
    const pending = store.download(
      "Alafasy_128kbps",
      [...refs, { s: 2, a: 2 }],
      () => {},
      ac.signal,
    );
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3));
    ac.abort();
    expect(await pending).toEqual({ saved: 0, failed: [] });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(await store.count("Alafasy_128kbps", refs)).toBe(0);
  });

  it("handles an empty selection", async () => {
    const save = vi.fn();
    expect(await downloadRefs([], save, () => {})).toEqual({ saved: 0, failed: [] });
    expect(save).not.toHaveBeenCalled();
  });

  it.each([false, true])("cleans up on storage errors (aborted=%s)", async (aborted) => {
    const ac = new AbortController();
    if (aborted) ac.abort();
    vi.stubGlobal("caches", {
      open: async () => {
        throw new Error("storage unavailable");
      },
    });
    const result = vi.fn();
    const cleanup = vi.fn();
    await downloadAudio("Alafasy_128kbps", refs, () => {}, ac.signal, result, cleanup);
    expect(result).toHaveBeenCalledWith({ saved: 0, failed: aborted ? [] : refs });
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("is unsupported without CacheStorage", () => {
    expect(createWebAudioStore(() => undefined).supported()).toBe(false);
  });

  it("resolves only a saved URL the current service worker can serve", async () => {
    const { cs } = fakeCaches();
    const store = createWebAudioStore(() => cs, ok);
    const reciter = "Alafasy_128kbps";
    const url = audioUrl(reciter, 1, 1);
    vi.stubGlobal("navigator", { serviceWorker: { controller: {} } });
    await (await cs.open("other-cache")).put(url, new Response());
    expect(await store.resolve(reciter, 1, 1)).toBeNull();
    await store.download(reciter, [refs[0]!], () => {});
    expect(await store.resolve(reciter, 1, 1)).toBe(url);
    expect(await store.resolve("Husary_128kbps", 1, 1)).toBeNull();
    vi.stubGlobal("navigator", { serviceWorker: { controller: null } });
    expect(await store.resolve(reciter, 1, 1)).toBeNull();
  });
});

describe("parseAudioUrl", () => {
  it("inverts audioUrl and rejects anything else", () => {
    expect(parseAudioUrl(audioUrl("Husary_128kbps", 83, 15))).toEqual({
      reciter: "Husary_128kbps",
      s: 83,
      a: 15,
    });
    expect(parseAudioUrl("https://evil.example/data/Husary_128kbps/083015.mp3")).toBeNull();
    expect(parseAudioUrl("https://everyayah.com/data/Unknown/083015.mp3")).toBeNull();
  });
});
