import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { DAILY_CAP, handleStats, type D1Like, type StatsEnv } from "../../src/lib/stats/server";

/** Real SQLite behind the tiny D1 surface, with the production migration applied. */
function makeDb(): D1Like {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync("migrations/0001_stats.sql", "utf8"));
  return {
    prepare: (sql) => ({
      bind: (...v) => ({
        run: async () => db.prepare(sql).run(...(v as never[])),
        first: async <T>() => (db.prepare(sql).get(...(v as never[])) as T | undefined) ?? null,
      }),
    }),
  };
}

const NOW = new Date("2026-11-06T10:00:00Z");
const post = (mode: unknown, headers: Record<string, string> = {}) =>
  new Request("https://sambungayat.com/api/stats", {
    method: "POST",
    headers: { origin: "https://sambungayat.com", "cf-connecting-ip": "1.2.3.4", ...headers },
    body: JSON.stringify({ mode }),
  });
const get = () => new Request("https://sambungayat.com/api/stats");

let env: StatsEnv;
beforeEach(() => {
  env = { DB: makeDb(), STATS_SALT: "test-salt" };
});

describe("stats handler", () => {
  it("starts at zero and counts completions", async () => {
    expect(await (await handleStats(get(), env, NOW)).json()).toEqual({ total: 0, week: 0 });
    expect((await handleStats(post("sambung"), env, NOW)).status).toBe(200);
    expect((await handleStats(post("tebak-juz"), env, NOW)).status).toBe(200);
    expect(await (await handleStats(get(), env, NOW)).json()).toEqual({ total: 2, week: 2 });
  });

  it("week window covers 7 days including today", async () => {
    await handleStats(post("sambung"), env, new Date("2026-10-30T10:00:00Z")); // 7 days before: outside
    await handleStats(post("sambung"), env, new Date("2026-10-31T10:00:00Z")); // 6 days before: inside
    const r = await (await handleStats(get(), env, NOW)).json();
    expect(r).toEqual({ total: 2, week: 1 });
  });

  it("rejects unknown origin, bad mode, bad body, other methods", async () => {
    expect(
      (await handleStats(post("sambung", { origin: "https://evil.example" }), env, NOW)).status,
    ).toBe(403);
    expect((await handleStats(post("not-a-mode"), env, NOW)).status).toBe(400);
    const bad = new Request("https://sambungayat.com/api/stats", {
      method: "POST",
      headers: { origin: "https://sambungayat.com" },
      body: "not json",
    });
    expect((await handleStats(bad, env, NOW)).status).toBe(400);
    const del = new Request("https://sambungayat.com/api/stats", { method: "DELETE" });
    expect((await handleStats(del, env, NOW)).status).toBe(405);
    expect(await (await handleStats(get(), env, NOW)).json()).toEqual({ total: 0, week: 0 });
  });

  it("counts nothing when the salt secret is missing", async () => {
    const res = await handleStats(post("sambung"), { DB: env.DB }, NOW);
    expect(res.status).toBe(503);
    expect(await (await handleStats(get(), env, NOW)).json()).toEqual({ total: 0, week: 0 });
  });

  it("caps one client per day, but another client still counts", async () => {
    for (let i = 0; i < DAILY_CAP; i++) await handleStats(post("sambung"), env, NOW);
    expect((await handleStats(post("sambung"), env, NOW)).status).toBe(429);
    expect(
      (await handleStats(post("sambung", { "cf-connecting-ip": "9.9.9.9" }), env, NOW)).status,
    ).toBe(200);
    expect(await (await handleStats(get(), env, NOW)).json()).toEqual({
      total: DAILY_CAP + 1,
      week: DAILY_CAP + 1,
    });
  });

  it("stores no raw IP and drops older hashes", async () => {
    await handleStats(post("sambung"), env, new Date("2026-11-05T10:00:00Z"));
    await handleStats(post("sambung"), env, NOW);
    const old = await env.DB.prepare("SELECT COUNT(*) AS v FROM rl WHERE day < ?")
      .bind("2026-11-06")
      .first<{ v: number }>();
    expect(old?.v).toBe(0);
    const any = await env.DB.prepare("SELECT h FROM rl LIMIT 1").bind().first<{ h: string }>();
    expect(any?.h).toMatch(/^[0-9a-f]{16}$/);
    expect(any?.h).not.toContain("1.2.3.4");
  });
});
