import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Page, Route } from '@playwright/test';

// Fixtures capturees depuis l'API reelle (`docker compose up`, donnees
// ingerees) via `curl`, gardees en snake_case brut : `apiClient` camelize
// deja les reponses cote client (voir `src/services/apiClient.ts`), donc
// mocker en snake_case reproduit fidelement le contrat reseau reel plutot
// que de dupliquer la logique de mapping ici.
//
// Lues via fs plutot qu'un `import ... from '*.json'` : ce dernier exige
// une assertion d'import (`with { type: 'json' }`) sous Node en mode ESM,
// non supportee de la meme facon par le loader TS de Playwright.
const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

function loadFixture(nom: string): Record<string, unknown> | unknown[] {
  return JSON.parse(readFileSync(path.join(fixturesDir, nom), 'utf-8'));
}

type JsonFixture = Record<string, unknown> | unknown[];

const ROUTES: Array<{ pattern: RegExp; body: JsonFixture }> = [
  { pattern: /\/api\/v1\/budget\/annees$/, body: loadFixture('budget-annees.json') },
  { pattern: /\/api\/v1\/budget\/2024$/, body: loadFixture('budget-2024.json') },
  { pattern: /\/api\/v1\/budget\/2025$/, body: loadFixture('budget-2025.json') },
  { pattern: /\/api\/v1\/indicateurs\/2025$/, body: loadFixture('indicateurs-2025.json') },
  {
    pattern: /\/api\/v1\/comparateur\?.*annee_a=2024.*annee_b=2025/,
    body: loadFixture('comparateur-2024-2025.json'),
  },
  {
    pattern: /\/api\/v1\/comparateur\?.*annee_a=2025.*annee_b=2024/,
    body: loadFixture('comparateur-2024-2025.json'),
  },
  {
    pattern: /\/api\/v1\/budget-perso\?.*revenu_net=2000/,
    body: loadFixture('budget-perso-2000.json'),
  },
  {
    pattern: /\/api\/v1\/budget-perso\?.*revenu_net=2500/,
    body: loadFixture('budget-perso-2500.json'),
  },
];

async function handleRoute(route: Route): Promise<void> {
  const url = route.request().url();
  const match = ROUTES.find((r) => r.pattern.test(url));
  if (!match) {
    // Echec explicite plutot qu'un fallback silencieux : une page qui
    // appelle un endpoint non prevu par ce parcours E2E doit faire echouer
    // le test, pas tenter une vraie requete reseau (qui n'aboutirait de
    // toute facon nulle part en CI, sans backend demarre).
    await route.fulfill({ status: 404, json: { detail: `route E2E non mockee: ${url}` } });
    return;
  }
  await route.fulfill({ status: 200, contentType: 'application/json', json: match.body });
}

/** Intercepte tous les appels `/api/v1/**` de la page avec des reponses figees. */
export async function mockApi(page: Page): Promise<void> {
  await page.route('**/api/v1/**', handleRoute);
}
