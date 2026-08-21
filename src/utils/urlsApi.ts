/**
 * URL de la documentation interactive de l'API (Swagger UI).
 *
 * Dérivée de `VITE_API_BASE_URL` plutôt que codée en dur : cette base vaut
 * `http://localhost:8001/api/v1` en développement et pointera ailleurs en
 * production. Le backend expose la documentation sur `/api/docs` (cf.
 * `docs_url` dans api/main.py, conforme à l'arbre de navigation du cahier
 * des charges), donc en dehors du préfixe versionné `/api/v1`.
 *
 * Deux formes de base sont acceptées :
 * - absolue (`http://hôte/api/v1`) → on repart de l'origine ;
 * - relative (`/api/v1`, cas d'un frontend servi par le même hôte) → on
 *   produit un chemin relatif.
 */
export function urlDocumentationApi(
  base: string | undefined = import.meta.env.VITE_API_BASE_URL,
): string {
  const CHEMIN_DOCS = '/api/docs';

  if (!base) return CHEMIN_DOCS;

  try {
    return new URL(CHEMIN_DOCS, new URL(base).origin).toString();
  } catch {
    // Base relative : `new URL` échoue sans origine, le chemin suffit.
    return CHEMIN_DOCS;
  }
}

export default urlDocumentationApi;
