import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { exportNodeAsPng } from '../utils/exportPng';
import { useExportPng } from './useExportPng';

vi.mock('../utils/exportPng', () => ({
  exportNodeAsPng: vi.fn(),
}));

const mockedExportNodeAsPng = vi.mocked(exportNodeAsPng);

describe('useExportPng', () => {
  it('ne fait rien si la ref ne pointe vers aucun noeud DOM', async () => {
    const { result } = renderHook(() => useExportPng());

    await act(async () => {
      await result.current.exporterPng('export.png');
    });

    expect(mockedExportNodeAsPng).not.toHaveBeenCalled();
    expect(result.current.enCours).toBe(false);
  });

  it('exporte le noeud référencé, bascule enCours pendant l’export puis le repasse à false', async () => {
    mockedExportNodeAsPng.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useExportPng());
    const node = document.createElement('div');
    // @ts-expect-error : ref.current n'est en principe modifiable que par React,
    // mais useRef renvoie un objet mutable — on simule ici le rattachement DOM.
    result.current.ref.current = node;

    await act(async () => {
      await result.current.exporterPng('export.png');
    });

    expect(mockedExportNodeAsPng).toHaveBeenCalledWith(node, 'export.png');
    expect(result.current.enCours).toBe(false);
    expect(result.current.erreur).toBeNull();
  });

  it("expose un message d'erreur si l'export échoue, sans laisser enCours bloqué", async () => {
    mockedExportNodeAsPng.mockRejectedValueOnce(new Error('échec'));
    const { result } = renderHook(() => useExportPng());
    const node = document.createElement('div');
    // @ts-expect-error : cf. commentaire ci-dessus.
    result.current.ref.current = node;

    await act(async () => {
      await result.current.exporterPng('export.png');
    });

    await waitFor(() => expect(result.current.erreur).toBe("L'export PNG a échoué. Réessayez."));
    expect(result.current.enCours).toBe(false);
  });
});
