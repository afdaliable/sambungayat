import { describe, expect, it } from "vitest";
import { audioUrl, parseAudioUrl } from "../../src/config/reciters";
import { AUDIO_CACHE, createWebAudioStore } from "../../src/lib/audioCache";

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
  it("downloads, counts, skips stored, clears", async () => {
    const { cs, stores } = fakeCaches();
    let calls = 0;
    const store = createWebAudioStore(
      () => cs,
      (async () => (calls++, { ok: true })) as unknown as typeof fetch,
    );
    const prog: number[] = [];
    expect(await store.count("Alafasy_128kbps", refs)).toBe(0);
    expect(await store.download("Alafasy_128kbps", refs, (d) => prog.push(d))).toBe(3);
    expect(prog.sort()).toEqual([1, 2, 3]);
    expect(await store.count("Alafasy_128kbps", refs)).toBe(3);
    expect(await store.download("Alafasy_128kbps", refs, () => {})).toBe(0);
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
    expect(await store.download("Alafasy_128kbps", refs, () => {})).toBe(1);
    expect(await store.count("Alafasy_128kbps", refs)).toBe(1);
  });

  it("stops when aborted", async () => {
    const { cs } = fakeCaches();
    const ac = new AbortController();
    ac.abort();
    const store = createWebAudioStore(() => cs, ok);
    expect(await store.download("Alafasy_128kbps", refs, () => {}, ac.signal)).toBe(0);
  });

  it("is unsupported without CacheStorage", () => {
    expect(createWebAudioStore(() => undefined).supported()).toBe(false);
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
