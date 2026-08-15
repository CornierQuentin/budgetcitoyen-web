export interface ChartDatum {
  label: string;
  value: number;
}

interface LineChartProps {
  data: ChartDatum[];
}

/**
 * Courbe d'évolution pluriannuelle (historique budgétaire).
 * TODO Phase 1 : implémenter le rendu réel avec Recharts.
 */
export default function LineChart({ data }: LineChartProps) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500">
      Graphique linéaire — à implémenter Phase 1 ({data.length} éléments)
    </div>
  );
}

