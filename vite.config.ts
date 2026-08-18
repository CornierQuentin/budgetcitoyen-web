/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    // e2e/**/*.spec.ts sont des tests Playwright (autre test runner, autre
    // convention de globals `test`/`expect`) : le glob par defaut de Vitest
    // matcherait aussi ces fichiers *.spec.ts sans cette exclusion.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Réinitialise les compteurs d'appel (mock.calls) de tous les mocks vi.fn()
    // avant chaque test, pour que "toHaveBeenCalledWith" / "not.toHaveBeenCalled"
    // dans un test ne soient jamais pollués par les appels d'un test précédent
    // du même fichier (utile notamment pour les mocks partagés d'apiClient.get).
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/setupTests.ts',
        'src/testUtils/**',
        'src/types/**',
      ],
    },
  },
});
