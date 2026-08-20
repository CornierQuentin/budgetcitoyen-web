import { LinkIcon } from './icons';

interface SourceIconProps {
  /** URL officielle de la source de la donnée affichée à côté de l'icône. */
  url: string;
  /**
   * Précision optionnelle sur la donnée sourcée (ex. « dépenses 2025 »),
   * insérée dans le `title`/`aria-label` du lien.
   */
  label?: string;
  className?: string;
}

// Icône source cliquable, à placer à côté de chaque chiffre affiché
// (cf. cahier des charges, section 6.2 : « Chaque chiffre affiché est
// accompagné d'une icône source cliquable (lien officiel) »).
export function SourceIcon({ url, label, className = '' }: SourceIconProps) {
  const accessibleLabel = label
    ? `Voir la source officielle : ${label}`
    : 'Voir la source officielle';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={accessibleLabel}
      aria-label={accessibleLabel}
      className={`ml-1 inline-flex align-middle text-gray-400 no-underline hover:text-blue-800
        focus:text-blue-800 dark:text-gray-500 dark:hover:text-blue-300 dark:focus:text-blue-300 ${className}`}
    >
      <LinkIcon />
    </a>
  );
}

export default SourceIcon;
