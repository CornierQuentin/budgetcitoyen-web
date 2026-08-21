import { describe, expect, it } from 'vitest';

import { rampeSequentielle } from './rampeSequentielle';

describe('rampeSequentielle', () => {
  it('reprend exactement les extrémités des maquettes en thème clair', () => {
    const rampe = rampeSequentielle(6, false);

    expect(rampe).toHaveLength(6);
    expect(rampe[0]).toBe('#16326b');
    expect(rampe[5]).toBe('#dbe4f3');
  });

  it('inverse le sens de la rampe en thème sombre', () => {
    const rampe = rampeSequentielle(6, true);

    expect(rampe[0]).toBe('#b9caea');
    expect(rampe[5]).toBe('#1a2b4d');
  });

  it('ne répète jamais une couleur, même au-delà des six paliers des maquettes', () => {
    // Les marchés publics affichent jusqu'à dix tranches : recycler six
    // couleurs en boucle donnerait deux tranches strictement identiques, ce
    // qui casserait la lecture ordonnée que la rampe doit porter.
    const rampe = rampeSequentielle(10, false);

    expect(rampe).toHaveLength(10);
    expect(new Set(rampe).size).toBe(10);
  });

  it("attribue l'extrémité la plus soutenue à une tranche unique", () => {
    expect(rampeSequentielle(1, false)).toEqual(['#16326b']);
  });

  it('renvoie une rampe vide pour une répartition vide', () => {
    expect(rampeSequentielle(0, false)).toEqual([]);
  });
});
