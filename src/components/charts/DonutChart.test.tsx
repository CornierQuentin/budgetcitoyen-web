import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DonutChart, { type DonutDatum } from './DonutChart';

const data: DonutDatum[] = [
  { label: 'TVA', value: 200_000_000_000 },
  { label: 'IR', value: 90_000_000_000 },
];

// Jeu de données à 9 tranches, pour couvrir le cas « missions » (top-8 +
// Autres) du Dashboard, en plus du cas « recettes » (5 tranches, couvert par
// `data` ci-dessus) — les deux usages réels du composant.
const donneesNeufTranches: DonutDatum[] = [
  { label: 'Solidarité, insertion et égalité des chances', value: 30_000_000_000 },
  { label: 'Enseignement scolaire', value: 28_000_000_000 },
  { label: 'Défense', value: 26_000_000_000 },
  { label: 'Recherche et enseignement supérieur', value: 20_000_000_000 },
  { label: 'Écologie, développement et mobilité durables', value: 18_000_000_000 },
  { label: 'Santé', value: 12_000_000_000 },
  { label: 'Justice', value: 10_000_000_000 },
  { label: 'Culture', value: 8_000_000_000 },
  { label: 'Autres', value: 15_000_000_000 },
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
    // Chaque libellé apparaît deux fois : dans la légende de rappel
    // (couleur + nom) et dans l'étiquette à trait posée à côté de sa
    // tranche (label + valeur formatée).
    expect(screen.getAllByText('TVA')).toHaveLength(2);
    expect(screen.getAllByText('IR')).toHaveLength(2);
  });

  it('relie chaque tranche à son étiquette externe par un trait, avec la valeur formatée', () => {
    const { container } = render(<DonutChart data={data} />);

    // Chaque tranche dessine son propre <g aria-hidden="true"> (trait +
    // point d'ancrage + libellé), cf. commentaire de renderLabelATrait dans
    // DonutChart.tsx : le rendu est stateless, une tranche par groupe, sans
    // élément superflu à filtrer.
    const groupesLabels = container.querySelectorAll('.recharts-pie-labels g[aria-hidden="true"]');
    expect(groupesLabels).toHaveLength(data.length);

    // Un trait (path) et un point d'ancrage (circle) par tranche.
    const traits = container.querySelectorAll('.recharts-pie-labels path');
    const points = container.querySelectorAll('.recharts-pie-labels circle');
    expect(traits).toHaveLength(data.length);
    expect(points).toHaveLength(data.length);

    // Deux lignes de texte par étiquette (libellé, puis valeur formatée).
    const tspans = container.querySelectorAll('.recharts-pie-labels tspan');
    expect(tspans).toHaveLength(data.length * 2);
    expect(screen.getAllByText(/Md€/)).toHaveLength(data.length);
  });

  it('tronque un libellé trop long dans son étiquette à trait, sans toucher à la légende', () => {
    const libelleLong = 'Écologie, développement et mobilité durables';
    const donneesAvecLibelleLong: DonutDatum[] = [
      ...data,
      { label: libelleLong, value: 10_000_000_000 },
    ];

    const { container } = render(<DonutChart data={donneesAvecLibelleLong} />);

    // La légende affiche le libellé complet, intact.
    expect(screen.getByText(libelleLong)).toBeInTheDocument();
    // L'étiquette à trait, elle, est tronquée avec une ellipse — le texte
    // complet ne doit donc apparaître qu'une seule fois (dans la légende).
    expect(screen.getAllByText(libelleLong)).toHaveLength(1);
    const lignesTexte = Array.from(container.querySelectorAll('.recharts-pie-labels tspan'));
    const ligneTronquee = lignesTexte.find((tspan) => tspan.textContent?.endsWith('…'));
    expect(ligneTronquee).toBeDefined();
    expect(ligneTronquee?.textContent?.length).toBeLessThan(libelleLong.length);
  });

  it("recalcule les positions de façon stable même si <Pie> rappelle le label plusieurs fois (navigation clavier)", () => {
    // Régression : une première implémentation accumulait la géométrie de
    // chaque tranche dans un tableau mutable partagé entre tous les appels
    // du callback `label`, sans le réinitialiser — recharts pouvant
    // rappeler ce callback bien plus souvent qu'une fois par tranche : la
    // navigation clavier entre tranches (flèches gauche/droite) est gérée en
    // interne par <Pie> via un `setState` qui lui est propre (assigné
    // directement sur le noeud DOM via `pieRef.onkeydown`, indépendamment de
    // tout re-rendu du composant parent DonutChart) — un simple `rerender`
    // React ne suffit donc pas à reproduire le bug initial ; on simule ici de
    // vrais événements clavier flèche sur le camembert, comme le ferait un
    // utilisateur.
    const { container } = render(<DonutChart data={donneesNeufTranches} />);
    const nbGroupesInitial = container.querySelectorAll(
      '.recharts-pie-labels g[aria-hidden="true"]',
    ).length;
    expect(nbGroupesInitial).toBe(donneesNeufTranches.length);

    const pieRacine = container.querySelector('.recharts-pie');
    expect(pieRacine).not.toBeNull();
    ['ArrowRight', 'ArrowLeft', 'ArrowRight', 'ArrowRight'].forEach((touche) => {
      fireEvent.keyDown(pieRacine as Element, { key: touche });
    });

    const nbGroupesApres = container.querySelectorAll(
      '.recharts-pie-labels g[aria-hidden="true"]',
    ).length;
    expect(nbGroupesApres).toBe(donneesNeufTranches.length);
  });

  it('gère correctement un camembert à 9 tranches (cas « missions » : top-8 + Autres)', () => {
    const { container } = render(<DonutChart data={donneesNeufTranches} />);

    const secteurs = container.querySelectorAll('.recharts-pie-sector path');
    expect(secteurs).toHaveLength(donneesNeufTranches.length);

    const traits = container.querySelectorAll('.recharts-pie-labels path');
    expect(traits).toHaveLength(donneesNeufTranches.length);

    // Une entrée de légende par tranche, dont « Autres ».
    expect(screen.getAllByText('Autres').length).toBeGreaterThanOrEqual(1);
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

    expect(screen.getAllByText('Autres').length).toBeGreaterThan(0);
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
