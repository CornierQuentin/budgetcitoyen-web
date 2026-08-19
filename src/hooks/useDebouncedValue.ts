import { useEffect, useState } from 'react';

/**
 * Retourne `value`, mais retardé de `delayMs` millisecondes après la
 * dernière mise à jour (annulé si `value` change entre-temps).
 *
 * Aucune recherche existante n'en a besoin aujourd'hui (filtre client
 * instantané sur des données déjà entièrement chargées, cf. Comparateur.tsx/
 * DepensesFiscales.tsx) : une recherche serveur (déclenchant une requête
 * API à chaque frappe sans lui) est un besoin nouveau, propre au module
 * marchés publics.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}
