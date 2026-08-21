import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import Footer from './Footer';

describe('Footer', () => {
  it('affiche la mention de licence et de source des données', () => {
    render(<Footer />);

    expect(screen.getByText(/AGPL-3\.0-or-later/)).toBeInTheDocument();
    expect(screen.getByText(/sources officielles/)).toBeInTheDocument();
  });

  it("n'affiche pas de liens dans la coque applicative, où le rail y donne déjà accès", () => {
    render(<Footer />);

    expect(screen.queryByRole('navigation', { name: /pied de page/i })).not.toBeInTheDocument();
  });

  it("expose données, API et code source dans la variante d'accueil", () => {
    render(
      <MemoryRouter>
        <Footer gouttiereAccueil />
      </MemoryRouter>,
    );

    const pied = screen.getByRole('navigation', { name: /pied de page/i });

    expect(screen.getByRole('link', { name: /données/i })).toHaveAttribute('href', '/donnees');
    // La documentation vit hors du préfixe versionné de l'API : le lien doit
    // pointer sur /api/docs, jamais sur /api/v1/api/docs.
    expect(screen.getByRole('link', { name: 'API' }).getAttribute('href')).toMatch(/\/api\/docs$/);
    expect(screen.getByRole('link', { name: /code source/i })).toHaveAttribute(
      'href',
      'https://github.com/CornierQuentin/budgetcitoyen-web',
    );
    expect(pied).toBeInTheDocument();
  });
});
