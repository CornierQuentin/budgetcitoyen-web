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

// Aide equivalente pour un parametre texte (recherche, filtre...) : une
// chaine vide (champ vide dans l'URL, ex. "?q=") est traitee comme absente,
// pas comme une recherche sur "".
export function parseStringSearchParam(raw: string | null): string | undefined {
  if (raw === null || raw === '') return undefined;
  return raw;
}
