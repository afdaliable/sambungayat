import { MODES } from "../../config/site";

/** Minimal D1 surface used here, so the handler can be tested against any SQLite. */
export interface D1Like {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
      first<T>(): Promise<T | null>;
    };
  };
}

export interface StatsEnv {
  DB: D1Like;
  /** Secret used to salt the per-day IP hash. Without it nothing is counted. */
  STATS_SALT?: string;
}

/** Max counted completions per client per day (a whole class may share one IP). */
export const DAILY_CAP = 300;

const ORIGINS = [
  /^https:\/\/(www\.)?sambungayat\.com$/,
  /^https:\/\/([a-z0-9-]+\.)?sambung-ayat-amf\.pages\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
];
const MODE_IDS: string[] = MODES.map((m) => m.id);

const HEADERS = {
  "content-type": "application/json",
  "x-content-type-options": "nosniff",
  "cache-control": "no-store",
};
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } });

const day = (d: Date) => d.toISOString().slice(0, 10);

async function hashClient(ip: string, d: string, salt: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}|${d}|${ip}`));
  return [...new Uint8Array(buf).slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function handleStats(
  req: Request,
  env: StatsEnv,
  now: Date = new Date(),
): Promise<Response> {
  const today = day(now);

  if (req.method === "GET") {
    const since = day(new Date(now.getTime() - 6 * 86_400_000));
    const total = await env.DB.prepare("SELECT COALESCE(SUM(n), 0) AS v FROM stats")
      .bind()
      .first<{ v: number }>();
    const week = await env.DB.prepare("SELECT COALESCE(SUM(n), 0) AS v FROM stats WHERE day >= ?")
      .bind(since)
      .first<{ v: number }>();
    return json({ total: total?.v ?? 0, week: week?.v ?? 0 }, 200, {
      "cache-control": "public, max-age=60",
    });
  }

  if (req.method !== "POST") return json({ error: "method" }, 405, { allow: "GET, POST" });

  const origin = req.headers.get("origin") ?? "";
  if (!ORIGINS.some((re) => re.test(origin))) return json({ error: "origin" }, 403);
  if (!env.STATS_SALT) return json({ error: "disabled" }, 503);

  const body = (await req.json().catch(() => null)) as { mode?: unknown } | null;
  if (!body) return json({ error: "body" }, 400);
  const mode = String(body.mode ?? "");
  if (!MODE_IDS.includes(mode)) return json({ error: "mode" }, 400);

  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  const h = await hashClient(ip, today, env.STATS_SALT);
  const hit = await env.DB.prepare(
    "INSERT INTO rl (day, h, n) VALUES (?, ?, 1) ON CONFLICT (day, h) DO UPDATE SET n = n + 1 RETURNING n",
  )
    .bind(today, h)
    .first<{ n: number }>();
  if (hit && hit.n === 1) {
    // First hit of this client today: drop yesterday's and older hashes.
    await env.DB.prepare("DELETE FROM rl WHERE day < ?").bind(today).run();
  }
  if (!hit || hit.n > DAILY_CAP) return json({ ok: false }, 429);

  await env.DB.prepare(
    "INSERT INTO stats (day, mode, n) VALUES (?, ?, 1) ON CONFLICT (day, mode) DO UPDATE SET n = n + 1",
  )
    .bind(today, mode)
    .run();
  return json({ ok: true });
}
