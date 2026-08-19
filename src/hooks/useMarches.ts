import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { MarchesBornes, MarchesCpvRepartitionItem, MarchesPage } from '../types/domain';

export interface MarchesFiltres {
  q?: string;
  dateDebut?: string;
  dateFin?: string;
  montantMin?: number;
  montantMax?: number;
  cpvDivision?: string;
}

interface MarchesParams extends MarchesFiltres {
  page: number;
  pageSize: number;
}

function filtresEnParamsApi(filtres: MarchesFiltres) {
  return {
    q: filtres.q,
    date_debut: filtres.dateDebut,
    date_fin: filtres.dateFin,
    montant_min: filtres.montantMin,
    montant_max: filtres.montantMax,
    cpv_division: filtres.cpvDivision,
  };
}

/**
 * Récupère une page de marchés publics, filtrée. `placeholderData:
 * keepPreviousData` (API v5 de @tanstack/react-query) affiche la page
 * précédente pendant le chargement de la suivante, plutôt qu'un flash vide.
 */
export function useMarches(params: MarchesParams) {
  return useQuery({
    queryKey: ['marches', params] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<MarchesPage>('/marches', {
        params: {
          ...filtresEnParamsApi(params),
          page: params.page,
          page_size: params.pageSize,
        },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Répartition des marchés par division CPV, sous les mêmes filtres que
 * useMarches (hors pagination) — agrégée côté serveur, jamais recalculée
 * côté client sur des lignes déjà chargées (le jeu de données ne tient pas
 * en mémoire, contrairement à DepensesFiscales).
 */
export function useMarchesRepartitionCpv(filtres: MarchesFiltres) {
  return useQuery({
    queryKey: ['marches-repartition-cpv', filtres] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<MarchesCpvRepartitionItem[]>(
        '/marches/repartition-cpv',
        { params: filtresEnParamsApi(filtres) },
      );
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

/** Bornes réelles (date/montant min-max) pour calibrer les sélecteurs de filtre. */
export function useMarchesBornes() {
  return useQuery({
    queryKey: ['marches-bornes'] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<MarchesBornes>('/marches/bornes');
      return data;
    },
  });
}
