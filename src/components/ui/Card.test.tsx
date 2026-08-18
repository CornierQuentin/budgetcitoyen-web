import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card } from './Card';

describe('Card', () => {
  it('rend son contenu', () => {
    render(<Card>Contenu de la carte</Card>);

    expect(screen.getByText('Contenu de la carte')).toBeInTheDocument();
  });

  it('fusionne une className additionnelle avec les classes par défaut', () => {
    render(<Card className="ma-classe">Contenu</Card>);

    const carte = screen.getByText('Contenu');
    expect(carte).toHaveClass('ma-classe');
    expect(carte).toHaveClass('rounded-lg');
  });
});
