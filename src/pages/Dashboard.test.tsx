import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  { annee: 2023, type: 'IR', montantBrut: 100, montantNet: 95 },
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
        <Route path="/tableau-de-bord/mission/:slug" element={<div>Page mission</div>} />
      </Routes>
      <SondeUrl />
    </MemoryRouter>,
  );
}

describe('Dashboard', () => {
  // jsdom ne calcule pas de vraie mise en page : getBoundingClientRect
  // renvoie 0x0 par défaut, ce qui fait que le ResponsiveContainer de
  // recharts (utilisé par les deux camemberts) refuse de rendre ses enfants
  // (Pie, Legend...). On simule un conteneur non vide, comme dans un vrai
  // navigateur (même pattern que DonutChart.test.tsx).
  beforeEach(() => {
    useFiltersStore.setState({ anneeActive: new Date().getFullYear() });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    } as DOMRect);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('affiche le titre, les missions par dépense et se recale sur la dernière année disponible', () => {
    renderDashboard();

    expect(screen.getByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument();
    // "Défense"/"Justice" apparaissent dans la légende du camembert des
    // missions (recharts <Legend>).
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

  it('navigue vers la page de la mission cliquée dans le camembert des missions', () => {
    const { container } = renderDashboard();

    const secteurs = container.querySelectorAll('.recharts-pie-sector path');
    expect(secteurs.length).toBeGreaterThan(0);

    fireEvent.click(secteurs[0]);

    expect(screen.getByText('Page mission')).toBeInTheDocument();
  });

  it('affiche un rappel des sigles de recettes (IR, TVA, IS, TICPE, AUTRES) avec leur définition', () => {
    renderDashboard();

    // Un seul <GlossaryTerm> par sigle est affiché en rappel au-dessus du
    // camembert des recettes (la légende recharts en affiche aussi, d'où le
    // `getAllByText`).
    expect(screen.getAllByText('IR').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TVA').length).toBeGreaterThan(0);
    expect(screen.getByText('IS')).toBeInTheDocument();
    expect(screen.getByText('TICPE')).toBeInTheDocument();
    expect(screen.getByText('AUTRES')).toBeInTheDocument();
  });
});
