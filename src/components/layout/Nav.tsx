import { Link } from 'react-router-dom';

interface NavLink {
  to: string;
  label: string;
}

const links: NavLink[] = [
  { to: '/', label: 'Accueil' },
  { to: '/tableau-de-bord', label: 'Tableau de bord' },
  { to: '/historique', label: 'Historique' },
  { to: '/comparer', label: 'Comparateur' },
  { to: '/mon-budget', label: 'Mon budget' },
  { to: '/simulateur', label: 'Simulateur' },
  { to: '/depenses-fiscales', label: 'Niches fiscales' },
  { to: '/marches-publics', label: 'Marchés publics' },
  { to: '/donnees', label: 'Données' },
];

interface NavProps {
  /**
   * Repliée par défaut sous le point de rupture `md` (masquée via `hidden`,
   * réapparaît via `md:flex` qui l'emporte sur `hidden` à partir de `md`) :
   * `mobileOpen` ne pilote que l'état SOUS `md`, jamais au-dessus. Header.tsx
   * possède cet état (bouton hamburger, fermeture au clic sur un lien ou au
   * redimensionnement vers desktop).
   */
  mobileOpen?: boolean;
  id?: string;
  onLinkClick?: () => void;
}

export function Nav({ mobileOpen = false, id, onLinkClick }: NavProps) {
  return (
    <nav aria-label="Navigation principale">
      <ul
        id={id}
        className={`${mobileOpen ? 'flex' : 'hidden'} mt-3 w-full flex-col gap-3 pb-2
          md:mt-0 md:flex md:w-auto md:flex-row md:flex-wrap md:gap-4 md:pb-0`}
      >
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              onClick={onLinkClick}
              className="text-sm font-medium text-gray-700 hover:text-blue-800 dark:text-gray-300
                dark:hover:text-blue-300"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Nav;
