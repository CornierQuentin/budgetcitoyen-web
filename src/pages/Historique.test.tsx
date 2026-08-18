import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  it("affiche deux graphiques distincts (dépenses/recettes, puis déficit sur sa propre échelle)", () => {
    render(<Historique />);

    expect(screen.getByRole('heading', { name: 'Historique' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dépenses et recettes nettes' })).toBeInTheDocument();
    // Le nom accessible du second titre inclut aussi la définition du
    // glossaire (portée par le GlossaryTerm imbriqué), d'où le match partiel.
    expect(screen.getByRole('heading', { name: /^Déficit/ })).toBeInTheDocument();

    // Le graphique dépenses/recettes ne trace pas le déficit, et
    // inversement : chaque légende recharts est bien limitée à ses propres
    // séries (vérifie que series= est correctement cloisonné entre les deux
    // instances de LineChart).
    expect(screen.getByText('Dépenses nettes')).toBeInTheDocument();
    expect(screen.getByText('Recettes nettes')).toBeInTheDocument();
    // Le titre de section (bouton GlossaryTerm) et la légende du graphique
    // affichent tous deux le texte exact « Déficit ».
    expect(screen.getAllByText('Déficit')).toHaveLength(2);
  });

  it("ne propose plus de sélecteur d'année (retiré : faisait doublon avec le survol des courbes)", () => {
    render(<Historique />);

    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.queryByText(/année sélectionnée/i)).not.toBeInTheDocument();
  });

  it('propose un export CSV et un export PNG par graphique', () => {
    render(<Historique />);

    expect(screen.getByRole('button', { name: /exporter csv/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /exporter png/i })).toHaveLength(2);
  });
});
