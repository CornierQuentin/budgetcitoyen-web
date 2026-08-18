import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFiltersStore } from '../store/useFiltersStore';
import type { AnneeBudget, AnneeBudgetDetail, Mission, Recette } from '../types/domain';

const anneesMock: AnneeBudget[] = [
  { annee: 2022, depensesNettes: 0, recettesNettes: 0, deficit: 0 },
  { annee: 2023, depensesNettes: 0, recettesNettes: 0, deficit: 0 },
];

const missionsMock: Mission[] = [
  {
    id: 1,
    slug: 'defense',
    nomNormalise: 'defense',
    nomOfficiel: 'Défense',
    annee: 2023,
    montantTotal: 50_000_000_000,
  },
  {
    id: 2,
    slug: 'justice',
    nomNormalise: 'justice',
    nomOfficiel: 'Justice',
    annee: 2023,
    montantTotal: 10_000_000_000,
  },
];

const recettesMock: Recette[] = [
  { annee: 2023, type: 'TVA', montantBrut: 200, montantNet: 190 },
];

const budgetAnneeMock: AnneeBudgetDetail = {
  annee: 2023,
  depensesNettes: 60_000_000_000,
  recettesNettes: 190,
  deficit: -1,
  dettePib: 111,
  sourceUrl: 'https://example.org/budget-2023',
};

vi.mock('../hooks/useAnnees', () => ({
  useAnnees: vi.fn(() => ({ data: anneesMock })),
}));

vi.mock('../hooks/useMissions', () => ({
  useMissions: vi.fn(() => ({ data: missionsMock })),
}));

vi.mock('../hooks/useRecettes', () => ({
  useRecettes: vi.fn(() => ({ data: recettesMock })),
}));

vi.mock('../hooks/useBudgetAnnee', () => ({
  useBudgetAnnee: vi.fn(() => ({ data: budgetAnneeMock })),
}));

// eslint-disable-next-line import/first
import Dashboard from './Dashboard';

function SondeUrl() {
  const location = useLocation();
  return <div data-testid="url-actuelle">{`${location.pathname}${location.search}`}</div>;
}

function renderDashboard(initialPath = '/tableau-de-bord') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/tableau-de-bord" element={<Dashboard />} />
      </Routes>
      <SondeUrl />
    </MemoryRouter>,
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    useFiltersStore.setState({ anneeActive: new Date().getFullYear() });
  });

  it('affiche le titre, les missions par dépense et se recale sur la dernière année disponible', () => {
    renderDashboard();

    expect(screen.getByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument();
    // "Défense"/"Justice" apparaissent à la fois dans le SVG du treemap et
    // dans sa liste de repli mobile (toujours présente dans le DOM, visible
    // uniquement sous md via CSS) : on vérifie juste leur présence.
    expect(screen.getAllByText('Défense').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Justice').length).toBeGreaterThan(0);
    expect(screen.getByTestId('url-actuelle')).toHaveTextContent('/tableau-de-bord?annee=2023');
  });

  it('met à jour l’année sélectionnée (et l’URL) quand l’utilisateur change le sélecteur', () => {
    renderDashboard();

    fireEvent.change(screen.getByLabelText(/^Année$/), { target: { value: '2022' } });

    expect(screen.getByTestId('url-actuelle')).toHaveTextContent('/tableau-de-bord?annee=2022');
  });

  it('propose un export CSV des missions affichées', () => {
    renderDashboard();

    expect(screen.getAllByRole('button', { name: /exporter csv/i }).length).toBeGreaterThan(0);
  });
});
