import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { Nav } from './Nav';

describe('Nav', () => {
  it('affiche un lien vers chacune des pages principales', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Accueil' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Tableau de bord' })).toHaveAttribute(
      'href',
      '/tableau-de-bord',
    );
    expect(screen.getByRole('link', { name: 'Historique' })).toHaveAttribute(
      'href',
      '/historique',
    );
    expect(screen.getByRole('link', { name: 'Comparateur' })).toHaveAttribute('href', '/comparer');
    expect(screen.getByRole('link', { name: 'Mon budget' })).toHaveAttribute(
      'href',
      '/mon-budget',
    );
    expect(screen.getByRole('link', { name: 'Simulateur' })).toHaveAttribute(
      'href',
      '/simulateur',
    );
    expect(screen.getByRole('link', { name: 'Niches fiscales' })).toHaveAttribute(
      'href',
      '/depenses-fiscales',
    );
    expect(screen.getByRole('link', { name: 'Marchés publics' })).toHaveAttribute(
      'href',
      '/marches-publics',
    );
    expect(screen.getByRole('link', { name: 'Données' })).toHaveAttribute('href', '/donnees');
  });
});
