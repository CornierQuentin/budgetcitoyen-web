import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnneeBudget, Mission, MissionHistoriqueItem } from '../types/domain';

// `deficit` est une magnitude POSITIVE côté API (le solde budgétaire en est
// l'opposé) : le jeu d'essai respecte cette convention, sous peine de valider
// des repères inversés (pic de déficit, solde affiché).
const historiqueMock: AnneeBudget[] = [
  {
    annee: 2021,
    depensesNettes: 80_000_000_000,
    recettesNettes: 70_000_000_000,
    deficit: 10_000_000_000,
  },
  {
    annee: 2022,
    depensesNettes: 90_000_000_000,
    recettesNettes: 75_000_000_000,
    deficit: 15_000_000_000,
  },
  {
    annee: 2023,
    depensesNettes: 100_000_000_000,
    recettesNettes: 90_000_000_000,
    deficit: 10_000_000_000,
  },
];

// Deux missions sur trois exercices : Défense présente partout, Culture
// absente de 2021 — un trou de série, exactement le cas que le graphique doit
// représenter sans le combler.
const missionsMock: Mission[] = [
  {
    id: 1,
    slug: 'defense',
    nomNormalise: 'defense',
    nomOfficiel: 'Défense',
    annee: 2021,
    montantTotal: 47_000_000_000,
  },
  {
    id: 2,
    slug: 'defense',
    nomNormalise: 'defense',
    nomOfficiel: 'Défense',
    annee: 2022,
    montantTotal: 49_000_000_000,
  },
  {
    id: 3,
    slug: 'defense',
    nomNormalise: 'defense',
    nomOfficiel: 'Défense',
    annee: 2023,
    montantTotal: 53_000_000_000,
  },
  {
    id: 4,
    slug: 'culture',
    nomNormalise: 'culture',
    nomOfficiel: 'Culture',
    annee: 2022,
    montantTotal: 3_000_000_000,
  },
  {
    id: 5,
    slug: 'culture',
    nomNormalise: 'culture',
    nomOfficiel: 'Culture',
    annee: 2023,
    montantTotal: 4_000_000_000,
  },
];

const missionHistoriqueMock: MissionHistoriqueItem[] = [
  { annee: 2021, nomOfficiel: 'Défense', montantTotal: 47_000_000_000 },
  { annee: 2022, nomOfficiel: 'Défense', montantTotal: 49_000_000_000 },
  { annee: 2023, nomOfficiel: 'Défense', montantTotal: 53_000_000_000 },
];

vi.mock('../hooks/useHistorique', () => ({
  useHistorique: vi.fn(() => ({ data: historiqueMock })),
}));

vi.mock('../hooks/useMissions', () => ({
  useMissions: vi.fn(() => ({ data: missionsMock })),
}));

vi.mock('../hooks/useMissionHistorique', () => ({
  useMissionHistorique: vi.fn(() => ({ data: missionHistoriqueMock })),
}));

// eslint-disable-next-line import/first
import Historique from './Historique';

function renderHistorique(initialEntries: string[] = ['/historique']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Historique />
    </MemoryRouter>,
  );
}

// jsdom ne calcule pas de vraie mise en page : getBoundingClientRect renvoie
// 0x0 par défaut, ce qui fait que le ResponsiveContainer de recharts refuse
// de rendre ses enfants (Line, Legend...). On simule un conteneur non vide,
// comme dans un vrai navigateur (cf. LineChart.test.tsx).
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 600,
    height: 300,
    top: 0,
    left: 0,
    right: 600,
    bottom: 300,
    x: 0,
    y: 0,
    toJSON: () => {},
  } as DOMRect);
});

