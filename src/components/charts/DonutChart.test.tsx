import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DonutChart, { type DonutDatum } from './DonutChart';

const data: DonutDatum[] = [
  { label: 'TVA', value: 200_000_000_000 },
  { label: 'IR', value: 90_000_000_000 },
];

// jsdom ne calcule pas de vraie mise en page : getBoundingClientRect renvoie
// 0x0 par défaut, ce qui fait que le ResponsiveContainer de recharts refuse
// de rendre ses enfants (Pie, Legend...). On simule un conteneur non vide,
// comme dans un vrai navigateur.
beforeEach(() => {
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

describe('DonutChart', () => {
  it("affiche le message d'absence de données sans planter, quand data est vide", () => {
    render(<DonutChart data={[]} />);

    expect(screen.getByText(/aucune donnée à afficher/i)).toBeInTheDocument();
  });

  it('se rend sans planter avec des données et propose un export PNG', () => {
    render(<DonutChart data={data} />);

    expect(screen.getByRole('button', { name: /exporter png/i })).toBeInTheDocument();
    // La légende recharts affiche le libellé de chaque part.
    expect(screen.getByText('TVA')).toBeInTheDocument();
    expect(screen.getByText('IR')).toBeInTheDocument();
  });

  it('ne plante pas quand une entrée porte un champ `details` (tranche « Autres » groupée)', () => {
    const dataAvecDetails: DonutDatum[] = [
      ...data,
      {
        label: 'Autres',
        value: 10_000_000_000,
        details: [
          { label: 'Culture', value: 6_000_000_000 },
          { label: 'Sport', value: 4_000_000_000 },
        ],
      },
    ];

    render(<DonutChart data={dataAvecDetails} />);

    expect(screen.getByText('Autres')).toBeInTheDocument();
  });

  it("ne plante pas quand aucun `onSliceClick` n'est fourni (prop optionnelle)", () => {
    expect(() => render(<DonutChart data={data} />)).not.toThrow();
  });

  it('appelle `onSliceClick` avec le libellé de la tranche cliquée', () => {
    const onSliceClick = vi.fn();
    const { container } = render(<DonutChart data={data} onSliceClick={onSliceClick} />);

    // Chaque tranche du camembert est rendue comme un <path> à l'intérieur
    // du groupe recharts dédié aux secteurs.
    const secteurs = container.querySelectorAll('.recharts-pie-sector path');
    expect(secteurs.length).toBeGreaterThan(0);

    fireEvent.click(secteurs[0]);

    expect(onSliceClick).toHaveBeenCalledTimes(1);
    expect(onSliceClick).toHaveBeenCalledWith(expect.stringMatching(/TVA|IR/));
  });

  it("n'appelle pas `onSliceClick` quand aucun callback n'est fourni (pas de crash au clic)", () => {
    const { container } = render(<DonutChart data={data} />);

    const secteurs = container.querySelectorAll('.recharts-pie-sector path');
    expect(() => fireEvent.click(secteurs[0])).not.toThrow();
  });
});
