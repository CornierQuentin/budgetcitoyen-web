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
      codeOfficiel: true,
      actionsDetaillees: true,
    },
  ],
};

// Ce que l'ETL produit pour une année Légifrance (2015, 2026) : le code du
// programme est une clé sha256 tronquée, faute de numéro dans l'annexe « État
// B », et l'unique action reprend ce code et ce libellé, faute de granularité
// plus fine.
const detailSourceSansActionsMock: MissionDetail = {
  id: 1,
  slug: 'defense',
  nomOfficiel: 'Défense',
  annee: 2026,
  montantTotal: 66_500_000_000,
  programmes: [
    {
      id: 10,
      code: 'a38da6a8d152d40b',
      nom: 'Équipement des forces',
      montantTotal: 22_800_000_000,
      actions: [
        {
          id: 100,
          code: 'a38da6a8d152d40b',
          nom: 'Équipement des forces',
          ae: 47_130_268_327,
          cp: 22_845_477_309,
        },
      ],
      codeOfficiel: false,
      actionsDetaillees: false,
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

function renderMission(slug: string, recherche = '') {
  return render(
    <MemoryRouter initialEntries={[`/tableau-de-bord/mission/${slug}${recherche}`]}>
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

  it("demande l'année portée par l'URL, et non la dernière disponible", () => {
    useMissionDetailMock.mockReturnValue({ data: detailMock, isLoading: false, isError: false });

    renderMission('defense', '?annee=2023');

    // Le tableau de bord écrit `?annee=` et la conserve en naviguant ici :
    // sans la lire, la page affichait toujours le dernier exercice.
    expect(useMissionDetailMock).toHaveBeenCalledWith('defense', 2023);
  });

  it("n'invente pas d'année quand l'URL n'en porte pas", () => {
    useMissionDetailMock.mockReturnValue({ data: detailMock, isLoading: false, isError: false });

    renderMission('defense');

    // `undefined` laisse l'API choisir la dernière année disponible.
    expect(useMissionDetailMock).toHaveBeenCalledWith('defense', undefined);
  });

  it("n'affiche pas une clé interne comme si c'était un numéro de programme", () => {
    useMissionDetailMock.mockReturnValue({
      data: detailSourceSansActionsMock,
      isLoading: false,
      isError: false,
    });

    renderMission('defense', '?annee=2026');

    expect(screen.getByText('Équipement des forces')).toBeInTheDocument();
    expect(screen.queryByText(/a38da6a8d152d40b/)).not.toBeInTheDocument();
  });

  it("masque le tableau d'actions quand il ne ferait que répéter le programme", () => {
    useMissionDetailMock.mockReturnValue({
      data: detailSourceSansActionsMock,
      isLoading: false,
      isError: false,
    });

    renderMission('defense', '?annee=2026');

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    // Et l'absence est expliquée par la source, une seule fois.
    expect(screen.getByText(/la loi de finances publiée au Journal officiel/i)).toBeInTheDocument();
  });

  it("n'explique rien quand le détail par action existe", () => {
    useMissionDetailMock.mockReturnValue({ data: detailMock, isLoading: false, isError: false });

    renderMission('defense', '?annee=2023');

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(
      screen.queryByText(/la loi de finances publiée au Journal officiel/i),
    ).not.toBeInTheDocument();
  });
});
