import { expect, test } from "@playwright/test";

/**
 * Re-reading: history, "review later", the re-read mode, and the rule that
 * re-reads never count towards the daily goal or the streak.
 */
test("a user can browse their history and re-read without affecting the goal or the streak", async ({ page }, testInfo) => {
  await page.goto("/login?mode=signup");
  await page.getByLabel("Adresse e-mail").fill(`e2e-reread-${testInfo.project.name}-${Date.now()}@example.com`);
  await page.getByLabel("Mot de passe").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("checkbox", { name: /Psychologie/ }).check();
  await page.getByRole("checkbox", { name: /Communication/ }).check();
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("radio", { name: /10 cartes/ }).click();
  await page.getByRole("button", { name: "C'est parti" }).click();

  // Read three new cards.
  await expect(page).toHaveURL(/\/feed/);
  await expect(page.getByText("1 / 10 aujourd'hui")).toBeVisible();
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("button", { name: "Suivant" }).click();
  await expect(page.getByText("3 / 10 aujourd'hui")).toBeVisible();

  // History lists them; search and counters work.
  await page.goto("/history");
  await expect(page.getByText("3 cartes lues")).toBeVisible();
  await expect(page.getByText(/Lue 1 fois/).first()).toBeVisible();
  await page.getByRole("button", { name: "Revoir plus tard" }).first().click();
  await expect(page.getByText("Dans ta file de révision")).toBeVisible();
  await page.getByLabel("Rechercher dans mon historique").fill("zzzzzznotaword");
  await expect(page.getByText(/Aucune carte lue ne correspond/)).toBeVisible();
  await page.getByRole("button", { name: "Réinitialiser les filtres" }).click();
  await expect(page.getByText("3 cartes lues")).toBeVisible();

  // The card put back in the queue is due for spaced repetition.
  await page.goto("/review");
  await expect(page.getByRole("button", { name: "Voir l'idée" })).toBeVisible();

  // Re-read mode: two cards re-read, with their read count.
  await page.goto("/reread");
  await page.getByRole("radio", { name: "Les plus anciennes d'abord" }).check();
  await page.getByRole("button", { name: "Commencer" }).click();
  await expect(page.getByText("1 relue dans cette session")).toBeVisible();
  await expect(page.getByText(/Lue \d+ fois|Lue 1 fois/).first()).toBeVisible();
  await page.getByRole("button", { name: "Suivant" }).click();
  await expect(page.getByText("2 relues dans cette session")).toBeVisible();

  // Back in the feed: re-reads did not add to the goal (3 new + the card shown now = 4),
  // and they show separately as a bonus.
  await page.goto("/feed");
  await expect(page.getByText("4 / 10 aujourd'hui")).toBeVisible();
  await expect(page.getByText("+2 relues aujourd'hui (bonus, sans effet sur ta série)")).toBeVisible();

  // Same for the streak: one day of activity, no more.
  await page.goto("/progress");
  await expect(page.getByText("1 jour").first()).toBeVisible();
  await expect(page.getByText("Série actuelle")).toBeVisible();
});

test("turning on 'include cards already read' mixes re-reads into the feed", async ({ page }, testInfo) => {
  await page.goto("/login?mode=signup");
  await page.getByLabel("Adresse e-mail").fill(`e2e-mix-${testInfo.project.name}-${Date.now()}@example.com`);
  await page.getByLabel("Mot de passe").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("checkbox", { name: /Psychologie/ }).check();
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("button", { name: "C'est parti" }).click();
  await expect(page).toHaveURL(/\/feed/);

  // Read a few cards so there is something to re-read.
  for (let i = 0; i < 3; i++) {
    await expect(page.locator("article h2").first()).toBeVisible();
    await page.getByRole("button", { name: "Suivant" }).click();
  }

  const toggle = page.getByRole("checkbox", { name: "Inclure des cartes déjà lues" });
  await expect(toggle).not.toBeChecked(); // new cards only by default
  await toggle.check();
  await expect(page.getByLabel("Mélange")).toBeVisible();
  await expect(page.getByRole("option", { name: "80 % nouvelles, 20 % relues" })).toBeAttached();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Inclure des cartes déjà lues" })).toBeChecked(); // saved on the profile
});

test("when no new card is left, the feed switches to re-reading with a clear message", async ({ page }, testInfo) => {
  await page.goto("/login?mode=signup");
  await page.getByLabel("Adresse e-mail").fill(`e2e-fallback-${testInfo.project.name}-${Date.now()}@example.com`);
  await page.getByLabel("Mot de passe").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("checkbox", { name: /Psychologie/ }).check();
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("button", { name: "C'est parti" }).click();
  await expect(page).toHaveURL(/\/feed/);

  // Read every card of the demo content (12) until the feed has nothing more to show.
  const allSeen = page.getByText("Tu as tout vu pour l'instant");
  const next = page.getByRole("button", { name: "Suivant" });
  for (let i = 0; i < 40 && !(await allSeen.isVisible()); i++) {
    if (await next.isEnabled()) await next.click();
    await page.waitForTimeout(150);
  }
  await expect(allSeen).toBeVisible();

  // The next time the feed opens there is no new card: it turns into a re-read session, with a message.
  await page.reload();
  await expect(page.getByText("Tu as lu toutes les nouvelles cartes de tes catégories")).toBeVisible();
  await expect(page.getByText(/Lue \d+ fois|Lue 1 fois/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Revoir plus tard" })).toBeVisible();
  // Re-reads still don't count towards the goal.
  await expect(page.getByText("12 / 5 aujourd'hui")).toHaveCount(0);
});
