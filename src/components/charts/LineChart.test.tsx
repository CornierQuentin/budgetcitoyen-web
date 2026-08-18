import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LineChart, { type LineChartDatum } from './LineChart';

const data: LineChartDatum[] = [
  { annee: 2022, depenses: 100_000_000_000, recettes: 90_000_000_000, deficit: -10_000_000_000 },
  { annee: 2023, depenses: 110_000_000_000, recettes: 95_000_000_000, deficit: -15_000_000_000 },
];

// jsdom ne calcule pas de vraie mise en page : getBoundingClientRect renvoie
// 0x0 par défaut, ce qui fait que le ResponsiveContainer de recharts refuse
// de rendre ses enfants (Line, Legend...). On simule un conteneur non vide,
// comme dans un vrai navigateur.
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LineChart', () => {
  it("affiche le message d'absence de données sans planter, quand data est vide", () => {
    render(<LineChart data={[]} />);

    expect(screen.getByText(/aucune donnée à afficher/i)).toBeInTheDocument();
  });

  it('se rend sans planter avec des données et propose un export PNG', () => {
    render(<LineChart data={data} />);

    expect(screen.getByRole('button', { name: /exporter png/i })).toBeInTheDocument();
    // La légende recharts affiche le nom de chaque série.
    expect(screen.getByText('Dépenses nettes')).toBeInTheDocument();
    expect(screen.getByText('Recettes nettes')).toBeInTheDocument();
    expect(screen.getByText('Déficit')).toBeInTheDocument();
  });
});
