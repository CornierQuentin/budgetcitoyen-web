import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../services/apiClient';
import type { BudgetPerso } from '../types/domain';

/**
 * Calcule la contribution personnelle estimée au budget de l'État à partir
 * d'un revenu net mensuel. Ce n'est pas un fetch automatique au montage :
 * tant que `revenuNet` est `undefined` (aucune soumission du formulaire),
 * la requête reste désactivée. Le composant appelant passe `revenuNet`
 * uniquement après soumission, ce qui déclenche le fetch.
 */
export function useBudgetPerso(revenuNet: number | undefined) {
  return useQuery({
    queryKey: ['budget-perso', revenuNet] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<BudgetPerso>('/budget-perso', {
        params: { revenu_net: revenuNet },
      });
      return data;
    },
    enabled: revenuNet !== undefined,
  });
}
