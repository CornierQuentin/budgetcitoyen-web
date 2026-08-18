import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { AnneeBudget, AnneeBudgetDetail, IndicateurMacro } from '../types/domain';

const anneesMock: AnneeBudget[] = [
  { annee: 2022, depensesNettes: 0, recettesNettes: 0, deficit: 0 },
  { annee: 2023, depensesNettes: 0, recettesNettes: 0, deficit: 0 },
];

const budgetMock: AnneeBudgetDetail = {
  annee: 2023,
  depensesNettes: 100_000_000_000,
  recettesNettes: 90_000_000_000,
  deficit: -10_000_000_000,
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
import Home from './Home';

beforeAll(() => {
  // Court-circuite l'animation de compteur (framer-motion) : sans cela,
  // AnimatedValue démarre à 0 et anime sur 1.2s, ce qui rendrait la valeur
  // finale non immédiatement disponible dans le test.
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  }));
});

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

describe('Home', () => {
  it('affiche le titre et les chiffres clés de la dernière année disponible', () => {
    renderHome();

    expect(
      screen.getByRole('heading', { name: /le budget de l'État, expliqué simplement/i }),
    ).toBeInTheDocument();

    expect(screen.getByText('100 Md€')).toBeInTheDocument(); // dépenses
    expect(screen.getByText('90 Md€')).toBeInTheDocument(); // recettes
    // Solde affiché = -déficit ; déficit = -10 Md€, donc solde = 10 Md€.
    expect(screen.getByText('10 Md€')).toBeInTheDocument();
  });

  it('affiche des liens de navigation vers les autres pages', () => {
    renderHome();

    expect(screen.getByRole('link', { name: 'Tableau de bord' })).toHaveAttribute(
      'href',
      '/tableau-de-bord',
    );
    expect(screen.getByRole('link', { name: 'Comparateur' })).toHaveAttribute('href', '/comparer');
    expect(screen.getByRole('link', { name: 'Mon budget' })).toHaveAttribute(
      'href',
      '/mon-budget',
    );
  });
});
