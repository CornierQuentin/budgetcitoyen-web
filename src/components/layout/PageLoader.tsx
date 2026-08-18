/** Repli affiché pendant le chargement du chunk d'une page/route (React.lazy). */
export function PageLoader() {
  return (
    <p className="text-sm text-gray-500 dark:text-gray-400" role="status">
      Chargement…
    </p>
  );
}
