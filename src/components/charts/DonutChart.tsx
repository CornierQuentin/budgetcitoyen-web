import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

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
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500">
        Aucune donnée à afficher pour cette année.
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-64 rounded-lg border border-gray-200 bg-white p-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="#fcfcfb"
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
            contentStyle={{ fontSize: 12, borderRadius: 6 }}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
