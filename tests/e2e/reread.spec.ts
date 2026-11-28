import { expect, test } from "@playwright/test";
import { openPowerOfNow, signUp } from "./helpers";

/** History and re-reading work from the ideas the user read; re-reads never count as new reading. */
test("a user can see what they read and re-read it", async ({ page }, testInfo) => {
  await signUp(page, "reread", testInfo.project.name, { english: true });
  await openPowerOfNow(page);
  await page.getByTestId("book-cta").click();
  for (let n = 1; n <= 3; n++) {
    await expect(page).toHaveURL(new RegExp(`/ideas/${n}$`));
    await expect(page.getByTestId("idea-remember")).toBeVisible();
    await page.getByTestId("idea-continue").click();
  }

  await page.goto("/history");
  await expect(page.getByText("3 cards read")).toBeVisible();
  await expect(page.getByText(/Read once/).first()).toBeVisible();
  await page.getByLabel("Search my history").fill("zzzzzznotaword");
  await expect(page.getByText(/No card you.ve read matches/)).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.getByText("3 cards read")).toBeVisible();

  await page.goto("/reread");
  await page.getByRole("radio", { name: "Oldest first" }).check();
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByText("1 re-read in this session")).toBeVisible();

  // One day of activity only.
  await page.goto("/progress");
  await expect(page.getByText("1 day").first()).toBeVisible();
});
