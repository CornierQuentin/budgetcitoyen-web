import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { Comparateur } from '../types/domain';

/**
 * Compare deux années budgétaires (missions et recettes, écarts déjà triés
 * par écart absolu décroissant côté backend pour les missions).
 */
export function useComparateur(anneeA: number | undefined, anneeB: number | undefined) {
  return useQuery({
    queryKey: ['comparateur', anneeA, anneeB] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<Comparateur>('/comparateur', {
        params: { annee_a: anneeA, annee_b: anneeB },
      });
      return data;
    },
    enabled: anneeA !== undefined && anneeB !== undefined,
  });
}
