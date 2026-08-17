import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { Programme } from '../types/domain';

/**
 * Récupère un programme budgétaire par son id.
 */
export function useProgramme(id: number | undefined, annee?: number) {
  return useQuery({
    queryKey: ['programme', id, annee] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<Programme>(`/programmes/${id}`, {
        params: { annee },
      });
      return data;
    },
    enabled: id !== undefined,
  });
}
