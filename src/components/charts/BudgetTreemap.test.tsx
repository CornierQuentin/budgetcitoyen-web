import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import BudgetTreemap, { type TreemapDatum } from './BudgetTreemap';

// Montants en euros (comme les données réelles issues de l'API) : formatMd
// les affiche en milliards d'euros.
const data: TreemapDatum[] = [
  { slug: 'defense', nom: 'Défense', montant: 50_000_000_000 },
  { slug: 'enseignement-scolaire', nom: 'Enseignement scolaire', montant: 80_000_000_000 },
  { slug: 'justice', nom: 'Justice', montant: 10_000_000_000 },
];

function renderTreemap() {
  render(
    <MemoryRouter>
      <BudgetTreemap data={data} />
    </MemoryRouter>,
  );
}

describe('BudgetTreemap — repli mobile (CDC 6.2)', () => {
  it('rend le SVG du treemap masqué par défaut sous le breakpoint md (classes `hidden md:block`)', () => {
    renderTreemap();

    const svg = screen.getByRole('img', { name: /répartition des dépenses/i });
    expect(svg).toHaveClass('hidden');
    expect(svg).toHaveClass('md:block');
  });

  it('rend une liste de repli, visible uniquement sous md (`md:hidden`), avec les mêmes données', () => {
    renderTreemap();

    const liste = screen.getByRole('list');
    expect(liste).toHaveClass('md:hidden');

    // Les pavés du SVG portent aussi `role="button"` (cliquables sur
    // desktop) : on scope la recherche à la liste pour ne comparer que son
    // propre contenu.
    const items = within(liste).getAllByRole('button');
    expect(items).toHaveLength(3);
    // Triée par montant décroissant : Enseignement scolaire (80) avant
    // Défense (50) avant Justice (10) — même donnée, même tri que le
    // treemap, juste un affichage en liste.
    expect(items[0]).toHaveAccessibleName('Enseignement scolaire : 80 Md€');
    expect(items[1]).toHaveAccessibleName('Défense : 50 Md€');
    expect(items[2]).toHaveAccessibleName('Justice : 10 Md€');
  });

  it("affiche le message d'absence de données sans planter, sans liste ni SVG", () => {
    render(
      <MemoryRouter>
        <BudgetTreemap data={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/aucune donnée à afficher/i)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
