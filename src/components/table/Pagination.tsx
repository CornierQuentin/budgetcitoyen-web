interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Pagination minimale (precedent/suivant + indicateur "page X / Y") : pas de
// liste de numeros de page cliquables (peu utile face a des dizaines de
// milliers de pages a 1,5M de lignes) - cf. plan du chantier marches
// publics, pagination offset/limit assumee plutot que par curseur pour v1.
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-4 text-sm text-gray-700 dark:text-gray-300"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-md border border-gray-300 px-3 py-1.5 disabled:cursor-not-allowed
          disabled:opacity-50 dark:border-gray-600"
      >
        Précédent
      </button>
      <span>
        Page {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-md border border-gray-300 px-3 py-1.5 disabled:cursor-not-allowed
          disabled:opacity-50 dark:border-gray-600"
      >
        Suivant
      </button>
    </nav>
  );
}

export default Pagination;
