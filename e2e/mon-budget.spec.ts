import { expect, test } from '@playwright/test';

import { mockApi } from './helpers/mockApi';

test.describe('Mon budget', () => {
  test('affiche une estimation par défaut pour 2000€/mois dès le chargement', async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto('/mon-budget');

    await expect(page.getByLabel('Revenu net mensuel (€)')).toHaveValue('2000');
    await expect(page.getByText('Impôt sur le revenu estimé')).toBeVisible();
    await expect(page.getByText(/3.?011/)).toBeVisible();
    await expect(page.getByText('Remboursements et dégrèvements')).toBeVisible();
  });

  test('recalcule la contribution après saisie et soumission d\'un nouveau revenu', async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto('/mon-budget');
    await expect(page.getByText(/3.?011/)).toBeVisible();

    await page.getByLabel('Revenu net mensuel (€)').fill('2500');
    await page.getByRole('button', { name: 'Calculer' }).click();

    await expect(page.getByText(/4.?083/)).toBeVisible();
    await expect(page).toHaveURL(/revenu_net=2500/);
  });
});
