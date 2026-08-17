import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { MissionHistoriqueItem } from '../types/domain';

/**
 * Récupère l'historique des libellés officiels d'une mission (l'API ne
 * fournit pas de série de montants par année sur cet endpoint).
 */
export function useMissionHistorique(slug: string | undefined, de?: number, a?: number) {
  return useQuery({
    queryKey: ['mission-historique', slug, de, a] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<MissionHistoriqueItem[]>(
        `/missions/${slug}/historique`,
        { params: { de, a } },
      );
      return data;
    },
    enabled: Boolean(slug),
  });
}
