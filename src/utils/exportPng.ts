// Export PNG générique (CDC 6.2 : « toute visualisation exportable en PNG »).
// `html-to-image` (plus léger que `html2canvas`) rastérise un noeud DOM en
// PNG côté client, sans backend dédié.
//
// Note mode sombre : si l'app est en thème sombre au moment de l'export, le
// PNG capturé aura un fond sombre — comportement volontaire (cohérent avec ce
// que l'utilisateur voit à l'écran), pas un bug. On ne force pas un export
// toujours en clair.

import { toBlob } from 'html-to-image';

import { downloadBlob } from './download';

/**
 * Rastérise le noeud DOM donné en PNG et déclenche son téléchargement.
 * `pixelRatio: 2` produit une image nette sur écrans HiDPI sans complexifier
 * l'appelant.
 */
export async function exportNodeAsPng(node: HTMLElement, nomFichier: string): Promise<void> {
  const blob = await toBlob(node, { pixelRatio: 2 });
  if (!blob) {
    throw new Error("Échec de la génération de l'image PNG.");
  }
  downloadBlob(blob, nomFichier);
}
