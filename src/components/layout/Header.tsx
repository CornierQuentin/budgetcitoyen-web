import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useThemeStore } from '../../store/useThemeStore';
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from '../ui/icons';
import { Nav } from './Nav';

const NAV_ID = 'navigation-principale';

export default function Header() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const estSombre = theme === 'dark';
  const libelleAction = estSombre ? 'Passer en mode clair' : 'Passer en mode sombre';

  const [menuOuvert, setMenuOuvert] = useState(false);
  // Un menu mobile laissé ouvert après un redimensionnement/une rotation
  // vers une largeur desktop resterait dans un état incohérent (le bouton
  // hamburger disparaît sous `md`, sans jamais avoir refermé le panneau) :
  // on le referme dès que le viewport franchit le point de rupture desktop.
  const estDesktop = useMediaQuery('(min-width: 768px)');
  useEffect(() => {
    if (estDesktop) setMenuOuvert(false);
  }, [estDesktop]);

  const libelleMenu = menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu';

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="text-lg font-bold text-blue-900 dark:text-blue-300">
            BudgetCitoyen.fr
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={libelleAction}
              title={libelleAction}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300
                text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none
                focus:ring-2 focus:ring-blue-800 dark:border-gray-600 dark:text-gray-200
                dark:hover:bg-gray-800 dark:focus:ring-blue-400"
            >
              {estSombre ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              type="button"
              onClick={() => setMenuOuvert((ouvert) => !ouvert)}
              aria-label={libelleMenu}
              title={libelleMenu}
              aria-expanded={menuOuvert}
              aria-controls={NAV_ID}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300
                text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none
                focus:ring-2 focus:ring-blue-800 dark:border-gray-600 dark:text-gray-200
                dark:hover:bg-gray-800 dark:focus:ring-blue-400 md:hidden"
            >
              {menuOuvert ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
        {/* Rangée dédiée, toujours visible à partir de `md` (`Nav` applique
            `md:flex` en interne) ; sous `md`, repliée derrière le bouton
            hamburger ci-dessus (`mobileOpen`/`id`/`onLinkClick`). Un seul
            <nav aria-label="Navigation principale"> dans le DOM (jamais deux
            instances, qui créeraient un landmark dupliqué pour les
            technologies d'assistance). */}
        <Nav mobileOpen={menuOuvert} id={NAV_ID} onLinkClick={() => setMenuOuvert(false)} />
      </div>
    </header>
  );
}
