// Petit système d'icônes maison : traits cohérents (stroke-width 1.75,
// linecap/linejoin ronds, viewBox 20x20, currentColor) plutôt que des
// emojis Unicode — un emoji rend différemment selon l'OS/le navigateur et
// ne porte aucune intention de design (cf. skill impeccable, craft-floor :
// « Unicode glyphs or emoji standing in for an icon system »). Pas de
// dépendance ajoutée : le projet n'a jamais eu besoin d'une librairie
// d'icônes pour son petit nombre d'usages (source, thème, menu).

interface IconProps {
  className?: string;
}

const COMMON_PROPS = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function SunIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7" />
    </svg>
  );
}

export function MoonIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <path d="M17 11.5A7 7 0 0 1 8.5 3a7 7 0 1 0 8.5 8.5Z" />
    </svg>
  );
}

export function LinkIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <path d="M8.3 11.7 11.7 8.3M8.8 5.6l.7-.7a2.9 2.9 0 0 1 4.1 4.1l-.7.7M11.2 14.4l-.7.7a2.9 2.9 0 0 1-4.1-4.1l.7-.7" />
    </svg>
  );
}

export function MenuIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <path d="M3 6h14M3 10h14M3 14h14" />
    </svg>
  );
}

export function CloseIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
  );
}

// --- Icônes de navigation (rail latéral) -----------------------------------
// Même grille et même graisse que ci-dessus : le rail doit lire comme un seul
// jeu dessiné, pas comme un assemblage d'icônes d'origines diverses.

export function HomeIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <path d="M3 8.5 10 3l7 5.5" />
      <path d="M4.5 8v9h11V8" />
    </svg>
  );
}

export function DashboardIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <rect x="3" y="3" width="6.5" height="8" rx="1.2" />
      <rect x="3" y="13" width="6.5" height="4" rx="1.2" />
      <rect x="11.5" y="3" width="5.5" height="4" rx="1.2" />
      <rect x="11.5" y="9" width="5.5" height="8" rx="1.2" />
    </svg>
  );
}

export function TrendIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <path d="M3 16.5h14" />
      <path d="m4 13 4-4.5 3.5 3L16 5.5" />
    </svg>
  );
}

export function CompareIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <path d="M7 4v12M13 4v12" />
      <path d="M4 7h6M10 13h6" />
    </svg>
  );
}

export function SliderIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <path d="M3 6.5h14M3 13.5h14" />
      <circle cx="7.5" cy="6.5" r="2" />
      <circle cx="12.5" cy="13.5" r="2" />
    </svg>
  );
}

export function PersonIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <circle cx="10" cy="6.5" r="3" />
      <path d="M4 17c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    </svg>
  );
}

export function ListIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <path d="M4 5h12M4 10h8M4 15h5" />
    </svg>
  );
}

export function SearchIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.5 13.5 3.5 3.5" />
    </svg>
  );
}

export function DatabaseIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <ellipse cx="10" cy="5.5" rx="6" ry="2.5" />
      <path d="M4 5.5v9c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-9" />
      <path d="M4 10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" />
    </svg>
  );
}

export function LogoMarkIcon({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...COMMON_PROPS} strokeWidth={1.9} className={className}>
      <path d="M3 16.5h14" />
      <path d="M5.5 16.5V9M10 16.5V4.5M14.5 16.5v-5" />
    </svg>
  );
}
