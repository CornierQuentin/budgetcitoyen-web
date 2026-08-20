interface FooterProps {
  /**
   * Aligne le pied de page sur la gouttière de la page d'accueil (1120 px)
   * plutôt que sur celle de la coque applicative (1400 px). Sans cela, le
   * texte du pied démarre visiblement à gauche du reste de la page.
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
        className={`mx-auto w-full ${gouttiereAccueil ? 'max-w-[1120px]' : 'max-w-[1400px]'}`}
      >
        <p className="max-w-prose text-xs text-ink-muted">
          BudgetCitoyen.fr — Projet open source distribué sous licence AGPL-3.0-or-later. Les
          données présentées proviennent de sources officielles (voir la page Données).
        </p>
      </div>
    </footer>
  );
}
