import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import Header from './Header';

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
});
