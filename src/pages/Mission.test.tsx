import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { AnneeBudgetDetail, MissionDetail, MissionHistoriqueItem } from '../types/domain';

const detailMock: MissionDetail = {
  id: 1,
  slug: 'defense',
  nomOfficiel: 'Défense',
  annee: 2023,
  montantTotal: 50_000_000_000,
  programmes: [
    {
      id: 10,
      code: '146',
      nom: 'Équipement des forces',
      montantTotal: 20_000_000_000,
      actions: [{ id: 100, code: '146-01', nom: 'Dissuasion', ae: 1000, cp: 900 }],
    },
  ],
};

const historiqueMock: MissionHistoriqueItem[] = [
  { annee: 2022, nomOfficiel: 'Défense (ancien libellé)', montantTotal: 49_600_000_000 },
  { annee: 2023, nomOfficiel: 'Défense', montantTotal: 53_100_000_000 },
];

const budgetAnneeMock: AnneeBudgetDetail = {
  annee: 2023,
  depensesNettes: 100,
  recettesNettes: 90,
  deficit: -10,
  dettePib: 111,
  sourceUrl: 'https://example.org/budget-2023',
};

const useMissionDetailMock = vi.fn();

vi.mock('../hooks/useMissionDetail', () => ({
  useMissionDetail: (...args: unknown[]) => useMissionDetailMock(...args),
}));

vi.mock('../hooks/useMissionHistorique', () => ({
  useMissionHistorique: vi.fn(() => ({ data: historiqueMock })),
}));

vi.mock('../hooks/useBudgetAnnee', () => ({
  useBudgetAnnee: vi.fn(() => ({ data: budgetAnneeMock })),
}));

// eslint-disable-next-line import/first
import Mission from './Mission';

function renderMission(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/tableau-de-bord/mission/${slug}`]}>
      <Routes>
        <Route path="/tableau-de-bord/mission/:slug" element={<Mission />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Mission', () => {
  it('affiche un message de chargement pendant la requête', () => {
    useMissionDetailMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    renderMission('defense');

    expect(screen.getByText(/chargement de la mission/i)).toBeInTheDocument();
  });

  it('affiche un message d’erreur et un lien de retour si la mission est introuvable', () => {
    useMissionDetailMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    renderMission('inconnue');

    expect(screen.getByText(/mission introuvable/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /retour au tableau de bord/i })).toHaveAttribute(
      'href',
      '/tableau-de-bord',
    );
  });

  it('affiche le détail de la mission (programmes, actions, historique des libellés)', () => {
    useMissionDetailMock.mockReturnValue({ data: detailMock, isLoading: false, isError: false });

    renderMission('defense');

    expect(screen.getByRole('heading', { name: 'Défense' })).toBeInTheDocument();
    expect(screen.getByText(/50 Md€ au total/)).toBeInTheDocument();
    expect(screen.getByText('146 — Équipement des forces')).toBeInTheDocument();
    expect(screen.getByText('146-01 — Dissuasion')).toBeInTheDocument();
    expect(screen.getByText('2022 : Défense (ancien libellé)')).toBeInTheDocument();
  });
});
