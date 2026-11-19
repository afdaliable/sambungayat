import { describe, expect, it } from "vitest";
import { toAppPath } from "../../src/lib/native/links";
import { generateQuiz } from "../../src/lib/quiz/engine";
import { decodeConfig } from "../../src/lib/quiz/url";
import { loadAll } from "./helpers";

const Q = "?mode=sambung&scope=juz:30&n=5&d=mudah&seed=t1";

describe("toAppPath (A2)", () => {
  it("maps pages to the bundled .html file and keeps query and hash", () => {
    expect(toAppPath(`https://sambungayat.com/kuis${Q}`)).toBe(`/kuis.html${Q}`);
    expect(toAppPath("https://www.sambungayat.com/harian")).toBe("/harian.html");
    expect(toAppPath("https://sambungayat.com/surah/an-naba")).toBe("/surah/an-naba.html");
    expect(toAppPath("https://sambungayat.com/juz/30#x")).toBe("/juz/30.html#x");
    expect(toAppPath("https://sambungayat.com/rekap/")).toBe("/rekap.html");
    expect(toAppPath("https://sambungayat.com/privasi")).toBe("/privasi.html");
  });

  it("handles language prefixes", () => {
    expect(toAppPath(`https://sambungayat.com/en/kuis${Q}`)).toBe(`/en/kuis.html${Q}`);
    expect(toAppPath("https://sambungayat.com/ar")).toBe("/ar.html");
    expect(toAppPath("https://sambungayat.com/ur/surah/an-naba")).toBe("/ur/surah/an-naba.html");
  });

  it("opens home for the root and for unknown paths on our hosts", () => {
    expect(toAppPath("https://sambungayat.com/")).toBe("/");
    expect(toAppPath("https://sambungayat.com")).toBe("/");
    expect(toAppPath("https://sambungayat.com/nope")).toBe("/");
    expect(toAppPath("https://sambungayat.com/zz/kuis")).toBe("/");
    expect(toAppPath("https://sambungayat.com/juz/300")).toBe("/");
  });

  it("rejects other hosts, schemes, ports, credentials and junk", () => {
    for (const bad of [
      "https://evil.com/kuis",
      "https://sambungayat.com.evil.com/kuis",
      "http://sambungayat.com/kuis",
      "javascript:alert(1)",
      "https://sambungayat.com:8443/kuis",
      "https://user:pw@sambungayat.com/kuis",
      "not a url",
      "",
    ]) {
      expect(toAppPath(bad)).toBeNull();
    }
  });

  it("does not let path tricks escape the allow-list", () => {
    expect(toAppPath("https://sambungayat.com/kuis/../../x")).toBe("/"); // normalised to /x, unknown
    expect(toAppPath("https://sambungayat.com/surah/..%2Fx")).toBe("/");
  });
});

describe("link parity (A3)", () => {
  it("the app route keeps the exact query, so the same config and first question result", async () => {
    const web = `https://sambungayat.com/kuis${Q}`;
    const app = toAppPath(web)!;
    const q = (s: string) => new URL(s, "https://x").search;
    expect(q(app)).toBe(q(web));
    const data = await loadAll();
    const first = (s: string) => generateQuiz(decodeConfig(q(s)).config, data).questions[0]!.id;
    expect(first(app)).toBe(first(web));
  });
});
