import { expect, test } from "@playwright/test";

// The Android app on a WebView older than 111 shows a plain notice instead of a broken page.
const OLD = "Mozilla/5.0 (Linux; Android 7.0) AppleWebKit/537.36 Chrome/53.0.2785.124 Mobile Safari/537.36";
const NEW = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/133.0.0.0 Mobile Safari/537.36";

for (const [name, ua, shown] of [["old", OLD, true], ["current", NEW, false]] as const) {
  test(`app on a ${name} WebView: notice ${shown ? "shown" : "hidden"}`, async ({ browser }) => {
    const ctx = await browser.newContext({ userAgent: ua });
    const page = await ctx.newPage();
    await page.addInitScript(() => ((window as unknown as { Capacitor: object }).Capacitor = {}));
    await page.goto("/");
    const note = page.locator("#old-webview");
    if (shown) {
      await expect(note).toBeVisible();
      await expect(note).toContainText("WebView");
      await expect(page.locator("main")).toBeHidden();
    } else {
      await expect(note).toBeHidden();
      await expect(page.locator("main")).toBeVisible();
    }
    await ctx.close();
  });
}
