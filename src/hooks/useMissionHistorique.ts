import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { MissionHistoriqueItem } from '../types/domain';

/**
 * Récupère la série annuelle d'une mission : son montant (crédits de
 * paiement) et son libellé officiel, année par année. Le libellé fait partie
 * de la série et n'est pas déduit une fois pour toutes : une mission gardant
 * le même slug peut être renommée d'une loi de finances à l'autre.
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
