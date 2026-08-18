import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '../services/apiClient';
import { camelizeKeys } from '../services/mappers';
import { createQueryClientWrapper } from '../testUtils/queryClientWrapper';
import type { MissionResponseDto } from '../types/api';
import type { Mission } from '../types/domain';
import { useMission } from './useMission';

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('useMission', () => {
  it('appelle GET /missions/{slug} avec le paramètre annee et mappe la réponse en camelCase', async () => {
    const fixture: MissionResponseDto = {
      id: 1,
      slug: 'defense',
      nom_normalise: 'defense',
      nom_officiel: 'Défense',
      annee: 2023,
      montant_total: 50_000_000_000,
    };
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useMission('defense', 2023), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/missions/defense', { params: { annee: 2023 } });

    const expected: Mission = {
      id: 1,
      slug: 'defense',
      nomNormalise: 'defense',
      nomOfficiel: 'Défense',
      annee: 2023,
      montantTotal: 50_000_000_000,
    };
    expect(result.current.data).toEqual(expected);
  });

  it("n'appelle pas l'API tant qu'aucun slug n'est fourni", () => {
    renderHook(() => useMission(undefined), { wrapper: createQueryClientWrapper() });

    expect(mockedGet).not.toHaveBeenCalled();
  });
});
