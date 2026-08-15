import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App', () => {
  it('se rend sans crasher et affiche la page d’accueil', () => {
    render(<App />);

    expect(screen.getAllByText('BudgetCitoyen.fr')[0]).toBeInTheDocument();
  });
});
