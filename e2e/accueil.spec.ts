import { expect, test } from '@playwright/test';

import { mockApi } from './helpers/mockApi';

test.describe('Accueil', () => {
  test('affiche les chiffres clés de la dernière année disponible', async ({ page }) => {
    // Evite la dependance aux compteurs animes de Home.tsx (Framer Motion,
    // duree 1.2s) : la valeur finale s'affiche immediatement, comme le fait
    // deja l'application pour `prefers-reduced-motion` (CDC section 6.2).
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mockApi(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      "Le budget de l'État, expliqué simplement",
    );

    const depenses = page.getByText('Dépenses totales (2025)').locator('..');
    await expect(depenses).toContainText('594');
    await expect(depenses).toContainText('Md€');

    const recettes = page.getByText('Recettes totales (2025)').locator('..');
    await expect(recettes).toContainText('453');
    await expect(recettes).toContainText('Md€');

    // `<p>` ne peut pas s'imbriquer en HTML valide : ce filtre cible sans
    // ambiguïté le libellé (contrairement à getByText, qui matcherait le
    // nœud le plus profond incluant le texte caché du tooltip du glossaire).
    const soldeLabel = page.locator('p', { hasText: 'Solde budgétaire' }).first();
    await expect(soldeLabel.locator('..')).toContainText('Md€');

    await expect(page.getByText('/ seconde')).toBeVisible();

    await expect(page.getByRole('main').getByRole('link', { name: 'Tableau de bord' })).toBeVisible();
  });

  test("permet de naviguer vers le tableau de bord depuis l'accueil", async ({ page }) => {
    await mockApi(page);
    await page.goto('/');

    await page.getByRole('main').getByRole('link', { name: 'Tableau de bord' }).click();

    await expect(page).toHaveURL(/\/tableau-de-bord/);
  });
});
