import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('affiche le label et la valeur courante', () => {
    render(
      <SearchInput id="recherche" label="Rechercher" value="hopital" onChange={vi.fn()} />,
    );

    expect(screen.getByLabelText('Rechercher')).toHaveValue('hopital');
  });

  it('appelle onChange à chaque frappe', () => {
    const onChange = vi.fn();
    render(<SearchInput id="recherche" label="Rechercher" value="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Rechercher'), { target: { value: 'ecole' } });

    expect(onChange).toHaveBeenCalledWith('ecole');
  });
});
