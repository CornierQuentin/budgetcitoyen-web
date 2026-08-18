import { expect, test } from '@playwright/test';

import { mockApi } from './helpers/mockApi';

test.describe('Comparateur', () => {
  test('compare les deux dernières années par défaut et affiche les écarts', async ({ page }) => {
    await mockApi(page);
    await page.goto('/comparer');

    await expect(page.locator('#annee-a')).toHaveValue('2024');
    await expect(page.locator('#annee-b')).toHaveValue('2025');

    await expect(page.getByRole('cell', { name: 'Cohésion des territoires' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Justice' })).toBeVisible();
    await expect(page.getByText('Écart de dépenses')).toBeVisible();
  });

  test('la recherche filtre le tableau des missions par nom', async ({ page }) => {
    await mockApi(page);
    await page.goto('/comparer');

    await expect(page.getByRole('cell', { name: 'Justice' })).toBeVisible();

    await page.getByLabel('Rechercher une mission').fill('défense');

    await expect(page.getByRole('cell', { name: 'Défense' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Justice' })).not.toBeVisible();
  });

  test('une recherche sans résultat affiche un message explicite', async ({ page }) => {
    await mockApi(page);
    await page.goto('/comparer');

    await page.getByLabel('Rechercher une mission').fill('zzz-mission-inexistante');

    await expect(page.getByText('Aucune mission ne correspond à « zzz-mission-inexistante ».')).toBeVisible();
  });
});
