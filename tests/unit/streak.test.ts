import { describe, expect, it } from "vitest";
import { computeStreak } from "../../src/lib/streak";

describe("computeStreak", () => {
  it("empty", () => expect(computeStreak([], "2026-11-21")).toEqual({ current: 0, best: 0 }));
  it("counts back from today across a month edge", () =>
    expect(computeStreak(["2026-10-31", "2026-11-01", "2026-11-02"], "2026-11-02")).toEqual({
      current: 3,
      best: 3,
    }));
  it("stays alive if only yesterday was played", () =>
    expect(computeStreak(["2026-11-19", "2026-11-20"], "2026-11-21").current).toBe(2));
  it("resets after a missed day, keeps best", () =>
    expect(
      computeStreak(["2026-11-10", "2026-11-11", "2026-11-12", "2026-11-20"], "2026-11-21"),
    ).toEqual({
      current: 1,
      best: 3,
    }));
  it("two days idle = 0", () =>
    expect(computeStreak(["2026-11-18"], "2026-11-21").current).toBe(0));
});
