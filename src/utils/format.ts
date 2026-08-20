// Fonctions de formatage des nombres pour l'affichage, locale fr-FR.

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  maximumFractionDigits: 1,
});

export function formatEuros(montant: number): string {
  return euroFormatter.format(montant);
}

/**
 * Formate un montant exprimé en euros en une chaîne en milliards d'euros
 * (ex : 12 300 000 000 -> "12,3 Md€").
 */
export function formatMd(montant: number): string {
  const milliards = montant / 1_000_000_000;
  const valeur = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 1,
  }).format(milliards);
  return `${valeur} Md€`;
}

export function formatPct(ratio: number): string {
  return percentFormatter.format(ratio);
}

/**
 * Convertit le `deficit` exposé par l'API — une magnitude TOUJOURS POSITIVE —
 * en solde budgétaire signé, négatif quand les dépenses excèdent les recettes.
 *
 * Le site affiche partout un solde signé : c'est le terme de la loi de
 * finances, une seule règle de signe s'applique, et une année excédentaire
 * s'afficherait naturellement. Le mot « déficit » subsiste comme étiquette
 * d'état (pastille « Déficit » / « Excédent »), jamais comme valeur affichée.
 *
 * Auparavant, les deux conventions cohabitaient : le tableau de bord annonçait
 * « Écart +7,2 Md€ » et le comparateur « Écart de déficit −7,2 Md€ » pour le
 * même fait. Passer par cette fonction est ce qui garantit que cela ne se
 * reproduise pas.
 */
export function soldeDepuisDeficit(deficit: number): number {
  return -deficit;
}

/**
 * Montant signé, avec un « + » explicite devant les valeurs positives. Le
 * signe négatif est laissé à `formatMd` (donc à Intl) : un signe moins
 * typographique écrit à la main jurerait avec le trait d'union produit
 * partout ailleurs.
 */
export function formatEcartMd(valeur: number): string {
  return valeur >= 0 ? `+${formatMd(valeur)}` : formatMd(valeur);
}
