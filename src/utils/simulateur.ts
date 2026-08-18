// Logique de calcul pure du simulateur budgétaire interactif (CDC section
// 2.2 : « Refais le budget »).
//
// Ne recalcule PAS le déficit à partir d'un total dépenses/recettes
// reconstruit bottom-up (Σ missions / Σ recettes) : `recettes_nettes` (donc
// `budget.deficit`) déduit les PSR (prélèvements sur recettes), qui ne sont
// PAS des lignes de la table `recette` — reconstruire un total à partir de
// `/recettes/{annee}` seul redonnerait donc une valeur différente de
// `budget.deficit` pour la même année (déjà la source d'un vrai bug de
// déficit par le passé côté backend, cf. JOURNAL.md). On calcule à la place
// un delta par rapport à la référence officielle et on l'applique dessus :
// le déficit simulé, curseurs à 0%, est donc TOUJOURS identique au déficit
// affiché ailleurs dans l'app pour la même année.

export interface AjustementLigne {
  /** Identifiant stable de la ligne ajustée (slug de mission, ou type de recette). */
  cle: string;
  /** Montant de référence (avant ajustement), en euros. */
  montantActuel: number;
  /** Ajustement en pourcentage du montant actuel (ex: -50 à +100, 0 = inchangé). */
  ajustementPct: number;
}

/** Nouveau montant d'une ligne après application de son ajustement en %. */
export function montantAjuste(ligne: AjustementLigne): number {
  return ligne.montantActuel * (1 + ligne.ajustementPct / 100);
}

/** Somme des écarts (nouveau - actuel) sur un ensemble de lignes ajustées. */
export function sommeDesDeltas(lignes: AjustementLigne[]): number {
  return lignes.reduce((total, ligne) => total + (montantAjuste(ligne) - ligne.montantActuel), 0);
}

export interface ResultatSimulation {
  depensesAjustees: number;
  recettesAjustees: number;
  deficitAjuste: number;
  deltaDepenses: number;
  deltaRecettes: number;
  deltaDeficit: number;
}

/**
 * Calcule le résultat du simulateur à partir des lignes ajustées (missions
 * en mode simple, missions + types de recette fiscaux en mode avancé) et de
 * la référence officielle de l'année (`/budget/{annee}`).
 */
export function simuler(
  depensesReference: number,
  recettesReference: number,
  deficitReference: number,
  missionsAjustees: AjustementLigne[],
  recettesAjustees: AjustementLigne[],
): ResultatSimulation {
  const deltaDepenses = sommeDesDeltas(missionsAjustees);
  const deltaRecettes = sommeDesDeltas(recettesAjustees);

  return {
    depensesAjustees: depensesReference + deltaDepenses,
    recettesAjustees: recettesReference + deltaRecettes,
    deficitAjuste: deficitReference + deltaDepenses - deltaRecettes,
    deltaDepenses,
    deltaRecettes,
    deltaDeficit: deltaDepenses - deltaRecettes,
  };
}
