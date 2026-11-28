import { expect, test } from "@playwright/test";
import { openPowerOfNow, signUp } from "./helpers";

/**
 * Main journey: sign up, Home shelves, open a book, read ideas in order (the next
 * one unlocks only after "Continue"), library, stash, history, profile hub.
 * Needs `npm run seed:demo` and e-mail confirmation off.
 */
test("a reader opens a book, reads ideas in order and finds it in the library", async ({ page }, testInfo) => {
  await signUp(page, "journey", testInfo.project.name);

  // Home: shelves and topics, with the English-only demo book still shown to a French reader.
  await expect(page.getByRole("heading", { name: "Dernières nouveautés" })).toBeVisible();
  await openPowerOfNow(page);
  await expect(page.getByText("0/8 idées")).toBeVisible();
  await expect(page.getByText("ne sont pas encore", { exact: false }).or(page.getByText("pas encore disponible en français"))).toBeVisible();

  // Only idea 1 is open.
  await expect(page.locator("li[data-state='locked']")).toHaveCount(7);
  const lockedId = page.url().split("/books/")[1];
  await page.goto(`/books/${lockedId}/ideas/3`);
  await expect(page).toHaveURL(new RegExp(`/books/${lockedId}$`)); // a locked idea sends you back to the book

  // Read idea 1: story first, then what to remember, then the action.
  await page.getByTestId("book-cta").click();
  await expect(page).toHaveURL(/\/ideas\/1$/);
  const article = page.locator("article");
  await expect(article.getByRole("heading", { level: 1 })).toHaveText("Who is doing the thinking?");
  const text = (await article.textContent()) ?? "";
  const order = ["Priya has been standing", "Voici ce qu'il faut retenir", "À faire aujourd'hui"].map((s) => text.indexOf(s));
  expect(order.every((p) => p >= 0)).toBe(true);
  expect(order).toEqual([...order].sort((a, b) => a - b));

  // The story is split into short paragraphs, not one block.
  expect(await page.getByTestId("story-block").count()).toBeGreaterThanOrEqual(2);

  // Stash it, then continue: idea 2 unlocks.
  await page.getByRole("button", { name: /Sauvegarder/ }).click();
  await expect(page.getByRole("button", { name: /Sauvegardée/ })).toBeVisible();
  await page.getByTestId("idea-continue").click();
  await expect(page).toHaveURL(/\/ideas\/2$/);

  // Back on the book page: progress, the CTA continues where we stopped, the book is in progress in the library.
  await page.getByRole("link", { name: "The Power of Now" }).click();
  await expect(page.getByText("1/8 idées")).toBeVisible();
  await expect(page.locator("li[data-state='completed']")).toHaveCount(1);
  await expect(page.getByTestId("book-cta")).toHaveText("Continuer");
  await page.getByRole("button", { name: "Ajouter à ma bibliothèque" }).click();
  await expect(page.getByRole("button", { name: "Retirer de ma bibliothèque" })).toBeVisible();

  await page.goto("/library");
  await expect(page.getByTestId("book-tile").filter({ hasText: "The Power of Now" })).toBeVisible();
  await page.goto("/library?shelf=saved");
  await expect(page.getByTestId("book-tile").filter({ hasText: "The Power of Now" })).toBeVisible();
  await page.goto("/library?shelf=completed");
  await expect(page.getByText("Ta bibliothèque est vide")).toBeVisible();

  // Explore: topic page and search.
  await page.goto("/explore");
  await page.getByLabel("Un titre, un auteur, un sujet…").fill("tolle");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("book-tile").filter({ hasText: "The Power of Now" })).toBeVisible();
  await page.goto("/explore/investissements-marches");
  await expect(page.getByRole("heading", { name: /Investissements/ })).toBeVisible();

  // Profile gathers the other tools.
  await page.goto("/profile");
  await expect(page.getByRole("link", { name: "Révision" })).toBeVisible();
});

test("a reader can finish a whole book", async ({ page }, testInfo) => {
  await signUp(page, "finish", testInfo.project.name);
  await openPowerOfNow(page);
  await page.getByTestId("book-cta").click();
  for (let n = 1; n <= 8; n++) {
    await expect(page).toHaveURL(new RegExp(`/ideas/${n}$`));
    await expect(page.getByTestId("idea-remember")).toBeVisible();
    await page.getByTestId("idea-continue").click();
  }
  await expect(page.getByText("8/8 idées")).toBeVisible();
  await expect(page.locator("li[data-state='completed']")).toHaveCount(8);
  await page.goto("/library?shelf=completed");
  await expect(page.getByTestId("book-tile").filter({ hasText: "The Power of Now" })).toBeVisible();
});

test("anonymous visitors are sent to the login page", async ({ page }) => {
  await page.goto("/library");
  await expect(page).toHaveURL(/\/login\?next=%2Flibrary/);
});
