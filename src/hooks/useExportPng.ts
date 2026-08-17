import { useCallback, useRef, useState } from 'react';

import { exportNodeAsPng } from '../utils/exportPng';

/**
 * Hook réutilisable pour exporter en PNG le noeud DOM référencé. Fournit une
 * `ref` à poser sur l'élément à capturer, une fonction `exporterPng` (nom de
 * fichier fourni à l'appel, pour pouvoir refléter un état courant — années
 * sélectionnées, etc.) et un booléen `enCours` pour désactiver le bouton
 * pendant la génération de l'image.
 */
export function useExportPng<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const exporterPng = useCallback(async (nomFichier: string) => {
    if (!ref.current) return;
    setEnCours(true);
    setErreur(null);
    try {
      await exportNodeAsPng(ref.current, nomFichier);
    } catch {
      setErreur("L'export PNG a échoué. Réessayez.");
    } finally {
      setEnCours(false);
    }
  }, []);

  return { ref, exporterPng, enCours, erreur };
}
