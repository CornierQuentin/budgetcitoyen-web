import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Pagination } from './Pagination';

describe('Pagination', () => {
  it("ne rend rien quand il n'y a qu'une seule page", () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('affiche la page courante et le total', () => {
    render(<Pagination page={3} totalPages={10} onPageChange={vi.fn()} />);

    expect(screen.getByText('Page 3 / 10')).toBeInTheDocument();
  });

  it('désactive "Précédent" sur la première page et "Suivant" sur la dernière', () => {
    const { rerender } = render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Suivant' })).not.toBeDisabled();

    rerender(<Pagination page={5} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Précédent' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled();
  });

  it('appelle onPageChange avec la page suivante/précédente au clic', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={10} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(onPageChange).toHaveBeenCalledWith(4);

    fireEvent.click(screen.getByRole('button', { name: 'Précédent' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
