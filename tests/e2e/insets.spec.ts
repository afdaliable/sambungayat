import { expect, test } from "@playwright/test";

// Inside the Android app Capacitor injects --safe-area-inset-*; a browser has none, so there the padding is 0.

test("header and footer add the system bar insets (Android app) and nothing on the web", async ({ page }) => {
  await page.goto("/");
  const pad = (sel: string, side: "Top" | "Bottom") =>
    page.locator(sel).evaluate((el, s) => parseFloat(getComputedStyle(el)[`padding${s}`]), side);
  expect(await pad("header.band", "Top")).toBe(0);

  await page.addStyleTag({ content: ":root{--safe-area-inset-top:40px;--safe-area-inset-bottom:24px}" });
  expect(await pad("header.band", "Top")).toBe(40);
  expect(await pad("footer", "Bottom")).toBe(24);
});

test("the sticky Next bar stays clear of the gesture bar", async ({ page }) => {
  await page.goto("/kuis?mode=sambung&scope=juz:30&n=5&d=mudah&seed=insets");
  await page.addStyleTag({ content: ":root{--safe-area-inset-bottom:24px}" });
  await page.getByRole("group", { name: "Pilihan jawaban" }).getByRole("button").first().click(); // answering reveals the Next bar
  const bar = page.locator(".sticky.bottom-0").first();
  await expect(bar).toBeAttached();
  expect(await bar.evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom))).toBe(36); // 0.75rem + 24px
});

test("touch targets are 48 px inside the Android app and 44 px on the web", async ({ page, browser }) => {
  const h = (p: typeof page) => p.locator("#theme-toggle").evaluate((el) => el.getBoundingClientRect().height);
  await page.goto("/");
  expect(await h(page)).toBeLessThan(48);

  const ctx = await browser.newContext();
  const app = await ctx.newPage();
  await app.addInitScript(() => ((window as unknown as { Capacitor: object }).Capacitor = {}));
  await app.goto("/");
  expect(await h(app)).toBeGreaterThanOrEqual(48);
  await ctx.close();
});
