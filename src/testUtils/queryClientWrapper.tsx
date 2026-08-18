import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Wrapper `renderHook`/`render` avec un QueryClient neuf par appel (aucun
 * cache partagé entre tests) et les retries désactivés, pour que les
 * requêtes en erreur simulées échouent immédiatement au lieu de réessayer
 * plusieurs fois (ce qui ralentirait inutilement les tests).
 */
export function createQueryClientWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

export default createQueryClientWrapper;
