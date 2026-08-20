import { expect, test } from '@playwright/test';

import { mockApi } from './helpers/mockApi';

// Le montant total apparaît à deux endroits depuis la refonte (la carte de
// synthèse et le titre « Où vont vos … ») : on cible la carte par son libellé
// plutôt que le montant seul, qui ne désigne plus un élément unique.
function carteContributionTotale(page: import('@playwright/test').Page) {
  return page.getByText('Contribution totale estimée').locator('..');
}

test.describe('Mon budget', () => {
  test('affiche une estimation par défaut pour 2000€/mois dès le chargement', async ({ page }) => {
    await mockApi(page);
    await page.goto('/mon-budget');

    await expect(page.getByLabel('Revenu net mensuel (€)')).toHaveValue('2000');
    await expect(page.getByText('Impôt sur le revenu estimé')).toBeVisible();
    await expect(carteContributionTotale(page)).toContainText(/3.?011/);
    await expect(page.getByText('Remboursements et dégrèvements')).toBeVisible();
  });

  test('recalcule la contribution au fil de la saisie, sans bouton à cliquer', async ({ page }) => {
    await mockApi(page);
    await page.goto('/mon-budget');
    await expect(carteContributionTotale(page)).toContainText(/3.?011/);

    // Plus de bouton « Calculer » : le champ pilote directement le calcul,
    // après un court délai anti-rebond que l'attente automatique absorbe.
    await expect(page.getByRole('button', { name: 'Calculer' })).toHaveCount(0);

    await page.getByLabel('Revenu net mensuel (€)').fill('2500');

    await expect(carteContributionTotale(page)).toContainText(/4.?083/);
    await expect(page).toHaveURL(/revenu_net=2500/);
  });
});
