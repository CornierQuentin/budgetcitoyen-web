import type { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  render: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /**
   * `ReactNode` (pas seulement une chaîne) : un état vide dû à des filtres
   * actifs doit pouvoir inclure une action de récupération juste à côté du
   * message (ex. "Réinitialiser les filtres"), pas seulement du texte —
   * un bouton posé ailleurs sur la page, hors du champ de vision une fois
   * défilé jusqu'au tableau, est trop facile à manquer.
   */
  emptyMessage: ReactNode;
}

// Composant de table generique, extrait pour eviter un 3e <table> hand-roll
// (Comparateur.tsx et DepensesFiscales.tsx dupliquaient deja independamment
// la meme structure/classes Tailwind) - reste volontairement simple (pas de
// tri/redimensionnement intégré), la pagination/le filtrage restent la
// responsabilite de l'appelant (cf. Pagination.tsx, SearchInput.tsx).
export function Table<T>({ columns, rows, getRowKey, emptyMessage }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="min-w-full text-[13px]">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`whitespace-nowrap border-b border-line bg-surface px-4 py-2.5
                  text-[11.5px] font-semibold uppercase tracking-[0.04em] text-ink-faint ${
                    column.align === 'right' ? 'text-right' : 'text-left'
                  }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-ink-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)} className="border-b border-line last:border-b-0 hover:bg-surface-hover">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-2.5 text-ink-muted ${
                      column.align === 'right' ? 'whitespace-nowrap text-right tabular-nums' : 'text-left'
                    }`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
