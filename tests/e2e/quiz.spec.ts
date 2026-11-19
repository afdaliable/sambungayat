import { expect, test } from "@playwright/test";
import { answerAll, firstQuestionText } from "./helpers";

test("home -> Juz 30 quiz -> 10 answers -> result", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mulai kuis" }).click();
  await expect(page.getByRole("region", { name: "Soal" })).toBeVisible();
  await answerAll(page, 10);
  await expect(page.getByLabel(/^Skor \d+ dari 10$/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Ulangi" })).toBeVisible();
});

test("keyboard digit answers and reveals", async ({ page }) => {
  await page.goto("/kuis?mode=tebak-surah&scope=juz:30&n=5&d=mudah&seed=abc");
  await expect(page.getByRole("region", { name: "Soal" })).toBeVisible();
  await page.keyboard.press("2");
  await expect(
    page.getByRole("group", { name: "Pilihan jawaban" }).getByRole("button").nth(1),
  ).toBeDisabled();
});

test("same seed gives same first question in two contexts (teacher link)", async ({ browser }) => {
  const url = "/kuis?mode=sambung&scope=juz:30&n=10&d=mudah&seed=guru1";
  const texts: string[] = [];
  for (let i = 0; i < 2; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(url);
    texts.push(await firstQuestionText(page));
    await ctx.close();
  }
  expect(texts[0]).toBe(texts[1]);
});

test("daily challenge is identical in two contexts", async ({ browser }) => {
  const texts: string[] = [];
  for (let i = 0; i < 2; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/harian");
    texts.push(await firstQuestionText(page));
    await ctx.close();
  }
  expect(texts[0]).toBe(texts[1]);
});

test("surah page title and start button", async ({ page }) => {
  await page.goto("/surah/an-naba");
  await expect(page).toHaveTitle(/^Kuis Surah An-Naba.* Latihan Hafalan \| Sambung Ayat$/);
  await page.getByRole("link", { name: "Mulai kuis Sambung Ayat surah ini" }).click();
  await expect(page).toHaveURL(/\/kuis\?mode=sambung&scope=surah:78/);
  await expect(page.getByRole("region", { name: "Soal" })).toBeVisible();
});

test("juz page starts a quiz for that juz", async ({ page }) => {
  await page.goto("/juz/5");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kuis Hafalan Juz 5");
  await page.getByRole("link", { name: "Mulai Sambung Ayat Juz 5" }).click();
  await expect(page).toHaveURL(/scope=juz:5/);
  await expect(page.getByRole("region", { name: "Soal" })).toBeVisible();
});

test("home form: pick mode and juz, then start; no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
  await page.getByLabel(/Tebak Surah/).check({ force: true });
  await page.getByLabel("2. Pilih juz").selectOption("juz:12");
  await page.getByRole("button", { name: "Mulai kuis" }).click();
  await expect(page).toHaveURL(/mode=tebak-surah&n=10&d=mudah&scope=juz%3A12|scope=juz(:|%3A)12/);
  await expect(page.getByRole("region", { name: "Soal" })).toBeVisible();
});

test("student sends score tag and teacher recap parses it", async ({ page }) => {
  await page.goto("/kuis?mode=sambung&scope=juz:30&n=5&d=mudah&seed=kls1");
  await answerAll(page, 5);
  await page.getByText("Dikerjakan untuk guru? Kirim skormu").click();
  await page.getByLabel("Namamu").fill("Budi");
  await page.evaluate(() => {
    // Chromium headless has no share sheet; capture the clipboard fallback.
    (navigator as unknown as { share?: unknown }).share = undefined;
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: (t: string) => ((window as unknown as { _clip: string })._clip = t) },
    });
  });
  await page.getByRole("button", { name: "Kirim ke guru" }).click();
  const clip = await page.evaluate(() => (window as unknown as { _clip: string })._clip);
  await page.goto("/rekap");
  await page.getByLabel("Tempel pesan dari grup WhatsApp").fill(`[10:00] Budi: ${clip}`);
  await expect(page.getByRole("cell", { name: "Budi" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "kls1" })).toBeVisible();
});

