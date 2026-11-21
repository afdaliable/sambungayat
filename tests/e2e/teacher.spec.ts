import { test, expect } from "@playwright/test";

test("teacher juz filter narrows the surah list without changing the link's selections", async ({
  page,
}) => {
  await page.goto("/guru");
  await page.getByLabel("Jenis cakupan").selectOption("surah");

  const filter = page.getByLabel("Persempit daftar menurut juz (opsional)");
  const surahs = page.getByRole("group", { name: "Pilih surah (boleh lebih dari satu)" });
  const fatihah = surahs.getByRole("checkbox", { name: "1. Al-Fatihah", exact: true });
  const naba = surahs.getByRole("checkbox", { name: "78. An-Naba'", exact: true });
  const naziat = surahs.getByRole("checkbox", { name: "79. An-Nazi'at", exact: true });
  await expect(fatihah).toBeVisible();

  await filter.selectOption({ label: "Juz 30" });
  await expect(naba).toBeChecked();
  await expect(fatihah).toHaveCount(0);
  await naziat.check();

  await filter.selectOption({ label: "Juz 29" });
  await expect(surahs.getByRole("checkbox", { name: "67. Al-Mulk", exact: true })).toBeVisible();
  await expect(naba).toHaveCount(0);
  await expect(naziat).toHaveCount(0);
  await page.getByRole("button", { name: "Buat link", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Link kuis" })).toHaveValue(
    /[?&]scope=surah:78,79(?:&|$)/,
  );

  await filter.selectOption({ label: "Semua juz" });
  await expect(fatihah).toBeVisible();
  await expect(naba).toBeChecked();
  await expect(naziat).toBeChecked();
});

test.describe("teacher metadata retry", () => {
  test.use({ serviceWorkers: "block" });

  test("retries failed metadata requests and restores the link builder", async ({ page }) => {
    let fail = true;
    await page.route("**/data/v1/index.json", (route) => (fail ? route.abort() : route.continue()));
    await page.goto("/guru");

    const retry = page.getByRole("button", { name: "Coba lagi", exact: true });
    const build = page.getByRole("button", { name: "Buat link", exact: true });
    const error = page.getByRole("alert").filter({ hasText: "Data surah belum bisa dimuat" });
    await expect(error).toBeVisible();
    await expect(build).toHaveCount(0);

    await Promise.all([
      page.waitForEvent("requestfailed", (request) =>
        request.url().endsWith("/data/v1/index.json"),
      ),
      retry.click(),
    ]);
    await expect(error).toBeVisible();

    fail = false;
    await retry.click();
    await expect(build).toBeVisible();
    await expect(error).toHaveCount(0);
  });
});
