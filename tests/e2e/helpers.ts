import { expect, type Page } from "@playwright/test";

/** Answer every question with option 1 via the keyboard (digit, then Enter on the focused Next button). */
export async function answerAll(page: Page, count = 10) {
  for (let i = 0; i < count; i++) {
    await expect(page.getByRole("group", { name: "Pilihan jawaban" })).toBeVisible();
    await page.keyboard.press("1");
    await expect(
      page.getByRole("group", { name: "Pilihan jawaban" }).getByRole("button").first(),
    ).toBeDisabled();
    await page.keyboard.press("Enter");
  }
}

/** Text of the first option of the current question plus the prompt: identifies a question. */
export async function firstQuestionText(page: Page) {
  const q = page.getByRole("region", { name: "Soal" });
  await expect(q).toBeVisible();
  return q.innerText();
}
