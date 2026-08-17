// Aide partagée pour lire un paramètre numérique (année, revenu...) depuis
// `URLSearchParams` : `null` (paramètre absent) et toute valeur non
// numérique donnent `undefined`. Attention : `Number(null) === 0` (fini) —
// sans le test explicite `raw === null`, un paramètre absent serait
// interprété à tort comme la valeur 0.
export function parseIntSearchParam(raw: string | null): number | undefined {
  if (raw === null) return undefined;
  const valeur = Number(raw);
  return Number.isFinite(valeur) ? valeur : undefined;
}
