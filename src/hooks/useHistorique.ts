import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { AnneeBudget } from '../types/domain';

/**
 * Récupère l'historique pluriannuel du budget de l'État.
 */
export function useHistorique(de?: number, a?: number) {
  return useQuery({
    queryKey: ['historique', de, a] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<AnneeBudget[]>('/budget/historique', {
        params: { de, a },
      });
      return data;
    },
  });
}
