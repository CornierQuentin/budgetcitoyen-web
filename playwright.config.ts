import { defineConfig, devices } from '@playwright/test';

// Tests E2E (CDC section 5.4 : "Playwright — Tests E2E : flux accueil,
// comparateur, budget perso"). Les appels /api/v1/** sont interceptes et
// mockes (voir e2e/helpers/mockApi.ts) : ces tests valident les parcours
// utilisateur reels dans un vrai navigateur (navigation, formulaires,
// mise a jour de l'UI), pas la correction des donnees elles-memes (deja
// couverte par les tests backend Pytest et les tests de hooks Vitest, qui
// verifient le mapping camelCase du contrat reseau reel).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
