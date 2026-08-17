import { useEffect, useState } from 'react';

// Même pattern d'écoute que `useThemeStore` (préférence système en direct,
// avec repli `addListener` pour Safari < 14).
function lireCorrespondance(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(query).matches;
}

/**
 * Suit en direct si la media query donnée correspond (ex : un breakpoint
 * Tailwind `(min-width: 768px)`). Utile pour adapter un comportement JS
 * (et pas seulement l'affichage CSS) au même point de rupture qu'un repli
 * `hidden md:block`.
 */
export function useMediaQuery(query: string): boolean {
  const [correspond, setCorrespond] = useState(() => lireCorrespondance(query));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia(query);
    setCorrespond(mql.matches);

    const onChange = (event: MediaQueryListEvent) => setCorrespond(event.matches);

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    // Safari < 14
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [query]);

  return correspond;
}
