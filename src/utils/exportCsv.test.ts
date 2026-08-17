import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildCsv, exportCsv } from './exportCsv';

interface LigneTest {
  nom: string;
  montant: number;
  commentaire: string;
}

describe('buildCsv', () => {
  it('retourne une chaîne vide pour un tableau vide', () => {
    expect(buildCsv([])).toBe('');
  });

  it('construit l’en-tête à partir des clés du premier objet quand `colonnes` est omis', () => {
    const csv = buildCsv<LigneTest>([{ nom: 'Défense', montant: 50, commentaire: 'RAS' }]);
    const [entete, ligne] = csv.replace('﻿', '').split('\r\n');

    expect(entete).toBe('nom;montant;commentaire');
    expect(ligne).toBe('Défense;50;RAS');
  });

  it('respecte l’ordre et les libellés explicites de `colonnes`', () => {
    const csv = buildCsv<LigneTest>(
      [{ nom: 'Défense', montant: 50, commentaire: 'RAS' }],
      [
        { cle: 'montant', libelle: 'Montant (Md€)' },
        { cle: 'nom', libelle: 'Mission' },
      ],
    );
    const [entete, ligne] = csv.replace('﻿', '').split('\r\n');

    expect(entete).toBe('Montant (Md€);Mission');
    expect(ligne).toBe('50;Défense');
  });

  it('échappe une valeur contenant le séparateur `;` entre guillemets', () => {
    const csv = buildCsv<LigneTest>([
      { nom: 'Écologie; transition', montant: 10, commentaire: 'RAS' },
    ]);
    const [, ligne] = csv.replace('﻿', '').split('\r\n');

    expect(ligne).toBe('"Écologie; transition";10;RAS');
  });

  it('échappe une valeur contenant des guillemets en les doublant', () => {
    const csv = buildCsv<LigneTest>([
      { nom: 'Mission "spéciale"', montant: 10, commentaire: 'RAS' },
    ]);
    const [, ligne] = csv.replace('﻿', '').split('\r\n');

    expect(ligne).toBe('"Mission ""spéciale""";10;RAS');
  });

  it('échappe une valeur contenant un retour à la ligne', () => {
    const csv = buildCsv<LigneTest>([{ nom: 'Ligne 1\nLigne 2', montant: 10, commentaire: 'RAS' }]);
    const [, ligne] = csv.replace('﻿', '').split('\r\n');

    expect(ligne).toBe('"Ligne 1\nLigne 2";10;RAS');
  });

  it('laisse une valeur `null` ou `undefined` vide sans planter', () => {
    interface LigneOptionnelle {
      nom: string;
      montant: number | null;
    }
    const csv = buildCsv<LigneOptionnelle>([{ nom: 'Justice', montant: null }]);
    const [, ligne] = csv.replace('﻿', '').split('\r\n');

    expect(ligne).toBe('Justice;');
  });

  it('préfixe le contenu par un BOM UTF-8, pour un affichage correct des accents dans Excel', () => {
    const csv = buildCsv<LigneTest>([{ nom: 'Défense', montant: 50, commentaire: 'RAS' }]);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });
});

describe('exportCsv', () => {
  // Le déclenchement réel du téléchargement (Blob, lien <a>, clic
  // programmatique) n'est pas exercé par jsdom : on mocke les APIs DOM
  // utilisées, comme il est d'usage pour tester ce type de fonction sans
  // dépendre du comportement navigateur réel.
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let clickMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURLMock = vi.fn(() => 'blob:mock-url');
    revokeObjectURLMock = vi.fn();
    clickMock = vi.fn();

    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });

    // Intercepte uniquement la création de liens <a> (le lien temporaire du
    // téléchargement) : createElement doit rester fonctionnel pour le reste.
    const createElementOriginal = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = createElementOriginal(tagName);
      if (tagName === 'a') {
        element.click = clickMock;
      }
      return element;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('crée un Blob, déclenche un clic sur un lien de téléchargement, puis révoque l’URL objet', () => {
    exportCsv<LigneTest>([{ nom: 'Défense', montant: 50, commentaire: 'RAS' }], 'missions.csv');

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    const [blobArg] = createObjectURLMock.mock.calls[0] as [Blob];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg.type).toBe('text/csv;charset=utf-8;');

    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
  });

  it('nomme le fichier téléchargé avec le nom fourni', () => {
    exportCsv<LigneTest>([{ nom: 'Défense', montant: 50, commentaire: 'RAS' }], 'missions-2024.csv');

    // Le lien créé porte l'attribut `download` avec le nom demandé : on le
    // retrouve via le mock de createElement (dernier élément 'a' créé).
    const createElementCalls = (document.createElement as ReturnType<typeof vi.fn>).mock.results;
    const lienCree = createElementCalls
      .map((result) => result.value as HTMLElement)
      .find((element) => element.tagName === 'A') as HTMLAnchorElement;

    expect(lienCree.download).toBe('missions-2024.csv');
  });
});
