import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Répercute `values` dans l'URL (un paramètre par clé, absent/vide retiré),
 * avec une garde d'égalité pour éviter une entrée d'historique à chaque
 * rendu — même principe que l'effet d'écriture déjà utilisé par
 * Comparateur.tsx/Dashboard.tsx (2 paramètres au plus), généralisé ici à un
 * nombre arbitraire de clés (6+ filtres pour la page Marchés publics, où le
 * dupliquer à la main aurait été plus source d'erreur).
 *
 * La lecture initiale (une seule fois au montage) reste à la charge de
 * l'appelant (initialiseurs `useState(() => ...)`), comme sur les autres
 * pages : ce hook ne gère que l'écriture état -> URL.
 */
export function useSyncSearchParams(values: Record<string, string | undefined>): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const valuesKey = JSON.stringify(values);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const changed = Object.entries(values)
      .map(([key, value]) => {
        const actuel = searchParams.get(key);
        if (!value) {
          if (actuel === null) return false;
          next.delete(key);
          return true;
        }
        if (actuel === value) return false;
        next.set(key, value);
        return true;
      })
      .some(Boolean);

    if (changed) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuesKey]);
}
