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
