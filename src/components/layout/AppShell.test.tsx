import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AppShell from './AppShell';

interface MatchMediaMock {
  declencherChangement: (matches: boolean) => void;
}

// Même approche que useMediaQuery.test.ts : jsdom n'implémente pas
// window.matchMedia, on le simule avec un registre d'écouteurs `change`.
function mockMatchMedia(matches: boolean): MatchMediaMock {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mql = {
    matches,
    media: '(min-width: 1024px)',
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

function renderShell() {
  return render(
    <MemoryRouter>
      <AppShell>
        <p>Contenu de page</p>
      </AppShell>
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it("affiche le lien vers l'accueil, la navigation principale et le contenu de page", () => {
    renderShell();

    expect(screen.getByRole('link', { name: /BudgetCitoyen\.fr/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument();
    expect(screen.getByText('Contenu de page')).toBeInTheDocument();
  });

  it('bascule le thème sombre/clair au clic sur le bouton dédié', () => {
    renderShell();

    const toggle = screen.getByRole('button', { name: /passer en mode sombre/i });
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(toggle);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('button', { name: /passer en mode clair/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /passer en mode clair/i }));

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('ouvre/ferme le tiroir de navigation au clic sur le bouton hamburger', () => {
    renderShell();

    const bouton = screen.getByRole('button', { name: 'Ouvrir le menu' });
    expect(bouton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(bouton);

    // Le voile porte le même nom accessible que le bouton une fois ouvert :
    // on cible donc explicitement celui qui pilote la navigation.
    const boutonFermer = screen
      .getAllByRole('button', { name: 'Fermer le menu' })
      .find((element) => element.hasAttribute('aria-expanded'));
    expect(boutonFermer).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(boutonFermer as HTMLElement);

    expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('referme le tiroir après un clic sur un lien de navigation', () => {
    renderShell();

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    fireEvent.click(screen.getByRole('link', { name: 'Historique' }));

    expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toBeInTheDocument();
  });

  it('referme le tiroir avec la touche Échap', () => {
    renderShell();

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toBeInTheDocument();
  });

  it('referme automatiquement le tiroir si la fenêtre repasse en largeur desktop', () => {
    const { declencherChangement } = mockMatchMedia(false);

    renderShell();

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));

    act(() => {
      declencherChangement(true);
    });

    expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toBeInTheDocument();
  });
});
