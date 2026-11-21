import { expect, test, type Page } from "@playwright/test";

async function manifest(page: Page): Promise<{ start_url: string; shortcuts: { url: string }[] }> {
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  const response = await page.request.get(href!);
  expect(response.ok()).toBe(true);
  return response.json();
}

async function selectLanguage(page: Page, code: string) {
  await page.locator("#lang-switch summary").click();
  await page.locator(`#lang-switch a[hreflang="${code}"]`).click();
  await expect(page.locator("html")).toHaveAttribute("lang", code);
}

async function emulateInstalled(page: Page) {
  await page.addInitScript(() => {
    const matchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query) =>
      matchMedia(query === "(display-mode: standalone)" ? "all" : query);
  });
}

test("installed app starts in the chosen language, without changing browser navigation", async ({
  page,
}) => {
  await page.goto("/");
  const { start_url } = await manifest(page);
  await selectLanguage(page, "en");

  await page.goto(start_url);
  await expect(page.locator("html")).toHaveAttribute("lang", "id");

  await emulateInstalled(page);
  await page.goto(start_url);
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await selectLanguage(page, "id");
  await page.goto(start_url);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
});

test("installed shortcuts use the chosen language and keep the quiz settings", async ({ page }) => {
  await page.goto("/");
  const { shortcuts } = await manifest(page);
  await selectLanguage(page, "en");
  await emulateInstalled(page);

  // Unmarked links still honor the language in their URL, even inside the app.
  await page.goto("/harian");
  await expect(page.locator("html")).toHaveAttribute("lang", "id");

  await page.goto(shortcuts[0]!.url);
  await expect(page).toHaveURL(/\/en\/harian$/);

  await page.goto(shortcuts[1]!.url);
  await expect(page.getByRole("region", { name: "Question" })).toBeVisible();
  const url = new URL(page.url());
  expect(url.pathname).toBe("/en/kuis");
  expect(Object.fromEntries(url.searchParams)).toMatchObject({
    mode: "sambung",
    scope: "juz:30",
    n: "10",
    d: "mudah",
  });
  expect(url.searchParams.has("launch")).toBe(false);
});

test("installed app opens the cached home in the chosen language offline", async ({
  page,
  context,
}) => {
  await emulateInstalled(page);
  await page.goto("/");
  const { start_url } = await manifest(page);
  await selectLanguage(page, "en");
  await page.waitForFunction(() => localStorage.getItem("sa:v1:offline:en") === "1", null, {
    timeout: 20_000,
  });
  await page.reload();
  await context.setOffline(true);
  await page.goto(start_url);
  await expect(page.getByRole("button", { name: "Start quiz" })).toBeVisible();
  await expect(page).toHaveURL(/\/en$/);
});
