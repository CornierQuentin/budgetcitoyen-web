import { type ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useThemeStore } from '../../store/useThemeStore';
import { CloseIcon, LogoMarkIcon, MenuIcon, MoonIcon, SunIcon } from '../ui/icons';
import Footer from './Footer';
import { Nav } from './Nav';

const RAIL_ID = 'navigation-principale';

interface AppShellProps {
  children: ReactNode;
}

// Coque applicative : rail latéral permanent à partir de `lg`, tiroir en
// dessous. Remplace l'ancien en-tête horizontal, qui saturait à neuf entrées
// de navigation et ne laissait aucune place à un fil d'Ariane ou à une
// recherche (cf. contrat de direction dans index.html).
export default function AppShell({ children }: AppShellProps) {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const estSombre = theme === 'dark';
  const libelleTheme = estSombre ? 'Passer en mode clair' : 'Passer en mode sombre';

  const [menuOuvert, setMenuOuvert] = useState(false);
  // Un tiroir resté ouvert après un passage en largeur desktop laisserait le
  // voile actif alors que le bouton qui le referme a disparu.
  const estDesktop = useMediaQuery('(min-width: 1024px)');
  useEffect(() => {
    if (estDesktop) setMenuOuvert(false);
  }, [estDesktop]);

  // Échap referme le tiroir : attendu de tout panneau superposé.
  useEffect(() => {
    if (!menuOuvert) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOuvert(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOuvert]);

  const libelleMenu = menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu';

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[244px_minmax(0,1fr)]">
      {/* Voile du tiroir : uniquement sous `lg`, où le rail se superpose. */}
      {menuOuvert && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setMenuOuvert(false)}
          className="fixed inset-0 z-40 bg-[rgb(10_14_20/0.5)] lg:hidden"
        />
      )}

      <aside
        id={RAIL_ID}
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col overflow-y-auto border-r
          border-line bg-surface shadow-md transition-transform duration-200 ease-out
          lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 lg:shadow-none ${
            menuOuvert ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex h-14 flex-none items-center gap-2 border-b border-line px-4">
          <Link
            to="/"
            onClick={() => setMenuOuvert(false)}
            className="flex items-center gap-2 text-[14.5px] font-bold tracking-[-0.012em] text-ink"
          >
            <LogoMarkIcon className="h-[18px] w-[18px] text-accent" />
            BudgetCitoyen.fr
          </Link>
        </div>

        <Nav onLinkClick={() => setMenuOuvert(false)} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header
          className="sticky top-0 z-30 flex h-14 flex-none items-center gap-3 border-b border-line
            bg-surface px-4 sm:px-5"
        >
          <button
            type="button"
            onClick={() => setMenuOuvert((ouvert) => !ouvert)}
            aria-label={libelleMenu}
            title={libelleMenu}
            aria-expanded={menuOuvert}
            aria-controls={RAIL_ID}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-md border
              border-line-strong text-ink-muted transition-colors hover:bg-surface-hover
              hover:text-ink lg:hidden"
          >
            {menuOuvert ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
          </button>

          <span className="truncate text-[13px] text-ink-muted">Budget de l&apos;État</span>

          <span className="ml-auto flex-none" />

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={libelleTheme}
            title={libelleTheme}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-md border
              border-line-strong text-ink-muted transition-colors hover:bg-surface-hover
              hover:text-ink"
          >
            {estSombre ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-5">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
