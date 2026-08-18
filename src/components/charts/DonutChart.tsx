import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { useExportPng } from '../../hooks/useExportPng';
import { useThemeStore } from '../../store/useThemeStore';
import { couleurPourLabel } from '../../utils/couleurCategorielle';
import { formatMd, formatPct } from '../../utils/format';
import { Button } from '../ui/Button';

export interface DonutDatum {
  label: string;
  value: number;
  /**
   * Sous-éléments agrégés dans cette tranche (ex : les missions regroupées
   * dans une tranche « Autres » côté Dashboard). Optionnel — DonutChart reste
   * un composant générique {label, value}[], ce champ n'est utilisé que pour
   * enrichir la tooltip quand l'appelant en fournit.
   */
  details?: { label: string; value: number }[];
}

interface DonutChartProps {
  data: DonutDatum[];
  /** Nom de fichier proposé pour l'export PNG (CDC 6.2). */
  nomFichierExport?: string;
  /**
   * Appelé avec le `label` de la tranche cliquée (souris ou clavier —
   * Entrée/Espace sur une tranche mise en focus par les flèches, navigation
   * clavier native de recharts). Laisser vide pour un graphique non cliquable.
   */
  onSliceClick?: (label: string) => void;
}

interface DonutTooltipProps {
  active?: boolean;
  payload?: { payload: DonutDatum }[];
  total: number;
  estSombre: boolean;
}

function DonutTooltip({ active, payload, total, estSombre }: DonutTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0].payload;
  const pct = total > 0 ? datum.value / total : 0;

  return (
    <div
      className="max-w-xs rounded-md border px-2 py-1.5 text-xs shadow-lg"
      style={{
        backgroundColor: estSombre ? '#1f2937' : '#ffffff',
        borderColor: estSombre ? '#374151' : '#e1e0d9',
        color: estSombre ? '#f3f4f6' : '#1f2937',
      }}
    >
      <p className="font-semibold">{datum.label}</p>
      <p>{`${formatMd(datum.value)} (${formatPct(pct)})`}</p>
      {datum.details && datum.details.length > 0 && (
        <>
          <p className="mt-1 border-t border-current pt-1 text-[11px] opacity-70">Détail :</p>
          <ul className="max-h-40 space-y-0.5 overflow-y-auto">
            {datum.details.map((detail) => (
              <li key={detail.label}>{`${detail.label} : ${formatMd(detail.value)}`}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default function DonutChart({
  data,
  nomFichierExport = 'recettes-par-type.png',
  onSliceClick,
}: DonutChartProps) {
  const estSombre = useThemeStore((state) => state.theme === 'dark');
  const { ref: exportRef, exporterPng, enCours: exportEnCours } = useExportPng<HTMLDivElement>();

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

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Recharts câble les gestionnaires d'événements posés sur <Pie> (et pas sur
  // chaque <Cell>) à chaque secteur, y compris son support clavier natif : le
  // Pie entier est un seul arrêt de tabulation (rootTabIndex), les flèches
  // gauche/droite déplacent le focus entre tranches, et onKeyDown reçoit
  // alors les mêmes (data, index, event) que onClick — d'où l'activation
  // Entrée/Espace ci-dessous, gratuite pour la navigation clavier entre
  // tranches.
  const declencherClic = (entry: { payload?: DonutDatum }) => {
    if (!onSliceClick || !entry.payload) return;
    onSliceClick(entry.payload.label);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-1 text-xs"
          onClick={() => exporterPng(nomFichierExport)}
          disabled={exportEnCours}
        >
          {exportEnCours ? 'Export en cours…' : 'Exporter PNG'}
        </Button>
      </div>

      <div
        ref={exportRef}
        className="h-96 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              stroke={estSombre ? '#111827' : '#fcfcfb'}
              strokeWidth={2}
              // Désactivée : l'animation d'entrée démarre les tranches à un
              // angle nul, ce qui retarde leur présence dans le DOM (gênant
              // pour les tests, et pour un éventuel export PNG déclenché
              // juste après le montage).
              isAnimationActive={false}
              className={onSliceClick ? 'cursor-pointer' : undefined}
              onClick={onSliceClick ? declencherClic : undefined}
              onKeyDown={
                onSliceClick
                  ? (entry, _index, event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        declencherClic(entry);
                      }
                    }
                  : undefined
              }
            >
              {data.map((entry) => (
                <Cell key={entry.label} fill={couleurPourLabel(entry.label)} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip total={total} estSombre={estSombre} />} />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: 12, color: estSombre ? '#e5e7eb' : '#374151' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
