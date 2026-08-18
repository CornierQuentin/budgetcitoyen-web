import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useMediaQuery } from './useMediaQuery';

interface MatchMediaMock {
  mql: MediaQueryList;
  declencherChangement: (matches: boolean) => void;
}

// Même approche que useThemeStore.test.ts : jsdom n'implémente pas
// window.matchMedia, on le simule avec un registre d'écouteurs `change`.
function mockMatchMedia(matches: boolean): MatchMediaMock {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mql = {
    matches,
    media: '(min-width: 768px)',
    onchange: null,
    addEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => {
      if (type === 'change') listeners.add(listener);
    },
    removeEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => {
      if (type === 'change') listeners.delete(listener);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;

  window.matchMedia = vi.fn().mockReturnValue(mql);

  return {
    mql,
    declencherChangement(nextMatches: boolean) {
      (mql as unknown as { matches: boolean }).matches = nextMatches;
      listeners.forEach((listener) => listener({ matches: nextMatches } as MediaQueryListEvent));
    },
  };
}

describe('useMediaQuery', () => {
  it("retourne l'état initial de correspondance de la media query", () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(true);
  });

  it('retourne false quand la media query ne correspond pas', () => {
    mockMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(false);
  });

  it('suit en direct les changements de correspondance', () => {
    const { declencherChangement } = mockMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => {
      declencherChangement(true);
    });

    expect(result.current).toBe(true);
  });
});
