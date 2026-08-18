import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageLoader } from './PageLoader';

describe('PageLoader', () => {
  it("affiche un message de chargement avec le rôle status pour l'accessibilité", () => {
    render(<PageLoader />);

    expect(screen.getByRole('status')).toHaveTextContent('Chargement…');
  });
});
