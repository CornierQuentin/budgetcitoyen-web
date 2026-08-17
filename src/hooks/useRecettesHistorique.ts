import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { Recette, TypeRecette } from '../types/domain';

/**
 * Récupère l'historique pluriannuel des recettes fiscales, optionnellement
 * filtré par type de recette.
 */
export function useRecettesHistorique(de?: number, a?: number, type?: TypeRecette) {
  return useQuery({
    queryKey: ['recettes-historique', de, a, type] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<Recette[]>('/recettes/historique', {
        params: { de, a, type },
      });
      return data;
    },
  });
}
