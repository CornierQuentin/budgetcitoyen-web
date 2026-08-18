import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '../services/apiClient';
import { camelizeKeys } from '../services/mappers';
import { createQueryClientWrapper } from '../testUtils/queryClientWrapper';
import type { BudgetPersoResponseDto } from '../types/api';
import type { BudgetPerso } from '../types/domain';
import { useBudgetPerso } from './useBudgetPerso';

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('useBudgetPerso', () => {
  it('appelle GET /budget-perso avec revenu_net et mappe la réponse (dont la méthodologie) en camelCase', async () => {
    const fixture: BudgetPersoResponseDto = {
      revenu_net_mensuel: 2000,
      annee_reference: 2023,
      ir_estime: 1200,
      tva_estimee: 800,
      contribution_totale_estimee: 5000,
      repartition: [{ mission_slug: 'defense', mission_nom: 'Défense', montant: 500 }],
      methodologie: {
        hypotheses: ['Hypothèse 1'],
        limites: ['Limite 1'],
        sources: [{ nom: 'DGFiP', url: 'https://dgfip.example.org' }],
      },
    };
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useBudgetPerso(2000), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/budget-perso', { params: { revenu_net: 2000 } });

    const expected: BudgetPerso = {
      revenuNetMensuel: 2000,
      anneeReference: 2023,
      irEstime: 1200,
      tvaEstimee: 800,
      contributionTotaleEstimee: 5000,
      repartition: [{ missionSlug: 'defense', missionNom: 'Défense', montant: 500 }],
      methodologie: {
        hypotheses: ['Hypothèse 1'],
        limites: ['Limite 1'],
        sources: [{ nom: 'DGFiP', url: 'https://dgfip.example.org' }],
      },
    };
    expect(result.current.data).toEqual(expected);
  });

  it("n'appelle pas l'API tant qu'aucun revenu n'a été soumis", () => {
    renderHook(() => useBudgetPerso(undefined), { wrapper: createQueryClientWrapper() });

    expect(mockedGet).not.toHaveBeenCalled();
  });
});
