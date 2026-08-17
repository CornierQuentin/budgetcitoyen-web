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
  { to: '/donnees', label: 'Données' },
];

export function Nav() {
  return (
    <nav aria-label="Navigation principale">
      <ul className="flex flex-wrap gap-4">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
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
