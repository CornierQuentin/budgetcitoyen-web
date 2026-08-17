import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { Recette } from '../types/domain';

/**
 * Récupère les recettes fiscales par type pour une année donnée.
 */
export function useRecettes(annee: number | undefined) {
  return useQuery({
    queryKey: ['recettes', annee] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<Recette[]>(`/recettes/${annee}`);
      return data;
    },
    enabled: annee !== undefined,
  });
}
