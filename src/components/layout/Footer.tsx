import { Link } from 'react-router-dom';

import { urlDocumentationApi } from '../../utils/urlsApi';

/** Dépôt public du frontend (licence AGPL-3.0-or-later, cf. PRODUCT.md). */
const URL_CODE_SOURCE = 'https://github.com/CornierQuentin/budgetcitoyen-web';

interface FooterProps {
  /**
   * Variante de la page d'accueil : gouttière alignée sur celle de la page
   * (1120 px et non 1400 px), et liens de pied de page. Ces liens n'ont de
   * sens que là : dans la coque applicative, le rail donne déjà accès aux
   * pages, et l'API est atteignable depuis la page Données.
   */
  gouttiereAccueil?: boolean;
}

export default function Footer({ gouttiereAccueil = false }: FooterProps) {
  return (
    <footer
      className={`mt-auto border-t border-line bg-surface py-5 ${
        gouttiereAccueil ? 'px-6' : 'px-4 sm:px-5'
      }`}
    >
      <div
        className={`mx-auto flex w-full flex-wrap items-baseline gap-x-6 gap-y-2 ${
          gouttiereAccueil ? 'max-w-[1120px]' : 'max-w-[1400px]'
        }`}
      >
        <p className="max-w-prose text-xs text-ink-muted">
          BudgetCitoyen.fr — Projet open source distribué sous licence AGPL-3.0-or-later. Les
          données présentées proviennent de sources officielles (voir la page Données).
        </p>

        {gouttiereAccueil && (
          <nav
            aria-label="Liens de pied de page"
            className="ml-auto flex flex-wrap items-baseline gap-x-5 gap-y-2 text-xs"
          >
            <Link to="/donnees" className="text-ink-muted transition-colors hover:text-accent">
              Données &amp; sources
            </Link>
            <a
              href={urlDocumentationApi()}
              target="_blank"
              rel="noreferrer"
              className="text-ink-muted transition-colors hover:text-accent"
            >
              API
            </a>
            <a
              href={URL_CODE_SOURCE}
              target="_blank"
              rel="noreferrer"
              className="text-ink-muted transition-colors hover:text-accent"
            >
              Code source
            </a>
          </nav>
        )}
      </div>
    </footer>
  );
}