test("audio saved for offline is served from the cache by the service worker", async ({
  page,
  context,
}) => {
  const mp3 = Buffer.alloc(4096, 1);
  await context.route("https://everyayah.com/**", (r) =>
    r.fulfill({
      status: 200,
      body: mp3,
      headers: { "content-type": "audio/mpeg", "access-control-allow-origin": "*" },
    }),
  );
  await page.goto("/kuis");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.getByLabel(/Tebak Ayat dari Audio/).check({ force: true });
  await page.getByLabel("Jenis cakupan").selectOption("range");
  await page.getByLabel("Dari surah").selectOption("108");
  await page.getByLabel("Sampai surah").selectOption("108");
  await page.getByRole("button", { name: "Simpan audio" }).click();
  await expect(page.getByText(/3\/3 ayat tersimpan/)).toBeVisible();
  await context.setOffline(true);
  const status = await page.evaluate(async () => {
    const r = await fetch("https://everyayah.com/data/Alafasy_128kbps/108002.mp3", {
      headers: { Range: "bytes=0-99" },
    });
    return [r.status, (await r.arrayBuffer()).byteLength];
  });
  expect(status).toEqual([206, 100]);
});

test("new modes start from the home form", async ({ page }) => {
  for (const [label, prompt] of [
    [/Tebak Juz/, "Ayat ini ada di juz berapa?"],
    [/Ayat Sebelumnya/, "Pilih ayat sebelumnya"],
  ] as const) {
    await page.goto("/");
    await page.getByLabel(label).check({ force: true });
    await page.getByRole("button", { name: "Mulai kuis" }).click();
    await expect(page.getByRole("heading", { name: prompt })).toBeVisible();
    await answerAll(page, 10);
    await expect(page.getByLabel(/^Skor \d+ dari 10$/)).toBeVisible();
  }
});

test("share bar, faq, contact and footer links", async ({ page }) => {
  await page.goto("/surah/an-naba");
  const wa = page.getByRole("link", { name: "WhatsApp" });
  await expect(wa).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/\?text=.*sambungayat\.com%2Fsurah%2Fan-naba/,
  );
  await expect(page.getByRole("link", { name: "Telegram" })).toBeVisible();
  await page.getByRole("link", { name: "FAQ" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Pertanyaan yang sering diajukan",
  );
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(ld!)["@type"]).toBe("FAQPage");
  await page.getByRole("link", { name: "Kontak" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kontak");
});

test("setup: several juz and an ayah range start a quiz with the matching scope", async ({
  page,
}) => {
  await page.goto("/kuis");
  await page.getByText("29", { exact: true }).click();
  await page.getByRole("button", { name: "Mulai", exact: true }).click();
  await expect(page).toHaveURL(/scope=juz:29,30/);
  await page.goto("/kuis");
  await page.getByLabel("Jenis cakupan").selectOption("ayat");
  await page.getByLabel("Surah", { exact: true }).selectOption("2");
  await page.getByLabel("Dari ayat").fill("255");
  await page.getByLabel("Sampai ayat").fill("260");
  await page.getByRole("button", { name: "Mulai", exact: true }).click();
  await expect(page).toHaveURL(/scope=ayat:2:255-260/);
});

test("after answering, the correct option offers an audio button", async ({ page }) => {
  await page.goto("/kuis?mode=sambung&scope=juz:30&n=5&d=mudah&seed=aud1");
  await expect(page.getByRole("group", { name: "Pilihan jawaban" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Putar ayat yang benar" })).toHaveCount(0);
  await page.keyboard.press("1");
  await expect(page.getByRole("button", { name: "Putar ayat yang benar" })).toHaveCount(1);
});

test("result offers to retry only the wrong answers", async ({ page }) => {
  await page.goto("/kuis?mode=sambung&scope=juz:30&n=5&d=mudah&seed=retry1");
  await expect(page.getByRole("group", { name: "Pilihan jawaban" })).toBeVisible();
  // answer option 1 every time; with this seed at least one answer is wrong
  // wait for the feedback before pressing Enter, and for the next question before answering again (CI is slow)
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("1");
    await expect(page.getByRole("button", { name: "Putar ayat yang benar" })).toHaveCount(1);
    await page.keyboard.press("Enter");
    if (i < 4) await expect(page.getByText(`Soal ${i + 2} dari`)).toBeVisible();
  }
  const retry = page.getByRole("button", { name: /Latih \d+ soal yang salah/ });
  await expect(retry).toBeVisible();
  await retry.click();
  await expect(page.getByText(/Soal 1 dari/)).toBeVisible();
});
