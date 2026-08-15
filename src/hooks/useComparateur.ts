import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { AnneeBudget } from '../types/budget';

/**
 * Récupère les données budgétaires de deux années à comparer.
 * TODO Phase 1 : brancher l'appel réel et le mapping snake_case -> camelCase.
 */
export function useComparateur(anneeA: number, anneeB: number) {
  return useQuery({
    queryKey: ['comparateur', anneeA, anneeB] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<[AnneeBudget, AnneeBudget]>('/comparateur', {
        params: { anneeA, anneeB },
      });
      return data;
    },
  });
}
