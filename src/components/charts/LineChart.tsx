import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useExportPng } from '../../hooks/useExportPng';
import { useThemeStore } from '../../store/useThemeStore';
import { formatMd } from '../../utils/format';
import { Button } from '../ui/Button';

export interface LineChartDatum {
  annee: number;
  depenses: number;
  recettes: number;
  deficit: number;
}

interface LineChartProps {
  data: LineChartDatum[];
  /** Nom de fichier proposé pour l'export PNG (CDC 6.2). */
  nomFichierExport?: string;
}

// Palette catégorielle validée (skill dataviz), ordre fixe.
const COLOR_DEPENSES = '#2a78d6'; // blue
const COLOR_RECETTES = '#eb6834'; // orange
const COLOR_DEFICIT = '#1baf7a'; // aqua

const SERIES = [
  { key: 'depenses', label: 'Dépenses nettes', color: COLOR_DEPENSES },
  { key: 'recettes', label: 'Recettes nettes', color: COLOR_RECETTES },
  { key: 'deficit', label: 'Déficit', color: COLOR_DEFICIT },
] as const;

export default function LineChart({
  data,
  nomFichierExport = 'historique-depenses-recettes-deficit.png',
}: LineChartProps) {
  const estSombre = useThemeStore((state) => state.theme === 'dark');
  const { ref: exportRef, exporterPng, enCours: exportEnCours } = useExportPng<HTMLDivElement>();

  if (data.length === 0) {
    return (
      <div
        className="flex h-64 items-center justify-center rounded-lg border border-dashed
          border-gray-300 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400"
      >
        Aucune donnée à afficher pour cette période.
      </div>
    );
  }

  // Couleurs de grille/axes recalculées pour rester lisibles sur fond sombre
  // (les teintes claires d'origine, conçues pour un fond blanc, s'effacent
  // sur bg-gray-900).
  const gridColor = estSombre ? '#374151' : '#e1e0d9';
  const axisLineColor = estSombre ? '#4b5563' : '#c3c2b7';
  const tickColor = estSombre ? '#d1d5db' : '#898781';

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
        className="h-80 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="annee"
              stroke={axisLineColor}
              tick={{ fill: tickColor, fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              stroke={axisLineColor}
              tick={{ fill: tickColor, fontSize: 12 }}
              tickLine={false}
              tickFormatter={(value: number) => formatMd(value)}
              width={70}
            />
            <Tooltip
              formatter={(value: number) => formatMd(value)}
              labelFormatter={(label: number) => `Année ${label}`}
              contentStyle={{
                fontSize: 12,
                borderRadius: 6,
                backgroundColor: estSombre ? '#1f2937' : '#ffffff',
                borderColor: estSombre ? '#374151' : '#e1e0d9',
                color: estSombre ? '#f3f4f6' : '#1f2937',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: tickColor }} />
            {SERIES.map((serie) => (
              <Line
                key={serie.key}
                type="monotone"
                dataKey={serie.key}
                name={serie.label}
                stroke={serie.color}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, stroke: estSombre ? '#111827' : '#fcfcfb' }}
                activeDot={{ r: 5 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
