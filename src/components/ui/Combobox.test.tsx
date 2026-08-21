import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Combobox, type ComboboxOption } from './Combobox';

const options: ComboboxOption[] = [
  { value: 'defense', label: 'Défense' },
  { value: 'justice', label: 'Justice' },
  { value: 'ecologie', label: 'Écologie, développement et mobilité durables' },
];

function renderCombobox(overrides: Partial<Parameters<typeof Combobox>[0]> = {}) {
  const onChange = vi.fn();
  render(
    <Combobox
      id="mission"
      label="Mission"
      options={options}
      value="defense"
      onChange={onChange}
      {...overrides}
    />,
  );
  return { onChange, champ: screen.getByRole('combobox', { name: 'Mission' }) };
}

describe('Combobox', () => {
  it('affiche la sélection courante tant que la liste est fermée', () => {
    const { champ } = renderCombobox();

    expect(champ).toHaveValue('Défense');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(champ).toHaveAttribute('aria-expanded', 'false');
  });

  it('ouvre la liste complète au focus', () => {
    const { champ } = renderCombobox();

    fireEvent.focus(champ);

    expect(champ).toHaveAttribute('aria-expanded', 'true');
    expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(3);
  });

  it('repart d’un champ vide à l’ouverture, pour que la frappe filtre', () => {
    const { champ } = renderCombobox();

    fireEvent.focus(champ);

    // Sinon la saisie s'ajouterait au libellé sélectionné et ne trouverait
    // plus rien dès le premier caractère.
    expect(champ).toHaveValue('');
  });

  it('filtre sans tenir compte des accents ni de la casse', () => {
    const { champ } = renderCombobox();

    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: 'ECOLOGIE' } });

    const trouvees = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(trouvees.map((option) => option.textContent)).toEqual([
      'Écologie, développement et mobilité durables',
    ]);
  });

  it('affiche un message dédié quand rien ne correspond', () => {
    const { champ } = renderCombobox({ messageVide: 'Aucune mission ne correspond.' });

    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: 'zzz' } });

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(screen.getByText('Aucune mission ne correspond.')).toBeInTheDocument();
  });

  it('valide au clavier l’option parcourue aux flèches', () => {
    const { champ, onChange } = renderCombobox();

    fireEvent.focus(champ);
    fireEvent.keyDown(champ, { key: 'ArrowDown' });
    fireEvent.keyDown(champ, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('justice');
  });

  it('boucle en fin de liste plutôt que de bloquer', () => {
    const { champ, onChange } = renderCombobox();

    fireEvent.focus(champ);
    // Depuis la première option, une flèche haut ramène à la dernière.
    fireEvent.keyDown(champ, { key: 'ArrowUp' });
    fireEvent.keyDown(champ, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('ecologie');
  });

  it('remet l’option active en tête après un filtrage', () => {
    const { champ, onChange } = renderCombobox();

    fireEvent.focus(champ);
    fireEvent.keyDown(champ, { key: 'ArrowDown' });
    fireEvent.keyDown(champ, { key: 'ArrowDown' });
    // L'index pointait sur la 3e option ; après filtrage il n'en reste qu'une,
    // et un index laissé en place ne désignerait plus rien.
    fireEvent.change(champ, { target: { value: 'justice' } });
    fireEvent.keyDown(champ, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('justice');
  });

  it('referme sans rien changer sur Échap', () => {
    const { champ, onChange } = renderCombobox();

    fireEvent.focus(champ);
    fireEvent.keyDown(champ, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(champ).toHaveValue('Défense');
  });

  it('referme au clic en dehors, sans rien changer', () => {
    const { champ, onChange } = renderCombobox();

    fireEvent.focus(champ);
    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('désigne l’option active par aria-activedescendant', () => {
    const { champ } = renderCombobox();

    fireEvent.focus(champ);
    const premiere = within(screen.getByRole('listbox')).getAllByRole('option')[0];

    expect(champ).toHaveAttribute('aria-activedescendant', premiere.id);
  });

  it('marque la sélection courante pour les lecteurs d’écran', () => {
    const { champ } = renderCombobox();

    fireEvent.focus(champ);

    expect(screen.getByRole('option', { name: 'Défense' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('option', { name: 'Justice' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });
});
