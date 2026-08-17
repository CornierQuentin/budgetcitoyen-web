import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const THEME_STORAGE_KEY = 'theme';

interface MatchMediaMock {
  mql: MediaQueryList;
  /** Simule un changement de la préférence système en direct. */
  declencherChangementSysteme: (matches: boolean) => void;
}

// jsdom n'implémente pas window.matchMedia : on le simule nous-mêmes, avec un
// registre d'écouteurs `change` pour pouvoir déclencher un changement de
// préférence système à la volée dans les tests.
function mockMatchMedia(matches: boolean): MatchMediaMock {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mql = {
    matches,
    media: '(prefers-color-scheme: dark)',
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
    declencherChangementSysteme(nextMatches: boolean) {
      (mql as unknown as { matches: boolean }).matches = nextMatches;
      listeners.forEach((listener) => listener({ matches: nextMatches } as MediaQueryListEvent));
    },
  };
}

describe('useThemeStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.resetModules();
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it("s'initialise sur la préférence système (clair) quand aucun choix n'est stocké", async () => {
    mockMatchMedia(false);

    const { useThemeStore } = await import('./useThemeStore');

    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it("s'initialise sur la préférence système (sombre) quand aucun choix n'est stocké, et pose la classe dark", async () => {
    mockMatchMedia(true);

    const { useThemeStore } = await import('./useThemeStore');

    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('lit un choix déjà stocké en localStorage en priorité sur la préférence système', async () => {
    mockMatchMedia(true); // préférence système : sombre
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');

    const { useThemeStore } = await import('./useThemeStore');

    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggleTheme bascule le thème, applique la classe dark et persiste en localStorage', async () => {
    mockMatchMedia(false);

    const { useThemeStore } = await import('./useThemeStore');

    useThemeStore.getState().toggleTheme();

    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    useThemeStore.getState().toggleTheme();

    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it("suit les changements de préférence système en direct tant qu'aucun choix manuel n'a été fait", async () => {
    const { declencherChangementSysteme } = mockMatchMedia(false);

    const { useThemeStore } = await import('./useThemeStore');
    expect(useThemeStore.getState().theme).toBe('light');

    declencherChangementSysteme(true);

    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('ignore les changements de préférence système une fois un choix manuel explicite effectué', async () => {
    const { declencherChangementSysteme } = mockMatchMedia(false);

    const { useThemeStore } = await import('./useThemeStore');

    useThemeStore.getState().toggleTheme(); // choix manuel -> sombre
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    declencherChangementSysteme(false); // le système repasse en clair : ne doit rien changer

    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
