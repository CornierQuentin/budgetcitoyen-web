export interface ChartDatum {
  label: string;
  value: number;
}

interface BudgetTreemapProps {
  data: ChartDatum[];
}

/**
 * Treemap des dépenses budgétaires (missions/programmes/actions).
 * TODO Phase 1 : implémenter le rendu réel avec Recharts/D3.
 */
export default function BudgetTreemap({ data }: BudgetTreemapProps) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500">
      Graphique Treemap budgétaire — à implémenter Phase 1 ({data.length} éléments)
    </div>
  );
}

