import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { Mission } from '../types/budget';

/**
 * Récupère le détail d'une mission budgétaire par son slug.
 * TODO Phase 1 : brancher l'appel réel et le mapping snake_case -> camelCase.
 */
export function useMission(slug: string) {
  return useQuery({
    queryKey: ['mission', slug] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<Mission>(`/missions/${slug}`);
      return data;
    },
    enabled: Boolean(slug),
  });
}
