import React from 'react';

import { glossaire, type GlossaryTermKey } from '../../utils/glossaire';
import { Tooltip } from './Tooltip';

interface GlossaryTermProps {
  /**
   * Clé du terme dans src/utils/glossaire.ts. Typée sur les clés existantes :
   * une clé absente du glossaire est une erreur TypeScript à la compilation,
   * pour éviter toute faute de frappe silencieuse.
   */
  term: GlossaryTermKey;
  children: React.ReactNode;
  className?: string;
}

// Terme technique souligné en pointillés, avec sa définition en tooltip
// (survol ET focus clavier, cf. Tooltip.tsx) — cf. cahier des charges,
// section 6.2 : « Tooltip systématique sur les termes techniques : déficit,
// AE, CP, PLF, LOLF... ».
export function GlossaryTerm({ term, children, className = '' }: GlossaryTermProps) {
  const definition = glossaire[term];

  if (!definition) {
    // Filet de sécurité runtime : le typage GlossaryTermKey empêche déjà
    // toute clé inconnue de compiler, mais on refuse aussi de rendre un
    // tooltip vide si ce garde-fou était contourné (ex. valeur dynamique).
    throw new Error(
      `GlossaryTerm : terme "${term}" absent de src/utils/glossaire.ts. Ajoutez-le au glossaire.`,
    );
  }

  return (
    <Tooltip label={definition}>
      {/* <button> plutôt que <span tabIndex>: garantit un déclencheur nativement
          focusable/activable au clavier (jsx-a11y/no-noninteractive-tabindex),
          sans réinventer la sémantique interactive. */}
      <button
        type="button"
        className={`cursor-help border-0 border-b border-dotted border-gray-400 bg-transparent p-0
          text-inherit outline-none [font:inherit] focus:border-blue-800 ${className}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export default GlossaryTerm;
