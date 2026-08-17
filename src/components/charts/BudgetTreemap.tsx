import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hierarchy, treemap, treemapSquarify, type HierarchyRectangularNode } from 'd3-hierarchy';
import { scaleLinear } from 'd3-scale';

import { useThemeStore } from '../../store/useThemeStore';
import { formatMd } from '../../utils/format';

export interface TreemapDatum {
  slug: string;
  nom: string;
  montant: number;
}

interface BudgetTreemapProps {
  data: TreemapDatum[];
}

interface TreemapRoot {
  children: TreemapDatum[];
}

const WIDTH = 720;
const HEIGHT = 420;

// Rampe séquentielle bleue (palette validée du skill dataviz — un seul hue,
// clair -> foncé). Avec plusieurs dizaines de missions, une couleur
// catégorielle par mission n'est pas praticable (au-delà de 8 séries, la
// distinction par teinte échoue) : la couleur renforce ici la magnitude,
// déjà portée par l'aire, et l'identité passe par le libellé + la tooltip.
const BLUE_LIGHTEST = '#cde2fb';
const BLUE_DARKEST = '#0d366b';
const LABEL_MIN_WIDTH = 64;
const LABEL_MIN_HEIGHT = 28;

type LeafNode = HierarchyRectangularNode<TreemapDatum | TreemapRoot>;

export default function BudgetTreemap({ data }: BudgetTreemapProps) {
  const navigate = useNavigate();
  const estSombre = useThemeStore((state) => state.theme === 'dark');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; nom: string; montant: number } | null>(
    null,
  );
  // Trait de séparation entre rectangles : proche du fond de la carte dans
  // les deux thèmes, pour rester discret sans dépendre d'une couleur fixe.
  const strokeSeparation = estSombre ? '#111827' : '#fcfcfb';

  const leaves = useMemo<LeafNode[]>(() => {
    if (data.length === 0) return [];

    const root = hierarchy<TreemapRoot | TreemapDatum>({ children: data })
      .sum((node) => ('montant' in node ? node.montant : 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    treemap<TreemapRoot | TreemapDatum>()
      .tile(treemapSquarify)
      .size([WIDTH, HEIGHT])
      .paddingInner(2)
      .round(true)(root);

    return root.leaves() as LeafNode[];
  }, [data]);

  const colorScale = useMemo(() => {
    const montants = data.map((item) => item.montant);
    const min = montants.length > 0 ? Math.min(...montants) : 0;
    const max = montants.length > 0 ? Math.max(...montants) : 1;
    return scaleLinear<string>()
      .domain([min, max === min ? min + 1 : max])
      .range([BLUE_LIGHTEST, BLUE_DARKEST]);
  }, [data]);

  if (data.length === 0) {
    return (
      <div
        className="flex h-64 items-center justify-center rounded-lg border border-dashed
          border-gray-300 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400"
      >
        Aucune donnée à afficher pour cette année.
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full rounded-lg border border-gray-200 bg-white dark:border-gray-700
          dark:bg-gray-900"
        role="img"
        aria-label="Répartition des dépenses de l'État par mission budgétaire"
      >
        {leaves.map((leaf) => {
          const datum = leaf.data as TreemapDatum;
          const rectWidth = leaf.x1 - leaf.x0;
          const rectHeight = leaf.y1 - leaf.y0;
          const showLabel = rectWidth >= LABEL_MIN_WIDTH && rectHeight >= LABEL_MIN_HEIGHT;

          return (
            <g key={datum.slug} transform={`translate(${leaf.x0},${leaf.y0})`}>
              <rect
                width={rectWidth}
                height={rectHeight}
                fill={colorScale(datum.montant)}
                stroke={strokeSeparation}
                strokeWidth={2}
                className="cursor-pointer transition-opacity hover:opacity-80"
                role="button"
                tabIndex={0}
                aria-label={`${datum.nom} : ${formatMd(datum.montant)}`}
                onClick={() => navigate(`/tableau-de-bord/mission/${datum.slug}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    navigate(`/tableau-de-bord/mission/${datum.slug}`);
                  }
                }}
                onMouseEnter={() => {
                  setTooltip({
                    x: leaf.x0 + rectWidth / 2,
                    y: leaf.y0,
                    nom: datum.nom,
                    montant: datum.montant,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
              {showLabel && (
                <text
                  x={6}
                  y={16}
                  className="pointer-events-none select-none fill-white text-[11px] font-medium"
                >
                  {datum.nom.length > 22 ? `${datum.nom.slice(0, 21)}…` : datum.nom}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg"
          style={{ left: `${(tooltip.x / WIDTH) * 100}%`, top: `${(tooltip.y / HEIGHT) * 100}%` }}
        >
          <p className="font-semibold">{tooltip.nom}</p>
          <p>{formatMd(tooltip.montant)}</p>
        </div>
      )}
    </div>
  );
}
