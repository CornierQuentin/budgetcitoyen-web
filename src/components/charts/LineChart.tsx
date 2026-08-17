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

import { formatMd } from '../../utils/format';

export interface LineChartDatum {
  annee: number;
  depenses: number;
  recettes: number;
  deficit: number;
}

interface LineChartProps {
  data: LineChartDatum[];
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

export default function LineChart({ data }: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500">
        Aucune donnée à afficher pour cette période.
      </div>
    );
  }

  return (
    <div className="h-80 rounded-lg border border-gray-200 bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="#e1e0d9" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="annee"
            stroke="#c3c2b7"
            tick={{ fill: '#898781', fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            stroke="#c3c2b7"
            tick={{ fill: '#898781', fontSize: 12 }}
            tickLine={false}
            tickFormatter={(value: number) => formatMd(value)}
            width={70}
          />
          <Tooltip
            formatter={(value: number) => formatMd(value)}
            labelFormatter={(label: number) => `Année ${label}`}
            contentStyle={{ fontSize: 12, borderRadius: 6 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {SERIES.map((serie) => (
            <Line
              key={serie.key}
              type="monotone"
              dataKey={serie.key}
              name={serie.label}
              stroke={serie.color}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, stroke: '#fcfcfb' }}
              activeDot={{ r: 5 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
