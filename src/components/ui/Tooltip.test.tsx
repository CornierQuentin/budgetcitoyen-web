import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('rend le déclencheur et le label du tooltip (visible au survol/focus via CSS)', () => {
    render(
      <Tooltip label="Définition du terme">
        <button type="button">Terme</button>
      </Tooltip>,
    );

    expect(screen.getByRole('button', { name: 'Terme' })).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Définition du terme');
  });
});
