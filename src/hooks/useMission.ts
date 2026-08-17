import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { Mission } from '../types/domain';

/**
 * Récupère une mission budgétaire par son slug, optionnellement pour une
 * année donnée (dernière année disponible côté API si omise).
 */
export function useMission(slug: string | undefined, annee?: number) {
  return useQuery({
    queryKey: ['mission', slug, annee] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<Mission>(`/missions/${slug}`, {
        params: { annee },
      });
      return data;
    },
    enabled: Boolean(slug),
  });
}