describe('Historique', () => {
  it('affiche deux graphiques distincts (dépenses/recettes, puis solde sur sa propre échelle)', () => {
    renderHistorique();

    expect(screen.getByRole('heading', { name: /historique du budget/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Dépenses et recettes nettes' }),
    ).toBeInTheDocument();
    // Le nom accessible du second titre inclut aussi la définition du
    // glossaire (portée par le GlossaryTerm imbriqué), d'où le match partiel.
    expect(screen.getByRole('heading', { name: 'Solde budgétaire' })).toBeInTheDocument();

    // Chaque légende recharts est bien limitée à ses propres séries.
    expect(screen.getByText('Dépenses nettes')).toBeInTheDocument();
    expect(screen.getByText('Recettes nettes')).toBeInTheDocument();
  });

  it("ne propose plus de sélecteur d'année (retiré : faisait doublon avec le survol des courbes)", () => {
    renderHistorique();

    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.queryByText(/année sélectionnée/i)).not.toBeInTheDocument();
  });

  it('propose un export CSV et un export PNG par graphique', () => {
    renderHistorique();

    expect(screen.getAllByRole('button', { name: /exporter csv/i }).length).toBeGreaterThan(0);
    // Trois graphiques désormais : dépenses/recettes, solde, et l'évolution
    // de la mission choisie.
    expect(screen.getAllByRole('button', { name: /exporter png/i })).toHaveLength(3);
  });

  it("trace l'évolution de la mission la plus dotée du dernier exercice par défaut", () => {
    renderHistorique();

    expect(screen.getByRole('heading', { name: "Évolution d'une dépense" })).toBeInTheDocument();

    // Défense (53 Md€ en 2023) plutôt que Culture (4 Md€) : le choix par
    // défaut est la courbe la plus parlante, jamais le premier de la liste.
    expect(screen.getByLabelText('Mission')).toHaveValue('defense');
    expect(screen.getByText(/Défense — 3 exercices de 2021 à 2023/)).toBeInTheDocument();
  });

  it('propose toutes les missions ayant existé, pas seulement celles du dernier exercice', () => {
    renderHistorique();

    const options = within(screen.getByLabelText('Mission')).getAllByRole('option');
    // Dédoublonnées par slug malgré une entrée par année dans la source.
    expect(options.map((option) => option.textContent)).toEqual(['Culture', 'Défense']);
  });

  it("restitue la mission passée dans l'URL, et écrit celle qu'on choisit", () => {
    renderHistorique(['/historique?mission=culture']);

    expect(screen.getByLabelText('Mission')).toHaveValue('culture');

    fireEvent.change(screen.getByLabelText('Mission'), { target: { value: 'defense' } });

    expect(screen.getByLabelText('Mission')).toHaveValue('defense');
  });

  it("donne l'évolution de la mission sur la période affichée", () => {
    renderHistorique();

    // 47 Md€ en 2021 -> 53 Md€ en 2023, soit +12,8 %. L'espace avant le « % »
    // est une espace insécable étroite posée par Intl fr-FR, d'où le `.`.
    expect(screen.getByText(/2021 → 2023 : \+12,8.%/)).toBeInTheDocument();
  });

  it('affiche des repères calculés sur la période, dont le pic de déficit', () => {
    renderHistorique();

    expect(screen.getByText(/dépenses depuis 2021/i)).toBeInTheDocument();
    expect(screen.getByText(/recettes depuis 2021/i)).toBeInTheDocument();
    // Solde cumulé sur les trois exercices : -(10 + 15 + 10) = -35 Md€.
    expect(screen.getByText('-35 Md€')).toBeInTheDocument();
    // Solde le plus bas atteint en 2022, et non à l'exercice le plus récent.
    expect(screen.getByText('en 2022')).toBeInTheDocument();
  });

  it('liste chaque exercice dans un tableau, le plus récent en tête', () => {
    renderHistorique();

    const lignes = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(lignes).toHaveLength(historiqueMock.length);
    expect(lignes[0]).toHaveTextContent('2023');
    // Le solde est l'opposé du déficit : 10 Md€ de déficit s'affiche −10 Md€.
    expect(lignes[0]).toHaveTextContent('-10 Md€');
    expect(lignes[2]).toHaveTextContent('2021');
  });

  it('restreint la période affichée au clic sur le sélecteur', () => {
    renderHistorique();

    // Trois exercices seulement dans le jeu d'essai : « 5 ans » et « 10 ans »
    // sont donc désactivés, et « Tout » reste la seule période disponible.
    expect(screen.getByRole('button', { name: '5 ans' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Tout' }));

    expect(within(screen.getByRole('table')).getAllByRole('row').slice(1)).toHaveLength(3);
  });
});
