import { expect, test } from '@playwright/test';

import { mockApi } from './helpers/mockApi';

test.describe('Accueil', () => {
  test("ouvre sur une affirmation et présente le site, sans rail de navigation", async ({
    page,
  }) => {
    // Évite la dépendance aux compteurs animés (Framer Motion, 1,2 s) : la
    // valeur finale s'affiche immédiatement, comme le fait déjà l'application
    // sous prefers-reduced-motion (CDC 6.2).
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mockApi(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      "Le budget de l'État, enfin lisible",
    );

    // L'accueil vit hors de la coque applicative : le rail n'apparaît qu'une
    // fois entré dans les données. C'est ce qui distingue la page de
    // présentation du reste du site.
    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toHaveCount(0);

    // Les chiffres clés sont commentés, pas seulement alignés.
    const depenses = page.getByText("Ce que l'État prévoit de dépenser");
    await expect(depenses).toBeVisible();
    await expect(page.getByText("Ce qu'il prévoit d'encaisser")).toBeVisible();
    await expect(page.getByText('La différence, appelée solde budgétaire')).toBeVisible();

    // L'intention du projet est exposée, ce que ne faisait aucune page.
    await expect(page.getByRole('heading', { name: /pourquoi cet outil existe/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /d'où viennent les données/i })).toBeVisible();
  });

  test("permet de naviguer vers le tableau de bord depuis l'accueil", async ({ page }) => {
    await mockApi(page);
    await page.goto('/');

    await page.getByRole('link', { name: /ouvrir le tableau de bord/i }).click();

    await expect(page).toHaveURL(/\/tableau-de-bord/);
    // Une fois dans les données, la coque applicative prend le relais.
    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
  });
});
