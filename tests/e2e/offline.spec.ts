import { expect, test } from "@playwright/test";
import { answerAll } from "./helpers";

test("after first visit the Juz 30 quiz works offline", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Reload so the page is controlled by the SW, then open the quiz once online to warm the cache.
  await page.reload();
  await page.getByRole("button", { name: "Mulai kuis" }).click();
  await expect(page.getByRole("region", { name: "Soal" })).toBeVisible();

  await context.setOffline(true);
  await page.goto("/kuis?mode=sambung&scope=juz:30&n=10&d=mudah&seed=off1");
  await expect(page.getByRole("region", { name: "Soal" })).toBeVisible();
  await answerAll(page, 10);
  await expect(page.getByLabel(/^Skor \d+ dari 10$/)).toBeVisible();
});
