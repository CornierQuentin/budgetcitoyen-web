import { describe, expect, it } from 'vitest';

import { topNAvecAutres } from './topNAvecAutres';

describe('topNAvecAutres', () => {
  it('trie et retourne la liste telle quelle quand elle tient déjà dans n éléments', () => {
    const items = [
      { label: 'A', value: 10 },
      { label: 'B', value: 30 },
      { label: 'C', value: 20 },
    ];

    const resultat = topNAvecAutres(items, 5);

    expect(resultat).toEqual([
      { label: 'B', value: 30 },
      { label: 'C', value: 20 },
      { label: 'A', value: 10 },
    ]);
  });

  it("n'ajoute pas d'entrée « Autres » quand la liste compte exactement n éléments", () => {
    const items = [
      { label: 'A', value: 10 },
      { label: 'B', value: 20 },
    ];

    const resultat = topNAvecAutres(items, 2);

    expect(resultat).toHaveLength(2);
    expect(resultat.every((item) => item.details === undefined)).toBe(true);
  });

  it('conserve les n plus gros éléments et cumule le reste dans une entrée « Autres »', () => {
    const items = [
      { label: 'Défense', value: 50 },
      { label: 'Justice', value: 10 },
      { label: 'Culture', value: 5 },
      { label: 'Sport', value: 3 },
    ];

    const resultat = topNAvecAutres(items, 2);

    expect(resultat).toHaveLength(3);
    expect(resultat[0]).toEqual({ label: 'Défense', value: 50 });
    expect(resultat[1]).toEqual({ label: 'Justice', value: 10 });

    const autres = resultat[2];
    expect(autres.label).toBe('Autres');
    expect(autres.value).toBe(8); // 5 + 3
    expect(autres.details).toEqual([
      { label: 'Culture', value: 5 },
      { label: 'Sport', value: 3 },
    ]);
  });

  it('accepte un libellé personnalisé pour la tranche regroupée', () => {
    const items = [
      { label: 'A', value: 3 },
      { label: 'B', value: 2 },
      { label: 'C', value: 1 },
    ];

    const resultat = topNAvecAutres(items, 1, 'Divers');

    expect(resultat[1].label).toBe('Divers');
    expect(resultat[1].value).toBe(3); // 2 + 1
  });

  it('ne modifie pas le tableau reçu en entrée', () => {
    const items = [
      { label: 'A', value: 1 },
      { label: 'B', value: 2 },
    ];
    const copie = items.map((item) => ({ ...item }));

    topNAvecAutres(items, 1);

    expect(items).toEqual(copie);
  });

  it('gère une liste vide sans planter', () => {
    expect(topNAvecAutres([], 8)).toEqual([]);
  });
});
