import { type ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAnnees } from '../../hooks/useAnnees';
import { useThemeStore } from '../../store/useThemeStore';
import { CloseIcon, LogoMarkIcon, MenuIcon, MoonIcon, SunIcon } from '../ui/icons';
import Footer from './Footer';

/** Ancres de la page d'accueil, dans l'ordre de lecture. */
const ANCRES = [
  { href: '#chiffres', label: 'Les chiffres' },
  { href: '#outil', label: "L'outil" },
  { href: '#idee', label: "L'idée" },
  { href: '#donnees', label: 'Les données' },
];

const MENU_ID = 'menu-accueil';

interface LandingShellProps {
  children: ReactNode;
}

/**
 * Coque de la page d'accueil : en-tête léger, aucun rail de navigation.
 *
 * L'accueil est la seule page où le visiteur ne vient pas *opérer* mais
 * comprendre ce qu'est le site et décider où aller. La coque applicative
 * (rail + barre supérieure + cartes) est conçue pour l'opération : une page
 * d'accueil posée dedans ne peut ressembler qu'à l'onglet « home » d'un
 * tableau de bord. Le rail n'apparaît donc qu'une fois entré dans les données
 * (cf. AppShell.tsx).
 */
export default function LandingShell({ children }: LandingShellProps) {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const estSombre = theme === 'dark';
  const libelleTheme = estSombre ? 'Passer en mode clair' : 'Passer en mode sombre';

  const [menuOuvert, setMenuOuvert] = useState(false);
  const libelleMenu = menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu';

  // L'exercice visé est annoncé dans l'appel à l'action : « Explorer le budget
  // 2026 » dit où l'on atterrit, pas seulement qu'on va quelque part. La
  // requête est déjà faite par la page d'accueil, React Query la mutualise.
  const { data: annees } = useAnnees();
  const derniereAnnee =
    annees && annees.length > 0 ? Math.max(...annees.map((item) => item.annee)) : undefined;
  const libelleExplorer = derniereAnnee ? `Explorer le budget ${derniereAnnee}` : 'Explorer le budget';

  useEffect(() => {
    if (!menuOuvert) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOuvert(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOuvert]);

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur
          supports-[backdrop-filter]:bg-surface/80"
      >
        <div className="mx-auto w-full max-w-[1120px] px-6">
          <div className="flex h-16 items-center gap-6">
            <Link
              to="/"
              className="flex flex-none items-center gap-2 text-[15.5px] font-bold
                tracking-[-0.015em] text-ink"
            >
              <LogoMarkIcon className="h-[19px] w-[19px] text-accent" />
              BudgetCitoyen.fr
            </Link>

            <nav aria-label="Sections de la page" className="hidden gap-6 md:flex">
              {ANCRES.map((ancre) => (
                <a
                  key={ancre.href}
                  href={ancre.href}
                  className="text-[14.5px] font-medium text-ink-muted transition-colors hover:text-ink"
                >
                  {ancre.label}
                </a>
              ))}
            </nav>

            <div className="ml-auto flex flex-none items-center gap-2.5">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={libelleTheme}
                title={libelleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-md border
                  border-line-strong text-ink-muted transition-colors hover:bg-surface-hover
                  hover:text-ink"
              >
                {estSombre ? <SunIcon /> : <MoonIcon />}
              </button>

              <Link
                to="/tableau-de-bord"
                className="hidden h-9 items-center rounded-md border border-accent bg-accent px-3.5
                  text-[13.5px] font-semibold text-accent-contrast transition-colors
                  hover:border-accent-hover hover:bg-accent-hover sm:inline-flex"
              >
                {libelleExplorer}
              </Link>

              <button
                type="button"
                onClick={() => setMenuOuvert((ouvert) => !ouvert)}
                aria-label={libelleMenu}
                title={libelleMenu}
                aria-expanded={menuOuvert}
                aria-controls={MENU_ID}
                className="flex h-9 w-9 items-center justify-center rounded-md border
                  border-line-strong text-ink-muted transition-colors hover:bg-surface-hover
                  hover:text-ink md:hidden"
              >
                {menuOuvert ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {menuOuvert && (
            <nav
              id={MENU_ID}
              aria-label="Sections de la page (mobile)"
              className="flex flex-col gap-1 border-t border-line py-3 md:hidden"
            >
              {ANCRES.map((ancre) => (
                <a
                  key={ancre.href}
                  href={ancre.href}
                  onClick={() => setMenuOuvert(false)}
                  className="rounded-md px-2 py-2 text-[14.5px] font-medium text-ink-muted
                    hover:bg-surface-hover hover:text-ink"
                >
                  {ancre.label}
                </a>
              ))}
              <Link
                to="/tableau-de-bord"
                onClick={() => setMenuOuvert(false)}
                className="mt-1 rounded-md bg-accent px-2 py-2 text-center text-[14.5px]
                  font-semibold text-accent-contrast"
              >
                {libelleExplorer}
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 bg-surface">{children}</main>

      <Footer gouttiereAccueil />
    </div>
  );
}
