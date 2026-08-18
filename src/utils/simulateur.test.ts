import { describe, expect, it } from 'vitest';

import { montantAjuste, simuler, sommeDesDeltas } from './simulateur';

describe('montantAjuste', () => {
  it('retourne le montant inchangé pour un ajustement à 0%', () => {
    expect(montantAjuste({ cle: 'x', montantActuel: 1000, ajustementPct: 0 })).toBe(1000);
  });

  it('applique une hausse en pourcentage', () => {
    expect(montantAjuste({ cle: 'x', montantActuel: 1000, ajustementPct: 10 })).toBe(1100);
  });

  it('applique une baisse en pourcentage', () => {
    expect(montantAjuste({ cle: 'x', montantActuel: 1000, ajustementPct: -50 })).toBe(500);
  });
});

describe('sommeDesDeltas', () => {
  it('retourne 0 pour une liste vide', () => {
    expect(sommeDesDeltas([])).toBe(0);
  });

  it("retourne 0 quand aucune ligne n'est ajustée", () => {
    const lignes = [
      { cle: 'a', montantActuel: 1000, ajustementPct: 0 },
      { cle: 'b', montantActuel: 2000, ajustementPct: 0 },
    ];
    expect(sommeDesDeltas(lignes)).toBe(0);
  });

  it('additionne les écarts positifs et négatifs de plusieurs lignes', () => {
    const lignes = [
      { cle: 'a', montantActuel: 1000, ajustementPct: 10 }, // +100
      { cle: 'b', montantActuel: 2000, ajustementPct: -25 }, // -500
    ];
    expect(sommeDesDeltas(lignes)).toBe(-400);
  });
});

describe('simuler', () => {
  it('curseurs à 0% : le déficit simulé est identique à la référence officielle', () => {
    const missions = [
      { cle: 'justice', montantActuel: 10_000_000_000, ajustementPct: 0 },
      { cle: 'defense', montantActuel: 60_000_000_000, ajustementPct: 0 },
    ];
    const recettes = [{ cle: 'IR', montantActuel: 90_000_000_000, ajustementPct: 0 }];

    const resultat = simuler(594_000_000_000, 453_000_000_000, 140_000_000_000, missions, recettes);

    expect(resultat.deficitAjuste).toBe(140_000_000_000);
    expect(resultat.depensesAjustees).toBe(594_000_000_000);
    expect(resultat.recettesAjustees).toBe(453_000_000_000);
  });

  // toBeCloseTo (pas toBe) : ces assertions portent sur le résultat d'une
  // multiplication en virgule flottante (ex. 60e9 * 1.1), pas sur une
  // addition/soustraction exacte comme le cas « 0% » ci-dessus - un écart de
  // l'ordre du millionième d'euro (sans consequence, jamais affiché à ce
  // niveau de précision par `formatMd`) ferait sinon échouer `toBe`.
  it('une hausse de dépenses augmente le déficit du même montant', () => {
    const missions = [{ cle: 'defense', montantActuel: 60_000_000_000, ajustementPct: 10 }]; // +6 Md€
    const resultat = simuler(594_000_000_000, 453_000_000_000, 140_000_000_000, missions, []);

    expect(resultat.deltaDepenses).toBeCloseTo(6_000_000_000, 0);
    expect(resultat.deficitAjuste).toBeCloseTo(146_000_000_000, 0);
  });

  it('une hausse de recettes réduit le déficit du même montant (mode avancé)', () => {
    const recettes = [{ cle: 'TVA', montantActuel: 100_000_000_000, ajustementPct: 5 }]; // +5 Md€
    const resultat = simuler(594_000_000_000, 453_000_000_000, 140_000_000_000, [], recettes);

    expect(resultat.deltaRecettes).toBeCloseTo(5_000_000_000, 0);
    expect(resultat.deficitAjuste).toBeCloseTo(135_000_000_000, 0);
  });

  it('combine des ajustements de dépenses et de recettes', () => {
    const missions = [{ cle: 'defense', montantActuel: 60_000_000_000, ajustementPct: 10 }]; // +6 Md€
    const recettes = [{ cle: 'TVA', montantActuel: 100_000_000_000, ajustementPct: 5 }]; // +5 Md€
    const resultat = simuler(594_000_000_000, 453_000_000_000, 140_000_000_000, missions, recettes);

    expect(resultat.deficitAjuste).toBeCloseTo(141_000_000_000, 0); // +6 (dépenses) - 5 (recettes)
  });
});
