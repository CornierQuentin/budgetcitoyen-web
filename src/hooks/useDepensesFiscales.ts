import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { DepenseFiscale } from '../types/domain';

/**
 * Récupère les mesures de dépenses fiscales (niches fiscales) d'une année.
 */
export function useDepensesFiscales(annee: number | undefined) {
  return useQuery({
    queryKey: ['depenses-fiscales', annee] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<DepenseFiscale[]>(`/depenses-fiscales/${annee}`);
      return data;
    },
    enabled: annee !== undefined,
  });
}

/**
 * Récupère la liste des années disponibles pour les dépenses fiscales.
 */
export function useDepensesFiscalesAnnees() {
  return useQuery({
    queryKey: ['depenses-fiscales-annees'] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<number[]>('/depenses-fiscales/annees');
      return data;
    },
  });
}
