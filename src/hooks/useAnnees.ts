import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { AnneeBudget } from '../types/domain';

/**
 * Récupère la liste des années budgétaires disponibles (agrégats simples).
 */
export function useAnnees() {
  return useQuery({
    queryKey: ['annees'] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<AnneeBudget[]>('/budget/annees');
      return data;
    },
  });
}
