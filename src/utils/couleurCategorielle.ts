// Attribution de couleur catégorielle pour les graphiques (DonutChart), avec
// une contrainte forte : la couleur d'une catégorie (mission, type de
// recette...) doit être stable d'une année sur l'autre, indépendamment de
// l'ordre ou de la composition des données reçues.
//
// Palette catégorielle validée (skill dataviz) — mêmes 8 couleurs que
// l'ancienne palette de DonutChart, seule la règle d'attribution change
// (hash du libellé plutôt qu'index de position dans le tableau).
export const CATEGORICAL_COLORS = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
];

// Gris neutre fixe pour toute tranche « divers » (la tranche « Autres » d'un
// regroupement top-N, ou un type de recette réellement nommé « Autres ») :
// jamais tirée de la palette catégorielle ci-dessus, pour deux raisons —
// sémantique (« divers » n'est pas une identité au même titre qu'une mission
// ou un type de recette précis) et pratique (ça libère une collision
// possible avec le hash d'un vrai libellé).
export const COULEUR_AUTRES = '#9ca3af';

function estLabelAutres(label: string): boolean {
  return label.trim().toLowerCase() === 'autres';
}

// Grand nombre premier utilisé pour borner l'accumulateur du hash à chaque
// caractère (voir indexHashLabel) : évite toute perte de précision flottante
// sur un libellé long (`Number` ne représente exactement les entiers que
// jusqu'à 2^53), sans recourir à un opérateur bit à bit (`no-bitwise` est
// interdit par la config ESLint du projet).
const MODULO_HASH = 1_000_000_007;

/**
 * Index déterministe dans une palette de taille `tailleModulo`, calculé à
 * partir du libellé. Volontairement simple (pas de fonction de hash
 * cryptographique) : l'objectif n'est pas de répartir les libellés
 * uniformément, mais qu'un même libellé retombe toujours sur le même index,
 * année après année.
 *
 * Hash polynomial classique (`h = h*31 + codePoint`, cf. `String.hashCode`
 * de Java) plutôt qu'une simple somme des points de code : une somme ignore
 * l'ordre des caractères, ce qui multiplie les collisions sur des libellés
 * courts (en pratique, « IR » et « TVA » retombaient sur le même index avec
 * une somme — un cas réel et gênant vu le petit nombre de types de recette).
 */
export function indexHashLabel(label: string, tailleModulo: number): number {
  if (tailleModulo <= 0) return 0;
  const hash = Array.from(label).reduce(
    (accumulateur, caractere) =>
      (accumulateur * 31 + (caractere.codePointAt(0) ?? 0)) % MODULO_HASH,
    0,
  );
  return hash % tailleModulo;
}

/**
 * Couleur d'une catégorie de graphique, stable pour un libellé donné quels
 * que soient l'ordre ou les autres libellés présents (contrairement à un
 * `CATEGORICAL_COLORS[index % 8]` positionnel, qui fait « sauter » les
 * couleurs d'une mission d'une année sur l'autre si la composition du
 * classement change).
 *
 * Compromis assumé — et volontaire, pas une négligence : deux libellés
 * distincts peuvent produire le même index de hash (collision) et donc la
 * même couleur s'ils apparaissent tous les deux dans un même graphique.
 * Avec 8 couleurs et jusqu'à 8 tranches nommées par graphique (top-N +
 * Autres), le paradoxe des anniversaires rend même ce cas plus fréquent
 * qu'« rare » à proprement parler. Une résolution de collision « au sein
 * d'un graphique » (ex. adressage ouvert : décaler le libellé perdant vers
 * le prochain index libre) a été envisagée puis écartée : elle ferait
 * dépendre la couleur d'un libellé de l'ENSEMBLE des libellés co-affichés,
 * donc de la composition du classement — exactement l'instabilité que ce
 * hash cherche à éliminer (vérifié : une mission peut alors changer de
 * couleur d'une année à l'autre simplement parce qu'une AUTRE mission entre
 * ou sort du top-N, sans que la mission elle-même ait changé). On préfère
 * donc assumer la collision plutôt que d'échanger un défaut visible mais
 * bénin (deux tranches de même teinte, identifiables via légende/tooltip)
 * contre une instabilité plus difficile à repérer.
 */
export function couleurPourLabel(label: string): string {
  if (estLabelAutres(label)) return COULEUR_AUTRES;
  return CATEGORICAL_COLORS[indexHashLabel(label, CATEGORICAL_COLORS.length)];
}
