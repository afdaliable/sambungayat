import { expect, test } from "@playwright/test";
import { answerAll } from "./helpers";

// `astro preview` has no Pages Functions, so /api/stats is mocked here. The handler itself is covered
// by tests/unit/stats.test.ts.

test("home shows the public counter once it is large enough", async ({ page }) => {
  await page.route("**/api/stats", (r) =>
    r.fulfill({ json: { total: 12480, week: 320 }, headers: { "cache-control": "no-store" } }),
  );
  await page.goto("/");
  const box = page.locator("#home-stats");
  await page.locator("#percaya").scrollIntoViewIfNeeded(); // the counter is fetched when this section nears the viewport
  await expect(box).toBeVisible();
  await expect(box).toContainText("12.480");
  await expect(box).toContainText("320");
});

test("home hides the counter while it is small or the API fails", async ({ page }) => {
  await page.route("**/api/stats", (r) => r.fulfill({ json: { total: 7, week: 7 } }));
  await page.goto("/");
  await page.locator("#percaya").scrollIntoViewIfNeeded();
  await page.waitForResponse("**/api/stats");
  await expect(page.locator("#home-stats")).toBeHidden();

  await page.route("**/api/stats", (r) => r.fulfill({ status: 404, body: "" }));
  await page.reload();
  await page.locator("#percaya").scrollIntoViewIfNeeded();
  await expect(page.locator("#home-stats")).toBeHidden();
});

test("finishing a quiz sends one anonymous count with only the mode", async ({ page }) => {
  const posts: string[] = [];
  await page.route("**/api/stats", async (r) => {
    if (r.request().method() === "POST") posts.push(r.request().postData() ?? "");
    await r.fulfill({ json: { ok: true } });
  });
  await page.goto("/kuis?mode=sambung&scope=juz:30&n=5&d=mudah&seed=statstest");
  await answerAll(page, 5);
  await expect(page.getByLabel(/^Skor \d+ dari 5$/)).toBeVisible();
  await expect.poll(() => posts.length).toBe(1);
  expect(JSON.parse(posts[0]!)).toEqual({ mode: "sambung" });
});
