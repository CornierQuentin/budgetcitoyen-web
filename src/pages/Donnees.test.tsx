import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AnneeBudget, AnneeBudgetDetail, IndicateurMacro } from '../types/domain';

const anneesMock: AnneeBudget[] = [{ annee: 2023, depensesNettes: 0, recettesNettes: 0, deficit: 0 }];

const budgetMock: AnneeBudgetDetail = {
  annee: 2023,
  depensesNettes: 100,
  recettesNettes: 90,
  deficit: -10,
  dettePib: 111,
  sourceUrl: 'https://example.org/budget-2023',
};

const indicateurMock: IndicateurMacro = {
  annee: 2023,
  pibCourant: 2_800_000_000_000,
  population: 68_000_000,
  sourcePibUrl: 'https://example.org/pib-2023',
  sourcePopulationUrl: 'https://example.org/population-2023',
};

vi.mock('../hooks/useAnnees', () => ({
  useAnnees: vi.fn(() => ({ data: anneesMock })),
}));

vi.mock('../hooks/useBudgetAnnee', () => ({
  useBudgetAnnee: vi.fn(() => ({ data: budgetMock })),
}));

vi.mock('../hooks/useIndicateur', () => ({
  useIndicateur: vi.fn(() => ({ data: indicateurMock })),
}));

// eslint-disable-next-line import/first
import Donnees from './Donnees';

describe('Donnees', () => {
  it('affiche les sources statiques et les sources dynamiques issues des hooks, sans doublon', () => {
    render(<Donnees />);

    expect(screen.getByRole('heading', { name: /Données/ })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'data.gouv.fr' })).toHaveAttribute(
      'href',
      'https://www.data.gouv.fr/',
    );

    const lienBudget = screen.getByRole('link', { name: /loi de finances 2023/i });
    expect(lienBudget).toHaveAttribute('href', 'https://example.org/budget-2023');

    const lienPib = screen.getByRole('link', { name: /PIB 2023/i });
    expect(lienPib).toHaveAttribute('href', 'https://example.org/pib-2023');

    const lienPopulation = screen.getByRole('link', { name: /Population 2023/i });
    expect(lienPopulation).toHaveAttribute('href', 'https://example.org/population-2023');
  });
});
