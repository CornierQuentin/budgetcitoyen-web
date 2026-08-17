import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { AnneeBudgetDetail } from '../types/domain';

/**
 * Récupère le détail budgétaire complet d'une année (dette/PIB, source).
 */
export function useBudgetAnnee(annee: number | undefined) {
  return useQuery({
    queryKey: ['budget-annee', annee] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<AnneeBudgetDetail>(`/budget/${annee}`);
      return data;
    },
    enabled: annee !== undefined,
  });
}
