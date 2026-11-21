import { expect, test } from "@playwright/test";

test("uncached offline audio can be retried or skipped without counting toward the score", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.goto("/kuis?mode=tebak-audio&scope=ayat:114:1-1&n=5&d=mudah&seed=skip-audio");

  const question = page.getByRole("region", { name: "Soal" });
  const skip = question.getByRole("button", { name: "Lewati soal" });
  const retry = question.getByRole("button", { name: "Coba lagi" });
  await expect(question.getByText(/^Audio tidak bisa dimuat/)).toBeVisible();
  await expect(skip).toBeVisible();
  await retry.click();
  await expect(skip).toBeVisible();
  await expect(question.getByRole("group", { name: "Pilihan jawaban" })).toHaveCount(0);

  const result = question.getByRole("button", { name: "Lihat hasil" });
  await page.keyboard.press("1");
  await expect(result).toHaveCount(0);
  await skip.click();
  await expect(result).toBeFocused();
  await result.click();
  await expect(page.getByLabel("Skor 0 dari 0")).toBeVisible();
  await expect(page.getByText("1 soal dilewati dan tidak dihitung.")).toBeVisible();
});

test.describe("online audio failure", () => {
  test.use({ serviceWorkers: "block" });

  test("the next question starts with playable controls after skipping a failed clip", async ({
    page,
  }) => {
    await page.route("https://everyayah.com/**", (route) => route.abort());
    await page.goto("/kuis?mode=tebak-audio&scope=juz:30&n=5&d=mudah&seed=skip-audio");

    const question = page.getByRole("region", { name: "Soal" });
    const play = question.getByRole("button", { name: "Putar ayat", exact: true });
    const skip = question.getByRole("button", { name: "Lewati soal" });
    await play.click();
    await expect(question.getByText(/^Audio tidak bisa dimuat/)).toBeVisible();
    await skip.click();
    await question.getByRole("button", { name: "Lanjut", exact: true }).click();
    await expect(page.getByText("Soal 2 dari 5")).toBeVisible();
    await expect(play).toBeEnabled();
    await expect(question.getByRole("group", { name: "Pilihan jawaban" })).toBeVisible();
    await expect(skip).toHaveCount(0);
  });
});
