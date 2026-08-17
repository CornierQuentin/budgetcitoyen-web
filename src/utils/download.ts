// Déclenchement de téléchargement partagé entre l'export CSV et l'export PNG
// (même mécanique `Blob` + lien temporaire dans les deux cas) : un seul
// endroit à corriger si le pattern doit évoluer.

/**
 * Déclenche le téléchargement d'un `Blob` en tant que fichier, via un lien
 * temporaire cliqué programmatiquement. L'URL objet créée est révoquée juste
 * après le clic pour ne pas fuir de mémoire.
 */
export function downloadBlob(blob: Blob, nomFichier: string): void {
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}
