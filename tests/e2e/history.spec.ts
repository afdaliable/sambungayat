import { expect, test } from "@playwright/test";

test("practice links keep the mode the surah is weakest in", async ({ page }) => {
  const date = new Date().toISOString();
  await page.addInitScript((date) => {
    const config = {
      mode: "tebak-audio",
      scope: { kind: "surah", surah: [112] },
      count: 5,
      difficulty: "mudah",
      seed: "x",
    };
    localStorage.setItem(
      "sa:v1:history",
      JSON.stringify([{ date, config, score: 1, total: 5, wrong: [] }]),
    );
    localStorage.setItem(
      "sa:v1:mastery",
      JSON.stringify({
        sambung: {
          112: { attempts: 5, correct: 5, lastPlayed: date },
          113: { attempts: 5, correct: 4, lastPlayed: date },
        },
        "tebak-audio": { 112: { attempts: 5, correct: 1, lastPlayed: date } },
      }),
    );
  }, date);
  await page.goto("/riwayat");
  const weakest = page.getByRole("link", { name: /Latih yang paling perlu diulang/ });
  await expect(weakest).toHaveAttribute("href", /\?mode=tebak-audio&scope=surah:112&/);
  await expect(weakest).toContainText("Tebak Ayat dari Audio");
  const practice = page.getByRole("link", { name: "Latih", exact: true });
  await expect(practice.nth(0)).toHaveAttribute("href", /\?mode=tebak-audio&scope=surah:112&/);
  await expect(practice.nth(1)).toHaveAttribute("href", /\?mode=sambung&scope=surah:113&/);
});
