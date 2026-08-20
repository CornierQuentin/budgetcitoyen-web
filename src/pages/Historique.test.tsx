import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnneeBudget } from '../types/domain';

// `deficit` est une magnitude POSITIVE côté API (le solde budgétaire en est
// l'opposé) : le jeu d'essai respecte cette convention, sous peine de valider
// des repères inversés (pic de déficit, solde affiché).
const historiqueMock: AnneeBudget[] = [
  { annee: 2021, depensesNettes: 80_000_000_000, recettesNettes: 70_000_000_000, deficit: 10_000_000_000 },
  { annee: 2022, depensesNettes: 90_000_000_000, recettesNettes: 75_000_000_000, deficit: 15_000_000_000 },
  { annee: 2023, depensesNettes: 100_000_000_000, recettesNettes: 90_000_000_000, deficit: 10_000_000_000 },
];

vi.mock('../hooks/useHistorique', () => ({
  useHistorique: vi.fn(() => ({ data: historiqueMock })),
}));

// eslint-disable-next-line import/first
import Historique from './Historique';

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
  it('affiche deux graphiques distincts (dépenses/recettes, puis déficit sur sa propre échelle)', () => {
    render(<Historique />);

    expect(screen.getByRole('heading', { name: /historique du budget/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dépenses et recettes nettes' })).toBeInTheDocument();
    // Le nom accessible du second titre inclut aussi la définition du
    // glossaire (portée par le GlossaryTerm imbriqué), d'où le match partiel.
    expect(screen.getByRole('heading', { name: /^Déficit/ })).toBeInTheDocument();

    // Chaque légende recharts est bien limitée à ses propres séries.
    expect(screen.getByText('Dépenses nettes')).toBeInTheDocument();
    expect(screen.getByText('Recettes nettes')).toBeInTheDocument();
  });

  it("ne propose plus de sélecteur d'année (retiré : faisait doublon avec le survol des courbes)", () => {
    render(<Historique />);

    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.queryByText(/année sélectionnée/i)).not.toBeInTheDocument();
  });

  it('propose un export CSV et un export PNG par graphique', () => {
    render(<Historique />);

    expect(screen.getAllByRole('button', { name: /exporter csv/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /exporter png/i })).toHaveLength(2);
  });

  it('affiche des repères calculés sur la période, dont le pic de déficit', () => {
    render(<Historique />);

    expect(screen.getByText(/dépenses depuis 2021/i)).toBeInTheDocument();
    expect(screen.getByText(/recettes depuis 2021/i)).toBeInTheDocument();
    // Déficit cumulé sur les trois exercices : 10 + 15 + 10 = 35 Md€.
    expect(screen.getByText('35 Md€')).toBeInTheDocument();
    // Pic atteint en 2022 (15 Md€), et non à l'exercice le plus récent.
    expect(screen.getByText('en 2022')).toBeInTheDocument();
  });

  it('liste chaque exercice dans un tableau, le plus récent en tête', () => {
    render(<Historique />);

    const lignes = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(lignes).toHaveLength(historiqueMock.length);
    expect(lignes[0]).toHaveTextContent('2023');
    // Le solde est l'opposé du déficit : 10 Md€ de déficit s'affiche −10 Md€.
    expect(lignes[0]).toHaveTextContent('-10 Md€');
    expect(lignes[2]).toHaveTextContent('2021');
  });

  it('restreint la période affichée au clic sur le sélecteur', () => {
    render(<Historique />);

    // Trois exercices seulement dans le jeu d'essai : « 5 ans » et « 10 ans »
    // sont donc désactivés, et « Tout » reste la seule période disponible.
    expect(screen.getByRole('button', { name: '5 ans' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Tout' }));

    expect(within(screen.getByRole('table')).getAllByRole('row').slice(1)).toHaveLength(3);
  });
});
