import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { IndicateurMacro } from '../types/domain';

/**
 * Récupère les indicateurs macro-économiques (PIB, population) d'une année.
 */
export function useIndicateur(annee: number | undefined) {
  return useQuery({
    queryKey: ['indicateur', annee] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<IndicateurMacro>(`/indicateurs/${annee}`);
      return data;
    },
    enabled: annee !== undefined,
  });
}
