import { formatMd, formatMdParties, formatPct } from '../../utils/format';
import type { DonutDatum } from './DonutChart';

/**
 * Camembert de répartition en présentation compacte : un anneau réduit
 * portant le total en son centre, et une légende en colonne où chaque ligne
 * donne le libellé, le montant et la part.
 *
 * C'est la forme des maquettes validées pour les cartes de répartition
 * placées en colonne latérale. Les étiquettes à traits de `DonutChart`
 * réclament une large marge horizontale de chaque côté du disque : dans une
 * colonne étroite, elles écrasent le disque et se chevauchent. Ici la légende
 * porte toute l'information textuelle, ce qui laisse au disque la largeur
 * qu'il lui reste.
 *
 * Rendu en SVG à la main plutôt qu'avec recharts : un anneau de segments est
 * un `stroke-dasharray` sur un cercle unique, et la légende — pas les
 * tranches — porte l'interactivité, ce qui donne au passage des cibles de
 * clic et un parcours clavier bien meilleurs que des secteurs SVG.
 */

// Géométrie de l'anneau, reprise des maquettes : viewBox 148, rayon 60,
// épaisseur de trait 19. Le SVG est ensuite mis à l'échelle par CSS.
const RAYON = 60;
const EPAISSEUR = 19;
const CENTRE = 74;
const VIEWBOX = 148;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

interface DonutCompactProps {
  data: DonutDatum[];
  total: number;
  couleurTranche: (label: string, index: number) => string;
  /** Description du graphique pour les lecteurs d'écran. */
  titreAccessible: string;
  onSliceClick?: (label: string) => void;
}

export default function DonutCompact({
  data,
  total,
  couleurTranche,
  titreAccessible,
  onSliceClick,
}: DonutCompactProps) {
  const { valeur, unite } = formatMdParties(total);

  // Décalage cumulé de chaque segment le long du cercle. `stroke-dashoffset`
  // recule dans le sens du tracé, d'où le signe négatif.
  let offsetCumule = 0;
  const segments = data.map((entry, index) => {
    const part = total > 0 ? entry.value / total : 0;
    const longueur = part * CIRCONFERENCE;
    const offset = offsetCumule;
    offsetCumule += longueur;
    return { entry, index, part, longueur, offset, couleur: couleurTranche(entry.label, index) };
  });

  return (
    // `basis` sur la légende plutôt qu'un point de rupture : c'est la largeur
    // de la CARTE qui compte, pas celle de la fenêtre — la même carte est
    // tantôt pleine largeur, tantôt dans une colonne latérale étroite. Sous
    // cette largeur de légende, elle passe sous l'anneau et récupère toute la
    // largeur, plutôt que de tronquer des libellés déjà longs (les catégories
    // d'achat CPV le sont particulièrement).
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-4">
      <div className="relative h-[132px] w-[132px] flex-none">
        <svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          className="h-full w-full"
          role="img"
          aria-label={titreAccessible}
        >
          {/* Rotation d'un quart de tour : le premier segment — la plus
              grosse part, les données arrivant triées — démarre à midi. */}
          <g transform={`rotate(-90 ${CENTRE} ${CENTRE})`} fill="none" strokeWidth={EPAISSEUR}>
            {segments.map(({ entry, longueur, offset, couleur }) => (
              <circle
                key={entry.label}
                cx={CENTRE}
                cy={CENTRE}
                r={RAYON}
                stroke={couleur}
                strokeDasharray={`${longueur} ${CIRCONFERENCE}`}
                strokeDashoffset={-offset}
              />
            ))}
          </g>
        </svg>
        <span className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <b className="block text-[15px] font-semibold tabular-nums tracking-tight text-ink">
            {valeur}
          </b>
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-faint">
            {unite}
          </span>
        </span>
      </div>

      {/* `grow basis-80` et non `flex-1` : ce dernier impose `flex-basis: 0`,
          qui écraserait la largeur de référence sur laquelle repose le
          basculement en colonne. */}
      <ul className="flex min-w-0 grow basis-80 flex-col text-[13px]">
        {segments.map(({ entry, part, couleur }) => {
          const contenu = (
            <>
              <span
                aria-hidden="true"
                className="h-[9px] w-[9px] shrink-0 rounded-[2px]"
                style={{ backgroundColor: couleur }}
              />
              <span className="min-w-0 flex-1 truncate text-left" title={entry.label}>
                {entry.label}
              </span>
              <span className="font-semibold tabular-nums">{formatMd(entry.value)}</span>
              <span className="w-12 shrink-0 text-right text-xs tabular-nums text-ink-faint">
                {formatPct(part)}
              </span>
            </>
          );

          return (
            <li key={entry.label}>
              {onSliceClick ? (
                <button
                  type="button"
                  onClick={() => onSliceClick(entry.label)}
                  className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-[5px]
                    hover:bg-surface-hover"
                >
                  {contenu}
                </button>
              ) : (
                <span className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-[5px]">
                  {contenu}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
