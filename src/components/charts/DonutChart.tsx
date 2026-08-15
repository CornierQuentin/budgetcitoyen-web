export interface ChartDatum {
  label: string;
  value: number;
}

interface DonutChartProps {
  data: ChartDatum[];
}

/**
 * Graphique en anneau (répartition des dépenses ou recettes).
 * TODO Phase 1 : implémenter le rendu réel avec Recharts.
 */
export function DonutChart({ data }: DonutChartProps) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500">
      Graphique en anneau — à implémenter Phase 1 ({data.length} éléments)
    </div>
  );
}

export default DonutChart;
