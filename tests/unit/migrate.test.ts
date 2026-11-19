import { describe, expect, it } from "vitest";
import { migrateStorage, type Migration } from "../../src/lib/storage/migrate";

const fakeStore = (init: Record<string, string> = {}) => {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    map: m,
  } as unknown as Storage & { map: Map<string, string> };
};

const v1to2: Migration = {
  from: 1,
  to: 2,
  run: (s) => s.setItem("sa:v2:history", s.getItem("sa:v1:history") ?? "[]"),
};

describe("migrateStorage", () => {
  it("does nothing while v1 is the only shape", () => {
    const s = fakeStore({ "sa:v1:history": "[1]" });
    expect(migrateStorage(s)).toBe(1);
    expect([...s.map.keys()]).toEqual(["sa:v1:history"]);
  });

  it("runs a pending step once and keeps the old keys", () => {
    const s = fakeStore({ "sa:v1:history": "[1]" });
    expect(migrateStorage(s, [v1to2], 2)).toBe(2);
    expect(s.map.get("sa:v2:history")).toBe("[1]");
    expect(s.map.get("sa:v1:history")).toBe("[1]");
    s.map.set("sa:v1:history", "[1,2]");
    expect(migrateStorage(s, [v1to2], 2)).toBe(2); // already at 2: no second run
    expect(s.map.get("sa:v2:history")).toBe("[1]");
  });

  it("chains steps and stops at the target", () => {
    const v2to3: Migration = { from: 2, to: 3, run: (s) => s.setItem("sa:v3:x", "1") };
    const s = fakeStore();
    expect(migrateStorage(s, [v1to2, v2to3], 2)).toBe(2);
    expect(s.map.has("sa:v3:x")).toBe(false);
    expect(migrateStorage(s, [v1to2, v2to3], 3)).toBe(3);
    expect(s.map.has("sa:v3:x")).toBe(true);
  });
});
