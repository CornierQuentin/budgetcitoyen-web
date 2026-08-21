// Regroupement « top N + Autres », utilisé pour garder un camembert lisible
// quand la liste de catégories dépasse la dizaine (ex : ~30 missions
// budgétaires). Fonction pure et testable indépendamment de DonutChart, qui
// reste un composant graphique générique {label, value}[] — c'est ici, côté
// appelant (Dashboard), que la décision « combien de tranches distinctes »
// est prise.

/**
 * Nombre maximal de tranches distinctes d'un camembert de répartition, le
 * reste étant regroupé dans « Autres ».
 *
 * Une seule valeur pour tous les camemberts du site : trois pages traçaient
 * la même chose avec trois plafonds différents (8 missions, 9 catégories
 * d'impôt, 10 divisions d'achat), sans qu'aucune raison ne distingue les
 * cas — un lecteur passant d'une page à l'autre n'a aucun moyen de savoir
 * que « Autres » ne recouvre pas la même chose.
 *
 * 10 plutôt que 8 : c'est la valeur qui laisse le plus de catégories
 * nommées tout en restant lisible, vérifiée sur le cas le plus dense (les
 * 46 divisions d'achat des marchés publics).
 */
export const NB_TRANCHES_MAX_CAMEMBERT = 10;

export interface ItemAgregeable {
  label: string;
  value: number;
}

export interface ItemAvecDetail extends ItemAgregeable {
  /**
   * Sous-éléments regroupés dans cette entrée (uniquement présent sur la
   * tranche « Autres ») : permet à l'appelant (ex. tooltip de DonutChart)
   * d'afficher le détail des catégories agrégées.
   */
  details?: ItemAgregeable[];
}

const LABEL_AUTRES_PAR_DEFAUT = 'Autres';

/**
 * Trie `items` par valeur décroissante et conserve les `n` plus gros tels
 * quels ; le reste est cumulé dans une entrée unique `labelAutres` (valeur =
 * somme, avec le détail trié décroissant dans `details`).
 *
 * Si `items` tient déjà en `n` éléments ou moins, aucune agrégation n'a lieu
 * (retourne simplement la liste triée, sans entrée « Autres »).
 */
export function topNAvecAutres(
  items: ItemAgregeable[],
  n: number,
  labelAutres: string = LABEL_AUTRES_PAR_DEFAUT,
): ItemAvecDetail[] {
  const tries = items.slice().sort((a, b) => b.value - a.value);

  if (tries.length <= n) {
    return tries;
  }

  const top = tries.slice(0, n);
  const reste = tries.slice(n);
  const totalAutres = reste.reduce((somme, item) => somme + item.value, 0);

  return [
    ...top,
    {
      label: labelAutres,
      value: totalAutres,
      details: reste,
    },
  ];
}
