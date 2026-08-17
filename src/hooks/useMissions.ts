import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { Mission } from '../types/domain';

/**
 * Récupère la liste des missions budgétaires, optionnellement filtrée par année.
 */
export function useMissions(annee?: number) {
  return useQuery({
    queryKey: ['missions', annee] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<Mission[]>('/missions', {
        params: { annee },
      });
      return data;
    },
  });
}
