/**
 * Rampe séquentielle d'une seule teinte, pour les camemberts de répartition.
 *
 * Les maquettes validées (design/maquette-tableau-de-bord.html,
 * design/maquettes-pages-restantes.html) déclinent six paliers `--d1`…`--d6`
 * d'un même bleu. Une rampe monochrome plutôt qu'une palette catégorielle :
 * les tranches d'un camembert de répartition sont TRIÉES par montant
 * décroissant, donc la position dans la rampe redit la quantité au lieu de
 * n'être qu'un identifiant arbitraire.
 *
 * Les paliers des maquettes ne sont que six ; les répartitions réelles vont
 * jusqu'à dix tranches. On interpole donc entre les deux extrémités de la
 * rampe plutôt que de recycler six couleurs en boucle (deux tranches
 * partageraient alors exactement la même couleur, ce qui casserait la lecture
 * ordonnée que la rampe cherche justement à porter).
 */

// Extrémités reprises telles quelles des maquettes : --d1 et --d6 du thème
// clair, --d1 et --d6 du thème sombre. En sombre la rampe part du ton le plus
// clair : sur un fond sombre, c'est le clair qui « pèse » le plus.
const EXTREMITES_CLAIR: [string, string] = ['#16326b', '#dbe4f3'];
const EXTREMITES_SOMBRE: [string, string] = ['#b9caea', '#1a2b4d'];

function versRvb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function versHex([r, v, b]: [number, number, number]): string {
  const composante = (valeur: number) => Math.round(valeur).toString(16).padStart(2, '0');
  return `#${composante(r)}${composante(v)}${composante(b)}`;
}

/**
 * Renvoie `nombreTranches` couleurs réparties régulièrement entre les deux
 * extrémités de la rampe du thème demandé. Une seule tranche reçoit
 * l'extrémité la plus soutenue (pas de division par zéro).
 */
export function rampeSequentielle(nombreTranches: number, estSombre: boolean): string[] {
  const [debut, fin] = estSombre ? EXTREMITES_SOMBRE : EXTREMITES_CLAIR;
  if (nombreTranches <= 0) return [];

  const rvbDebut = versRvb(debut);
  const rvbFin = versRvb(fin);

  return Array.from({ length: nombreTranches }, (_, index) => {
    const position = nombreTranches === 1 ? 0 : index / (nombreTranches - 1);
    return versHex([
      rvbDebut[0] + (rvbFin[0] - rvbDebut[0]) * position,
      rvbDebut[1] + (rvbFin[1] - rvbDebut[1]) * position,
      rvbDebut[2] + (rvbFin[2] - rvbDebut[2]) * position,
    ]);
  });
}

export default rampeSequentielle;
