import { describe, expect, it } from 'vitest';

import { urlDocumentationApi } from './urlsApi';

describe('urlDocumentationApi', () => {
  it("repart de l'origine, pas du préfixe versionné", () => {
    // La documentation vit sur /api/docs, en dehors de /api/v1 : concaténer
    // naïvement la base donnerait /api/v1/api/docs, une 404.
    expect(urlDocumentationApi('http://localhost:8001/api/v1')).toBe(
      'http://localhost:8001/api/docs',
    );
  });

  it('fonctionne avec une base de production sur un autre hôte', () => {
    expect(urlDocumentationApi('https://api.budgetcitoyen.fr/api/v1')).toBe(
      'https://api.budgetcitoyen.fr/api/docs',
    );
  });

  it('retombe sur un chemin relatif quand la base est elle-même relative', () => {
    expect(urlDocumentationApi('/api/v1')).toBe('/api/docs');
  });

  it('retombe sur un chemin relatif quand la base est absente', () => {
    // Chaîne vide et non `undefined` : passer `undefined` déclencherait la
    // valeur par défaut du paramètre, donc la variable d'environnement réelle.
    expect(urlDocumentationApi('')).toBe('/api/docs');
  });
});
