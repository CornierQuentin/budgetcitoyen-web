// Export CSV générique (CDC 6.2 : « toute donnée en CSV »). Implémentation
// maison volontaire (pas de dépendance externe) : le format visé est simple
// (tableau d'objets plats déjà en mémoire côté client), et une librairie
// n'apporterait rien de plus que l'échappement RFC 4180 ci-dessous.

import { downloadBlob } from './download';

const SEPARATEUR = ';'; // Excel FR ouvre correctement un CSV `;` sans réglage régional à changer.

/**
 * Échappe une valeur pour une cellule CSV : toute valeur contenant le
 * séparateur, un guillemet ou un retour à la ligne est entourée de
 * guillemets, les guillemets internes étant doublés (RFC 4180).
 */
function echapperValeur(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return '';
  const texte = String(valeur);
  if (texte.includes(SEPARATEUR) || texte.includes('"') || texte.includes('\n')) {
    return `"${texte.replace(/"/g, '""')}"`;
  }
  return texte;
}

/**
 * Construit une chaîne CSV à partir d'un tableau d'objets déjà en mémoire.
 * Les en-têtes sont, par défaut, les clés du premier objet ; `colonnes` permet
 * de choisir explicitement quelles clés exporter, dans quel ordre, avec un
 * libellé d'en-tête différent de la clé.
 */
export function buildCsv<T extends object>(
  lignes: T[],
  colonnes?: { cle: keyof T; libelle: string }[],
): string {
  if (lignes.length === 0) return '';

  const colonnesEffectives =
    colonnes ?? Object.keys(lignes[0]).map((cle) => ({ cle: cle as keyof T, libelle: cle }));

  const entete = colonnesEffectives
    .map((colonne) => echapperValeur(colonne.libelle))
    .join(SEPARATEUR);
  const corps = lignes.map((ligne) =>
    colonnesEffectives.map((colonne) => echapperValeur(ligne[colonne.cle])).join(SEPARATEUR),
  );

  // BOM UTF-8 en tête (échappé en `\uFEFF` plutôt qu'en caractère littéral,
  // pour ne pas déclencher `no-irregular-whitespace`) : sans lui, Excel
  // (Windows notamment) interprète les caractères accentués (Md€, écart...)
  // en Latin-1 et les affiche corrompus.
  return `\uFEFF${[entete, ...corps].join('\r\n')}`;
}

/**
 * Déclenche le téléchargement d'une chaîne de contenu en tant que fichier
 * texte (CSV), via le même mécanisme `Blob` que l'export PNG
 * (`src/utils/download.ts`).
 */
export function downloadTextFile(contenu: string, nomFichier: string, mimeType: string): void {
  downloadBlob(new Blob([contenu], { type: mimeType }), nomFichier);
}

/**
 * Construit un CSV depuis un tableau d'objets et déclenche son téléchargement.
 */
export function exportCsv<T extends object>(
  lignes: T[],
  nomFichier: string,
  colonnes?: { cle: keyof T; libelle: string }[],
): void {
  const csv = buildCsv(lignes, colonnes);
  downloadTextFile(csv, nomFichier, 'text/csv;charset=utf-8;');
}
