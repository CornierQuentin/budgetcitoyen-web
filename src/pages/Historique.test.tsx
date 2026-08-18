import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFiltersStore } from '../store/useFiltersStore';
import type { AnneeBudget } from '../types/domain';

const historiqueMock: AnneeBudget[] = [
  { annee: 2021, depensesNettes: 80_000_000_000, recettesNettes: 70_000_000_000, deficit: -10_000_000_000 },
  { annee: 2022, depensesNettes: 90_000_000_000, recettesNettes: 75_000_000_000, deficit: -15_000_000_000 },
  { annee: 2023, depensesNettes: 100_000_000_000, recettesNettes: 90_000_000_000, deficit: -10_000_000_000 },
];

vi.mock('../hooks/useHistorique', () => ({
  useHistorique: vi.fn(() => ({ data: historiqueMock })),
}));

// eslint-disable-next-line import/first
import Historique from './Historique';

function SondeUrl() {
  const location = useLocation();
  return <div data-testid="url-actuelle">{`${location.pathname}${location.search}`}</div>;
}

function renderHistorique(initialPath = '/historique') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/historique" element={<Historique />} />
      </Routes>
      <SondeUrl />
    </MemoryRouter>,
  );
}

describe('Historique', () => {
  beforeEach(() => {
    useFiltersStore.setState({ anneeActive: new Date().getFullYear() });
  });

  it('se recale sur la dernière année disponible et affiche son détail', () => {
    renderHistorique();

    expect(screen.getByRole('heading', { name: 'Historique' })).toBeInTheDocument();
    expect(screen.getByText('Année sélectionnée : 2023')).toBeInTheDocument();
    expect(screen.getByText('Année 2023')).toBeInTheDocument();
    expect(screen.getByText('100 Md€')).toBeInTheDocument();
    expect(screen.getByTestId('url-actuelle')).toHaveTextContent('/historique?annee=2023');
  });

  it("respecte l'année passée dans l'URL au montage", () => {
    renderHistorique('/historique?annee=2021');

    expect(screen.getByText('Année sélectionnée : 2021')).toBeInTheDocument();
    expect(screen.getByText('Année 2021')).toBeInTheDocument();
  });

  it("met à jour l'année sélectionnée (et l'URL) via le curseur", () => {
    renderHistorique();

    fireEvent.change(screen.getByLabelText(/année sélectionnée/i), { target: { value: '2022' } });

    expect(screen.getByText('Année sélectionnée : 2022')).toBeInTheDocument();
    expect(screen.getByTestId('url-actuelle')).toHaveTextContent('/historique?annee=2022');
  });

  it('propose un export CSV', () => {
    renderHistorique();

    expect(screen.getByRole('button', { name: /exporter csv/i })).toBeInTheDocument();
  });
});
