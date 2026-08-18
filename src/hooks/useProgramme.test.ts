import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '../services/apiClient';
import { camelizeKeys } from '../services/mappers';
import { createQueryClientWrapper } from '../testUtils/queryClientWrapper';
import type { ProgrammeResponseDto } from '../types/api';
import type { Programme } from '../types/domain';
import { useProgramme } from './useProgramme';

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('useProgramme', () => {
  it('appelle GET /programmes/{id} avec annee et mappe la réponse en camelCase', async () => {
    const fixture: ProgrammeResponseDto = {
      id: 10,
      mission_id: 1,
      code: '146',
      nom: 'Équipement des forces',
      annee: 2023,
    };
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useProgramme(10, 2023), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/programmes/10', { params: { annee: 2023 } });

    const expected: Programme = {
      id: 10,
      missionId: 1,
      code: '146',
      nom: 'Équipement des forces',
      annee: 2023,
    };
    expect(result.current.data).toEqual(expected);
  });

  it("n'appelle pas l'API tant qu'aucun id n'est fourni", () => {
    renderHook(() => useProgramme(undefined), { wrapper: createQueryClientWrapper() });

    expect(mockedGet).not.toHaveBeenCalled();
  });
});
