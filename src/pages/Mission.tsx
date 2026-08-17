import { useParams } from 'react-router-dom';

import { useMissionDetail } from '../hooks/useMissionDetail';
import { useMissionHistorique } from '../hooks/useMissionHistorique';
import { formatEuros, formatMd } from '../utils/format';

export default function Mission() {
  const { slug } = useParams<{ slug: string }>();

  const { data: detail, isLoading, isError } = useMissionDetail(slug);
  const { data: historique } = useMissionHistorique(slug);

  if (isLoading) {
    return (
      <section className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Chargement de la mission…</p>
      </section>
    );
  }

  if (isError || !detail) {
    return (
      <section className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">
          Mission introuvable pour « {slug} ».
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-lg border border-gray-200 p-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{detail.nomOfficiel}</h2>
        <p className="mt-1 text-sm text-gray-500">
          Année {detail.annee} — {formatMd(detail.montantTotal)} au total
        </p>
      </div>

      {historique && historique.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Libellé au fil du temps</h3>
          <ul className="mt-1 space-y-0.5 text-sm text-gray-600">
            {historique
              .slice()
              .sort((a, b) => a.annee - b.annee)
              .map((item) => (
                <li key={item.annee}>
                  {item.annee} : {item.nomOfficiel}
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Programmes</h3>
        {detail.programmes
          .slice()
          .sort((a, b) => b.montantTotal - a.montantTotal)
          .map((programme) => (
            <div key={programme.id} className="rounded-md border border-gray-100 p-3">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-medium text-gray-900">
                  {programme.code} — {programme.nom}
                </p>
                <p className="whitespace-nowrap text-sm text-gray-600">
                  {formatMd(programme.montantTotal)}
                </p>
              </div>

              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-xs">
                  <thead>
                    <tr>
                      <th scope="col" className="px-2 py-1 text-left font-medium text-gray-500">
                        Action
                      </th>
                      <th scope="col" className="px-2 py-1 text-right font-medium text-gray-500">
                        AE
                      </th>
                      <th scope="col" className="px-2 py-1 text-right font-medium text-gray-500">
                        CP
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {programme.actions
                      .slice()
                      .sort((a, b) => b.cp - a.cp)
                      .map((action) => (
                        <tr key={action.id}>
                          <td className="px-2 py-1 text-gray-700">
                            {action.code} — {action.nom}
                          </td>
                          <td className="px-2 py-1 text-right text-gray-600">
                            {formatEuros(action.ae)}
                          </td>
                          <td className="px-2 py-1 text-right text-gray-600">
                            {formatEuros(action.cp)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
