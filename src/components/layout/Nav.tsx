import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';

import {
  CompareIcon,
  DashboardIcon,
  DatabaseIcon,
  HomeIcon,
  ListIcon,
  PersonIcon,
  SearchIcon,
  SliderIcon,
  TrendIcon,
} from '../ui/icons';

interface NavItem {
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  /** `end` évite que « Accueil » (/) reste actif sur toutes les autres routes. */
  end?: boolean;
}

interface NavGroup {
  titre: string;
  items: NavItem[];
}

// Groupé par intention plutôt qu'en liste plate : à neuf entrées, une liste
// sans regroupement oblige à tout relire pour trouver une page. Les intitulés
// des liens restent inchangés (ce sont ceux que les utilisateurs et les tests
// connaissent), seul le classement est nouveau.
const groupes: NavGroup[] = [
  {
    titre: "Vue d'ensemble",
    items: [
      { to: '/', label: 'Accueil', Icon: HomeIcon, end: true },
      { to: '/tableau-de-bord', label: 'Tableau de bord', Icon: DashboardIcon },
      { to: '/historique', label: 'Historique', Icon: TrendIcon },
    ],
  },
  {
    titre: 'Analyser',
    items: [
      { to: '/comparer', label: 'Comparateur', Icon: CompareIcon },
      { to: '/simulateur', label: 'Simulateur', Icon: SliderIcon },
      { to: '/mon-budget', label: 'Mon budget', Icon: PersonIcon },
    ],
  },
  {
    titre: 'Explorer',
    items: [
      { to: '/depenses-fiscales', label: 'Niches fiscales', Icon: ListIcon },
      { to: '/marches-publics', label: 'Marchés publics', Icon: SearchIcon },
    ],
  },
  {
    titre: 'Référence',
    items: [{ to: '/donnees', label: 'Données', Icon: DatabaseIcon }],
  },
];

interface NavProps {
  /** Appelé au clic sur un lien : referme le tiroir en vue mobile. */
  onLinkClick?: () => void;
}

export function Nav({ onLinkClick }: NavProps) {
  return (
    <nav aria-label="Navigation principale" className="flex flex-col gap-4 px-2 pb-5 pt-3">
      {groupes.map((groupe) => (
        <div key={groupe.titre} className="flex flex-col gap-px">
          <span className="px-2.5 pb-1.5 pt-1 text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink-faint">
            {groupe.titre}
          </span>
          {groupe.items.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onLinkClick}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13.5px] transition-colors ${
                  isActive
                    ? 'bg-accent-soft font-semibold text-accent'
                    : 'font-medium text-ink-muted hover:bg-surface-hover hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-4 w-4 flex-none ${isActive ? '' : 'text-ink-faint'}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

export default Nav;
