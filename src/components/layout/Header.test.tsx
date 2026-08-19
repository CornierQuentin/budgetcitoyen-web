import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Header from './Header';

interface MatchMediaMock {
  declencherChangement: (matches: boolean) => void;
}

// Même approche que useMediaQuery.test.ts : jsdom n'implémente pas
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
    declencherChangement(nextMatches: boolean) {
      (mql as unknown as { matches: boolean }).matches = nextMatches;
      listeners.forEach((listener) => listener({ matches: nextMatches } as MediaQueryListEvent));
    },
  };
}

describe('Header', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it("affiche le lien vers l'accueil et la navigation principale", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'BudgetCitoyen.fr' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument();
  });

  it('bascule le thème sombre/clair au clic sur le bouton dédié', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const toggle = screen.getByRole('button', { name: /passer en mode sombre/i });
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(toggle);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('button', { name: /passer en mode clair/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /passer en mode clair/i }));

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('ouvre/ferme le menu mobile au clic sur le bouton hamburger', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const bouton = screen.getByRole('button', { name: 'Ouvrir le menu' });
    expect(bouton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(bouton);

    expect(screen.getByRole('button', { name: 'Fermer le menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fermer le menu' }));

    expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('referme le menu mobile après un clic sur un lien de navigation', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    expect(screen.getByRole('button', { name: 'Fermer le menu' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Historique' }));

    expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toBeInTheDocument();
  });

  it('referme automatiquement le menu mobile si la fenêtre repasse en largeur desktop', () => {
    const { declencherChangement } = mockMatchMedia(false);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    expect(screen.getByRole('button', { name: 'Fermer le menu' })).toBeInTheDocument();

    act(() => {
      declencherChangement(true);
    });

    expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toBeInTheDocument();
  });
});
