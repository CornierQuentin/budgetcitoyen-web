import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type {
  AnneeBudget,
  AnneeBudgetDetail,
  Comparateur,
  MarchesPage,
  Mission,
} from '../types/domain';

const anneesMock: AnneeBudget[] = [
  { annee: 2022, depensesNettes: 0, recettesNettes: 0, deficit: 0 },
  { annee: 2023, depensesNettes: 0, recettesNettes: 0, deficit: 0 },
];

// `deficit` est une magnitude POSITIVE côté API : le solde en est l'opposé.
const budgets: Record<number, AnneeBudgetDetail> = {
  2023: {
    annee: 2023,
    depensesNettes: 100_000_000_000,
    recettesNettes: 90_000_000_000,
    deficit: 10_000_000_000,
    dettePib: 111,
    sourceUrl: 'https://example.org/budget-2023',
  },
  2022: {
    annee: 2022,
    depensesNettes: 95_000_000_000,
    recettesNettes: 85_000_000_000,
    deficit: 10_000_000_000,
    dettePib: 110,
    sourceUrl: 'https://example.org/budget-2022',
  },
};

const missionsMock: Mission[] = [
  {
    id: 1,
    slug: 'defense',
    nomNormalise: 'defense',
    nomOfficiel: 'Défense',
    annee: 2023,
    montantTotal: 60_000_000_000,
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

const historiqueMock: AnneeBudget[] = [
  { annee: 2022, depensesNettes: 95_000_000_000, recettesNettes: 85_000_000_000, deficit: 15_000_000_000 },
  { annee: 2023, depensesNettes: 100_000_000_000, recettesNettes: 90_000_000_000, deficit: 10_000_000_000 },
];

const comparaisonMock = {
  anneeA: budgets[2022],
  anneeB: budgets[2023],
  ecartDepenses: 5_000_000_000,
  ecartRecettes: 5_000_000_000,
  ecartDeficit: 0,
  missions: [
    {
      slug: 'defense',
      nom: 'Défense',
      montantA: 55_000_000_000,
      montantB: 60_000_000_000,
      deltaAbsolu: 5_000_000_000,
      deltaRelatifPct: 9.1,
    },
    {
      slug: 'justice',
      nom: 'Justice',
      montantA: 12_000_000_000,
      montantB: 10_000_000_000,
      deltaAbsolu: -2_000_000_000,
      deltaRelatifPct: -16.7,
    },
  ],
  recettes: [],
} as unknown as Comparateur;

const marchesMock: MarchesPage = {
  items: [
    {
      id: 1,
      marcheIdSource: 'A1',
      nature: 'Marché',
      objet: 'Travaux de voirie communale',
      codecpv: '45000000-7',
      codecpvDivision: '45',
      procedure: null,
      acheteurSiret: '12345678900011',
      titulaireSiret: '98765432100022',
      titulaireIdType: 'SIRET',
      dureemois: null,
      datenotification: '2024-01-10',
      datepublicationdonnees: null,
      montant: 120_000,
      formeprix: null,
      offresrecues: null,
      marcheinnovant: null,
    },
  ],
  total: 689_062,
  page: 1,
  pageSize: 3,
  totalPages: 229_688,
};

vi.mock('../hooks/useAnnees', () => ({
  useAnnees: vi.fn(() => ({ data: anneesMock })),
}));

vi.mock('../hooks/useBudgetAnnee', () => ({
  useBudgetAnnee: vi.fn((annee?: number) => ({
    data: annee !== undefined ? budgets[annee] : undefined,
  })),
}));

vi.mock('../hooks/useMissions', () => ({
  useMissions: vi.fn(() => ({ data: missionsMock })),
}));

vi.mock('../hooks/useHistorique', () => ({
  useHistorique: vi.fn(() => ({ data: historiqueMock })),
}));

vi.mock('../hooks/useComparateur', () => ({
  useComparateur: vi.fn(() => ({ data: comparaisonMock })),
}));

vi.mock('../hooks/useMarches', () => ({
  useMarches: vi.fn(() => ({ data: marchesMock })),
}));

// eslint-disable-next-line import/first
import Home from './Home';

beforeAll(() => {
  // Court-circuite l'animation de compteur (framer-motion) : sans cela,
  // AnimatedValue démarre à 0 et anime sur 1,2 s, la valeur finale n'étant
  // donc pas immédiatement lisible dans le test.
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
  it("ouvre sur une affirmation, pas sur un tableau de bord", () => {
    renderHome();

    expect(
      screen.getByRole('heading', { level: 1, name: /le budget de l'État, enfin lisible/i }),
    ).toBeInTheDocument();
  });

  it('affiche les trois chiffres clés de la dernière année, commentés', () => {
    renderHome();

    // Dépenses et recettes apparaissent aussi dans l'aperçu produit, d'où le
    // `getAllByText`.
    expect(screen.getAllByText('100 Md€').length).toBeGreaterThan(0);
    expect(screen.getAllByText('90 Md€').length).toBeGreaterThan(0);
    // Solde = -déficit : 10 Md€ de déficit s'affiche -10 Md€.
    expect(screen.getAllByText('-10 Md€').length).toBeGreaterThan(0);
  });

  it("explique le solde par un ratio à deux décimales, jamais arrondi à l'euro", () => {
    renderHome();

    // 100 / 90 = 1,11 : arrondi à l'entier, ce ratio dirait « 1 € pour chaque
    // euro encaissé », c'est-à-dire l'inverse du propos.
    expect(screen.getByText(/1,11\s*€ pour chaque euro/)).toBeInTheDocument();
  });

  it("situe le solde le plus bas sur l'historique disponible", () => {
    renderHome();

    // Pic de déficit en 2022 (15 Md€), pas à l'exercice le plus récent.
    expect(screen.getByText(/atteint en\s*2022/)).toBeInTheDocument();
  });

  it('présente les quatre façons d’entrer dans le budget', () => {
    renderHome();

    expect(screen.getByRole('link', { name: /ouvrir le tableau de bord/i })).toHaveAttribute(
      'href',
      '/tableau-de-bord',
    );
    expect(screen.getByRole('link', { name: /ouvrir le comparateur/i })).toHaveAttribute(
      'href',
      '/comparer',
    );
    expect(screen.getByRole('link', { name: /ouvrir le simulateur/i })).toHaveAttribute(
      'href',
      '/simulateur',
    );
    expect(screen.getByRole('link', { name: /ouvrir la recherche/i })).toHaveAttribute(
      'href',
      '/marches-publics',
    );
  });

  it("expose l'intention du projet et l'origine des données", () => {
    renderHome();

    expect(
      screen.getByRole('heading', { name: /pourquoi cet outil existe/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/neutralité politique absolue/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /d'où viennent les données/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voir toutes les sources/i })).toHaveAttribute(
      'href',
      '/donnees',
    );
  });
});
