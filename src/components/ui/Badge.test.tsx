import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './Badge';

describe('Badge', () => {
  it('rend son contenu avec les classes de badge par défaut', () => {
    render(<Badge>Nouveau</Badge>);

    expect(screen.getByText('Nouveau')).toHaveClass('rounded-full');
  });

  it('fusionne une className additionnelle', () => {
    render(<Badge className="ma-classe">Info</Badge>);

    expect(screen.getByText('Info')).toHaveClass('ma-classe');
  });
});
