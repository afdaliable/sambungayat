import { beforeEach, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  vi.stubGlobal("window", {});
});

it("does not mark SSR or Node reads as temporary storage", async () => {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("localStorage", undefined);
  const s = await import("../../src/lib/storage");
  expect(s.readJson("history", [])).toEqual([]);
  s.checkStorage();
  expect(s.isTemporaryStorage()).toBe(false);
});

it("does not retain reads from healthy storage after it becomes unavailable", async () => {
  vi.stubGlobal("localStorage", { getItem: () => "[1]" });
  const s = await import("../../src/lib/storage");
  expect(s.readJson("history", [])).toEqual([1]);
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw new Error("unavailable");
    },
  });
  expect(s.readJson("history", [])).toEqual([]);
  expect(s.isTemporaryStorage()).toBe(true);
});

it("detects unavailable storage and notifies subscribers", async () => {
  vi.stubGlobal("localStorage", undefined);
  const s = await import("../../src/lib/storage");
  const listener = vi.fn();
  const unsubscribe = s.subscribeStorage(listener);
  s.checkStorage();
  expect(s.isTemporaryStorage()).toBe(true);
  expect(listener).toHaveBeenCalledOnce();
  unsubscribe();
});

it("keeps the latest write after quota errors instead of reading stale persisted data", async () => {
  vi.stubGlobal("localStorage", {
    getItem: () => "[]",
    setItem: () => {
      throw new Error("quota");
    },
  });
  const s = await import("../../src/lib/storage");
  const listener = vi.fn();
  s.subscribeStorage(listener);
  expect(s.isTemporaryStorage()).toBe(false);
  s.writeJson("history", [1]);
  expect(s.isTemporaryStorage()).toBe(true);
  expect(listener).toHaveBeenCalledOnce();
  expect(s.readJson("history", [])).toEqual([1]);
});

it("round trips all progress in memory, including an empty backup", async () => {
  vi.stubGlobal("localStorage", undefined);
  const s = await import("../../src/lib/storage");
  const b = await import("../../src/lib/storage/backup");
  const empty = b.exportBackup();
  b.importBackup(empty);
  expect(b.exportBackup()).toBe(empty);
  s.writeJson("history", [
    {
      date: "2026-01-01T12:00:00Z",
      score: 4,
      total: 5,
      wrong: [{ s: 1, a: 2 }],
      config: {
        mode: "sambung",
        scope: { kind: "surah", surah: [1] },
        count: 5,
        difficulty: "mudah",
        seed: "test",
      },
    },
  ]);
  s.writeJson("mastery", { sambung: { 1: { attempts: 5, correct: 4, lastPlayed: "2026-01-01" } } });
  s.writeJson("daily", { "2026-01-01": { score: 4, total: 5, attempts: 1 } });
  const backup = b.exportBackup();
  b.importBackup(empty);
  b.importBackup(backup);
  expect(b.exportBackup()).toBe(backup);
});

it("rejects invalid backups without changing progress", async () => {
  vi.stubGlobal("localStorage", undefined);
  const b = await import("../../src/lib/storage/backup");
  const original = b.exportBackup();
  for (const raw of [
    "no json",
    "null",
    "{}",
    original.replace('"version": 1', '"version": 2'),
    original.replace('"history": []', '"history": [{}]'),
    original.replace('"mastery": {}', '"mastery": {"__proto__": {}}'),
    original.replace('"daily": {}', '"daily": {"bad": {}}'),
  ]) {
    expect(() => b.importBackup(raw)).toThrow();
    expect(b.exportBackup()).toBe(original);
  }
});
