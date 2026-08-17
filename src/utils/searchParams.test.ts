import { describe, expect, it } from 'vitest';

import { parseIntSearchParam } from './searchParams';

describe('parseIntSearchParam', () => {
  it('retourne `undefined` quand le paramètre est absent (`null`)', () => {
    // Régression : `Number(null) === 0` (une valeur finie) — sans le test
    // explicite `raw === null`, un paramètre absent serait lu comme
    // l'année/le montant 0 au lieu d'« aucune valeur ».
    expect(parseIntSearchParam(null)).toBeUndefined();
  });

  it('retourne `undefined` pour une valeur non numérique', () => {
    expect(parseIntSearchParam('abc')).toBeUndefined();
  });

  it('retourne le nombre pour une valeur numérique valide, y compris 0', () => {
    expect(parseIntSearchParam('2024')).toBe(2024);
    expect(parseIntSearchParam('0')).toBe(0);
  });
});
