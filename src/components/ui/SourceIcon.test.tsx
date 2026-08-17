import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SourceIcon } from './SourceIcon';

describe('SourceIcon', () => {
  it("rend un lien pointant vers l'URL source, ouvert dans un nouvel onglet", () => {
    render(<SourceIcon url="https://www.performance-publique.budget.gouv.fr/plf-2025" />);

    const lien = screen.getByRole('link', { name: /voir la source officielle/i });
    expect(lien).toHaveAttribute('href', 'https://www.performance-publique.budget.gouv.fr/plf-2025');
    expect(lien).toHaveAttribute('target', '_blank');
    expect(lien).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('inclut le label optionnel dans le libellé accessible', () => {
    render(<SourceIcon url="https://exemple.gouv.fr" label="dépenses 2025" />);

    expect(
      screen.getByRole('link', { name: /voir la source officielle : dépenses 2025/i }),
    ).toBeInTheDocument();
  });
});
