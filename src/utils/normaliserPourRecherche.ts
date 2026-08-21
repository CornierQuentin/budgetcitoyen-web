/**
 * Normalise une chaîne pour une recherche insensible à la casse et aux
 * accents : « defense » doit trouver « Défense », et « ecologie » « Écologie ».
 *
 * `NFD` décompose chaque caractère accentué en sa lettre de base suivie de son
 * diacritique, que l'on retire ensuite — plutôt qu'une table de correspondance
 * à maintenir, qui oublierait toujours un caractère.
 *
 * Fonction partagée : elle était dupliquée à l'identique dans Comparateur et
 * Niches fiscales, et la moindre divergence entre les deux copies (un
 * `trim()` d'un côté, une casse traitée différemment de l'autre) aurait rendu
 * la recherche incohérente d'une page à l'autre sans que rien ne le signale.
 */
export function normaliserPourRecherche(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export default normaliserPourRecherche;
