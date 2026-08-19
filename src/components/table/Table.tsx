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
  emptyMessage: string;
}

// Composant de table generique, extrait pour eviter un 3e <table> hand-roll
// (Comparateur.tsx et DepensesFiscales.tsx dupliquaient deja independamment
// la meme structure/classes Tailwind) - reste volontairement simple (pas de
// tri/redimensionnement intégré), la pagination/le filtrage restent la
// responsabilite de l'appelant (cf. Pagination.tsx, SearchInput.tsx).
export function Table<T>({ columns, rows, getRowKey, emptyMessage }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-3 py-2 font-medium text-gray-700 dark:text-gray-300 ${
                  column.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-4 text-center text-gray-500 dark:text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-2 text-gray-600 dark:text-gray-300 ${
                      column.align === 'right' ? 'text-right' : 'text-left'
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
