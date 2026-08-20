import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('rend son contenu et déclenche onClick au clic', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Valider</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applique les classes du variant secondary quand demandé', () => {
    render(<Button variant="secondary">Annuler</Button>);

    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveClass('bg-surface');
  });

  it('applique les classes du variant primary par défaut', () => {
    render(<Button>Envoyer</Button>);

    expect(screen.getByRole('button', { name: 'Envoyer' })).toHaveClass('bg-accent');
  });

  it('applique la taille compacte quand demandée', () => {
    render(
      <Button size="sm" variant="ghost">
        Compact
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'Compact' })).toHaveClass('h-7');
  });

  it('respecte l’attribut disabled transmis', () => {
    render(<Button disabled>Désactivé</Button>);

    expect(screen.getByRole('button', { name: 'Désactivé' })).toBeDisabled();
  });
});
