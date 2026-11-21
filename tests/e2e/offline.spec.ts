import { expect, test } from "@playwright/test";
import { audioUrl, DEFAULT_RECITER } from "../../src/config/reciters";
import { AUDIO_CACHE } from "../../src/lib/audioCache";
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

test("an audio quiz plays a saved recitation through the service worker offline", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  const quiz = "/kuis?mode=tebak-audio&scope=ayat:114:1-1&n=5&d=mudah&seed=offline-audio";
  await page.goto(quiz);
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  // Five seconds of silent PCM audio keeps the test independent of the recitation CDN.
  const wav = Buffer.alloc(44 + 5 * 8000);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(8000, 28);
  wav.writeUInt16LE(1, 32);
  wav.writeUInt16LE(8, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(wav.length - 44, 40);
  wav.fill(128, 44);
  const url = audioUrl(DEFAULT_RECITER, 114, 1);
  await page.evaluate(
    async ({ cacheName, url, wav }) => {
      const cache = await caches.open(cacheName);
      await cache.put(
        url,
        new Response(
          Uint8Array.from(atob(wav), (c) => c.charCodeAt(0)),
          {
            headers: { "Content-Type": "audio/wav" },
          },
        ),
      );
    },
    { cacheName: AUDIO_CACHE, url, wav: wav.toString("base64") },
  );

  await context.setOffline(true);
  await page.goto(quiz);
  expect(await page.evaluate(() => navigator.onLine)).toBe(false);
  const rangeStatus = await page.evaluate(async (url) => {
    const clip = await fetch(url, { headers: { Range: "bytes=0-43" } });
    return clip.status;
  }, url);
  expect(rangeStatus).toBe(206);

  await page.getByRole("button", { name: "Putar ayat", exact: true }).click();
  await expect(page.getByRole("button", { name: "Jeda" })).toBeVisible();
  const audio = page.locator("audio");
  await expect
    .poll(() => audio.evaluate((el) => (el as HTMLAudioElement).currentTime))
    .toBeGreaterThan(0);
  await page.getByRole("group", { name: "Pilihan jawaban" }).getByRole("button").first().click();
  await page.getByRole("button", { name: "Putar ayat yang benar", exact: true }).click();
  await expect
    .poll(() => audio.nth(1).evaluate((el) => (el as HTMLAudioElement).currentTime))
    .toBeGreaterThan(0);

  await page.evaluate((cacheName) => caches.delete(cacheName), AUDIO_CACHE);
  await page.goto(quiz);
  await expect(page.getByText(/^Audio tidak bisa dimuat/)).toBeVisible();
});
