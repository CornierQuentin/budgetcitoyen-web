import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { AnneeBudget } from '../types/budget';

/**
 * Récupère l'historique pluriannuel du budget de l'État.
 * TODO Phase 1 : brancher l'appel réel et le mapping snake_case -> camelCase.
 */
export function useHistorique() {
  return useQuery({
    queryKey: ['historique'] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<AnneeBudget[]>('/historique');
      return data;
    },
  });
}
