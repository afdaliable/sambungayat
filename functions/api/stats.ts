import { handleStats, type StatsEnv } from "../../src/lib/stats/server";

export const onRequest = (ctx: { request: Request; env: StatsEnv }) =>
  handleStats(ctx.request, ctx.env);
