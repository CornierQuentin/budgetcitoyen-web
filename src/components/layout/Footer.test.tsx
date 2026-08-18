import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Footer from './Footer';

describe('Footer', () => {
  it('affiche la mention de licence et de source des données', () => {
    render(<Footer />);

    expect(screen.getByText(/AGPL-3\.0-or-later/)).toBeInTheDocument();
    expect(screen.getByText(/sources officielles/)).toBeInTheDocument();
  });
});
