import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test("retry recovers after the initial metadata request fails", async ({ page }) => {
  let fail = true;
  await page.route("**/data/v1/index.json", (route) => (fail ? route.abort() : route.continue()));
  await page.goto("/kuis");
  const retry = page.getByRole("button", { name: "Coba lagi", exact: true });
  await expect(retry).toBeVisible();
  await retry.click();
  await expect(retry).toBeVisible();
  await expect(page.getByRole("region", { name: "Soal", exact: true })).toHaveCount(0);

  fail = false;
  await retry.click();
  await expect(page.getByRole("region", { name: "Soal", exact: true })).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Pilihan jawaban" }).getByRole("button"),
  ).toHaveCount(4);
});
