import { expect, type Page } from "@playwright/test";

/** Signs up a new user, picks the "Investissements"/"Mentalité" topics and lands on Home. */
export async function signUp(page: Page, label: string, project: string, options: { goal?: RegExp; english?: boolean } = {}) {
  await page.goto("/login?mode=signup");
  await page.getByLabel("Adresse e-mail").fill(`e2e-${label}-${project}-${Date.now()}@example.com`);
  await page.getByLabel("Mot de passe").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 });
  if (options.english) await page.getByRole("radio", { name: "English" }).click();
  const next = page.getByRole("button", { name: options.english ? "Next" : "Suivant" });
  await next.click();
  await page.getByRole("checkbox", { name: options.english ? /Mindset/ : /Mentalité/ }).check();
  await next.click();
  if (options.goal) await page.getByRole("radio", { name: options.goal }).click();
  await page.getByRole("button", { name: options.english ? "Let's go" : "C'est parti" }).click();
  await expect(page).toHaveURL(/\/home/);
}

/** Opens The Power of Now from Home. */
export async function openPowerOfNow(page: Page) {
  await page.getByTestId("book-tile").filter({ hasText: "The Power of Now" }).first().click();
  await expect(page.getByRole("heading", { name: "The Power of Now", level: 1 })).toBeVisible();
}
