import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '../services/apiClient';
import { camelizeKeys } from '../services/mappers';
import { createQueryClientWrapper } from '../testUtils/queryClientWrapper';
import type { MissionDetailResponseDto } from '../types/api';
import type { MissionDetail } from '../types/domain';
import { useMissionDetail } from './useMissionDetail';

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('useMissionDetail', () => {
  it('appelle GET /missions/{slug}/detail avec annee et mappe programmes/actions en camelCase', async () => {
    const fixture: MissionDetailResponseDto = {
      id: 1,
      slug: 'defense',
      nom_officiel: 'Défense',
      annee: 2023,
      montant_total: 50_000_000_000,
      programmes: [
        {
          id: 10,
          code: '146',
          nom: 'Équipement des forces',
          montant_total: 20_000_000_000,
          actions: [{ id: 100, code: '146-01', nom: 'Dissuasion', ae: 1000, cp: 900 }],
          code_officiel: true,
          actions_detaillees: true,
        },
      ],
    };
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useMissionDetail('defense', 2023), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/missions/defense/detail', { params: { annee: 2023 } });

    const expected: MissionDetail = {
      id: 1,
      slug: 'defense',
      nomOfficiel: 'Défense',
      annee: 2023,
      montantTotal: 50_000_000_000,
      programmes: [
        {
          id: 10,
          code: '146',
          nom: 'Équipement des forces',
          montantTotal: 20_000_000_000,
          actions: [{ id: 100, code: '146-01', nom: 'Dissuasion', ae: 1000, cp: 900 }],
          codeOfficiel: true,
          actionsDetaillees: true,
        },
      ],
    };
    expect(result.current.data).toEqual(expected);
  });

  it("n'appelle pas l'API tant qu'aucun slug n'est fourni", () => {
    renderHook(() => useMissionDetail(undefined), { wrapper: createQueryClientWrapper() });

    expect(mockedGet).not.toHaveBeenCalled();
  });
});
