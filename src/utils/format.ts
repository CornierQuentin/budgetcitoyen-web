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
