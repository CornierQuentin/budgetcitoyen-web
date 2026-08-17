import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { glossaire } from '../../utils/glossaire';
import { GlossaryTerm } from './GlossaryTerm';

describe('GlossaryTerm', () => {
  it('affiche le texte du terme et sa définition en tooltip', () => {
    render(<GlossaryTerm term="AE">AE</GlossaryTerm>);

    expect(screen.getByText('AE')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent(glossaire.AE);
  });

  it('rend le terme focusable au clavier, pas seulement survolable', () => {
    render(<GlossaryTerm term="CP">CP</GlossaryTerm>);

    const terme = screen.getByRole('button', { name: 'CP' });
    terme.focus();
    expect(terme).toHaveFocus();
  });

  it('lève une erreur si le terme est absent du glossaire', () => {
    // Contourne volontairement le typage GlossaryTermKey pour vérifier le
    // filet de sécurité runtime (ex. faute de frappe passée dynamiquement).
    const TermeInconnu = 'TERME_INEXISTANT' as unknown as Parameters<typeof GlossaryTerm>[0]['term'];

    // React logue une erreur dans la console lors d'un throw en render : on
    // la neutralise ici pour garder une sortie de test propre.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<GlossaryTerm term={TermeInconnu}>Terme</GlossaryTerm>)).toThrow(
      /absent de src\/utils\/glossaire\.ts/,
    );

    consoleError.mockRestore();
  });
});
