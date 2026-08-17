import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { useThemeStore } from '../../store/useThemeStore';
import { formatMd, formatPct } from '../../utils/format';

export interface DonutDatum {
  label: string;
  value: number;
}

interface DonutChartProps {
  data: DonutDatum[];
}

// Palette catégorielle validée (skill dataviz), ordre fixe — jamais recyclé
// sur une entrée supplémentaire au-delà de 8 séries.
const CATEGORICAL_COLORS = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
];

export default function DonutChart({ data }: DonutChartProps) {
  const estSombre = useThemeStore((state) => state.theme === 'dark');

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

  return (
    <div className="h-64 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
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
          >
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, label: string) => [
              `${formatMd(value)} (${formatPct(total > 0 ? value / total : 0)})`,
              label,
            ]}
            contentStyle={{
              fontSize: 12,
              borderRadius: 6,
              backgroundColor: estSombre ? '#1f2937' : '#ffffff',
              borderColor: estSombre ? '#374151' : '#e1e0d9',
              color: estSombre ? '#f3f4f6' : '#1f2937',
            }}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: 12, color: estSombre ? '#e5e7eb' : '#374151' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
