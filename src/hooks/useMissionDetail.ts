import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { MissionDetail } from '../types/domain';

/**
 * Récupère la décomposition programmes/actions d'une mission (Module 4 du CDC).
 */
export function useMissionDetail(slug: string | undefined, annee?: number) {
  return useQuery({
    queryKey: ['mission-detail', slug, annee] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<MissionDetail>(`/missions/${slug}/detail`, {
        params: { annee },
      });
      return data;
    },
    enabled: Boolean(slug),
  });
}
