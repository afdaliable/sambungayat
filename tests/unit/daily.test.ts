import { describe, expect, it } from "vitest";
import { dailyShareText, formatCountdown, msUntilNextDaily } from "../../src/lib/quiz/daily";

describe("daily helpers", () => {
  it("counts down to Jakarta midnight", () => {
    // 16:30 UTC = 23:30 Jakarta -> 30 minutes left
    expect(msUntilNextDaily(new Date("2026-12-31T16:30:00Z"))).toBe(30 * 60_000);
    // exactly midnight Jakarta -> a full day
    expect(msUntilNextDaily(new Date("2026-12-31T17:00:00Z"))).toBe(24 * 3600_000);
  });
  it("formats HH:MM:SS", () => {
    expect(formatCountdown(3_723_000)).toBe("01:02:03");
    expect(formatCountdown(-5)).toBe("00:00:00");
  });
  it("builds the share text from the spec", () => {
    const t = dailyShareText("2026-11-01", 8, 10);
    expect(t.startsWith("Tantangan Harian Sambung Ayat 2026-11-01: 8/10 ")).toBe(true);
    expect(t.endsWith(" sambungayat.com/harian")).toBe(true);
  });
});
