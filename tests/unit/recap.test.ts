import { describe, expect, it } from "vitest";
import { parseRecap, recapTag } from "../../src/lib/recap";

describe("recap", () => {
  it("round-trips tags inside chat noise and keeps the best attempt", () => {
    const chat = [
      `[10:01, 1/11/2026] Budi: Hasilku ${recapTag("Budi", 6, 10, "ab12")}`,
      `[10:02] Siti: ${recapTag("Siti", 9, 10, "ab12")} alhamdulillah`,
      `[10:05] Budi: ${recapTag("Budi", 8, 10, "ab12")}`,
      "[10:06] Guru: bagus semua",
    ].join("\n");
    expect(parseRecap(chat)).toEqual([
      { name: "Siti", score: 9, total: 10, code: "ab12" },
      { name: "Budi", score: 8, total: 10, code: "ab12" },
    ]);
  });
  it("rejects impossible scores and sanitises names", () => {
    expect(parseRecap(recapTag("x", 11, 10, "c"))).toEqual([]);
    expect(recapTag("  ", 1, 2, "c")).toContain("Anonim");
  });
});
