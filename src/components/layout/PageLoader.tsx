/** Repli affiché pendant le chargement du chunk d'une page/route (React.lazy). */
export function PageLoader() {
  return (
    <p className="text-sm text-ink-muted" role="status">
      Chargement…
    </p>
  );
}
