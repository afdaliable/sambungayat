import { expect, test, type Page } from "@playwright/test";

const GROUP = "Answer choices";

async function answerAllEn(page: Page, count: number) {
  for (let i = 0; i < count; i++) {
    const group = page.getByRole("group", { name: GROUP });
    await expect(group).toBeVisible();
    await page.keyboard.press("1");
    await expect(group.getByRole("button").first()).toBeDisabled();
    await page.keyboard.press("Enter");
  }
}

test("English: home -> quiz -> result stays under /en", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: "Start quiz" }).click();
  await expect(page).toHaveURL(/\/en\/kuis\?/);
  await expect(page.getByRole("region", { name: "Question" })).toBeVisible();
  await answerAllEn(page, 10);
  await expect(page.getByLabel(/^Score \d+ out of 10$/)).toBeVisible();
});

test("English and Indonesian links with the same seed give the same first question", async ({
  browser,
}) => {
  const q = "mode=sambung&scope=juz:30&n=10&d=mudah&seed=i18nseed";
  const ids = [];
  for (const prefix of ["", "/en"]) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${prefix}/kuis?${q}`);
    const region = page.getByRole("region", { name: prefix ? "Question" : "Soal" });
    await expect(region).toBeVisible();
    // The Arabic prompt is language independent.
    ids.push(await region.locator("[lang=ar]").first().innerText());
    await ctx.close();
  }
  expect(ids[0]).toBe(ids[1]);
});

test("English pages keep every internal link under /en", async ({ page }) => {
  for (const path of ["/en", "/en/surah/an-naba", "/en/juz/30", "/en/tentang", "/en/faq"]) {
    await page.goto(path);
    const hrefs = await page
      .locator("a[href^='/']")
      .evaluateAll((els) =>
        els.filter((e) => !e.closest("#lang-switch")).map((e) => e.getAttribute("href") ?? ""),
      );
    // /kontribusi is the one English-only page without a language prefix (developer guide).
    const bad = hrefs.filter(
      (h) => h !== "/kontribusi" && !/^\/(en)(\/|\?|#|$)/.test(h) && !h.startsWith("/_"),
    );
    expect(bad, `${path}: ${bad.join(", ")}`).toEqual([]);
  }
});

test("English answer translation comes from the English edition", async ({ page }) => {
  await page.goto("/en/kuis?mode=sambung&scope=juz:30&n=5&d=mudah&seed=trseed");
  await expect(page.getByRole("region", { name: "Question" })).toBeVisible();
  await page.keyboard.press("1");
  const line = page.getByText(/^Translation:/);
  await expect(line).toBeVisible();
  // Indonesian edition words would show up here if the fallback were used.
  await expect(line).not.toContainText(/\b(yang|dan|kepada|telah)\b/);
});

test("English Juz 30 quiz and translations work offline", async ({ page, context }) => {
  await page.goto("/en");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  // The English offline files are fetched once, shortly after load (see BaseLayout).
  await page.waitForFunction(() => localStorage.getItem("sa:v1:offline:en") === "1", null, {
    timeout: 20_000,
  });

  await context.setOffline(true);
  await page.goto("/en/kuis?mode=sambung&scope=juz:30&n=5&d=mudah&seed=enoff");
  await expect(page.getByRole("region", { name: "Question" })).toBeVisible();
  await page.keyboard.press("1");
  const line = page.getByText(/^Translation:/);
  await expect(line).not.toContainText(/\b(yang|dan|kepada|telah)\b/);
  // An unvisited page falls back to the English offline page, not the Indonesian one.
  await page.goto("/en/surah/al-baqarah");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("language switcher keeps the page and the quiz query", async ({ page }) => {
  const q = "mode=sambung&scope=juz:30&n=5&d=mudah&seed=switch1";
  await page.goto(`/kuis?${q}`);
  await page.locator("#lang-switch summary").click();
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(new RegExp(`/en/kuis\\?${q.replace(/[?]/g, "\\$&")}`));
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.locator("#lang-switch summary").click();
  await page.getByRole("link", { name: "Bahasa Indonesia" }).click();
  await expect(page).toHaveURL(new RegExp(`/kuis\\?${q}`));
});

for (const lang of ["ms", "tr", "fr", "es", "de", "ru", "bn", "hi", "ar", "ur"]) {
  test(`${lang}: quiz works, html lang is set and links stay under the prefix`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/kuis?mode=sambung&scope=juz:30&n=5&d=mudah&seed=smoke`);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    const q = page.locator("section.fade-in").first();
    await expect(q).toBeVisible();
    await page.keyboard.press("1");
    // Arabic prompt and a translation line both render; the translation is not the Indonesian fallback.
    await expect(q.locator("[lang=ar]").first()).toBeVisible();
    await page.goto(`/${lang}`);
    const hrefs = await page
      .locator("a[href^='/']")
      .evaluateAll((els) =>
        els.filter((e) => !e.closest("#lang-switch")).map((e) => e.getAttribute("href") ?? ""),
      );
    // /kontribusi is the one English-only page without a language prefix (developer guide).
    const bad = hrefs.filter(
      (h) => h !== "/kontribusi" && !new RegExp(`^/${lang}(/|\\?|#|$)`).test(h),
    );
    expect(bad, bad.join(", ")).toEqual([]);
  });
}

test("no horizontal overflow at 360px in the longest-label languages", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  for (const lang of ["fr", "es", "ru", "de", "bn", "ar", "ur"]) {
    for (const path of ["", "/kuis", "/tentang"]) {
      await page.goto(`/${lang}${path}`);
      const [sw, cw] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(sw, `/${lang}${path}`).toBeLessThanOrEqual(cw);
    }
  }
});

for (const lang of ["ar", "ur"]) {
  test(`${lang}: page direction is right-to-left`, async ({ page }) => {
    await page.goto(`/${lang}`);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.goto(`/${lang}/surah/an-naba`);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
}
