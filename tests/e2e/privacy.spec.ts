import { expect, test } from "@playwright/test";

test("privacy page: linked from the footer, shows the contact address, localized", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("footer").getByRole("link", { name: "Kebijakan privasi" }).click();
  await expect(page).toHaveURL(/\/privasi$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kebijakan privasi");
  await expect(page.locator("main")).toContainText("halo@sambungayat.com");
  await expect(page.locator("main")).toContainText("Google Analytics");

  await page.goto("/ar/privasi");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("سياسة الخصوصية");
});

test("contact page shows the mail form now that the address is set", async ({ page }) => {
  await page.goto("/kontak");
  await expect(page.locator("form[data-email='halo@sambungayat.com']")).toBeVisible();
});

test("contribute page is linked from the footer and points to the repository guides", async ({
  page,
}) => {
  await page.goto("/en");
  await page.locator("footer").getByRole("link", { name: "Contribute" }).click();
  await expect(page).toHaveURL(/\/kontribusi$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contribute to Sambung Ayat");
  await expect(page.getByRole("link", { name: "Developer guide" })).toHaveAttribute(
    "href",
    /github\.com\/afdaliable\/sambungayat\/blob\/main\/docs\/developer-guide\.md$/,
  );
});
