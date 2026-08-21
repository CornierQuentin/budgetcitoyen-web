import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { normaliserPourRecherche } from '../../utils/normaliserPourRecherche';
import { CloseIcon, SearchIcon } from './icons';

/**
 * Liste déroulante avec recherche (motif ARIA « combobox » à liste liée).
 *
 * Écrit ici plutôt qu'ajouté en dépendance : le projet n'utilise aucune
 * librairie d'UI headless (il dessine ses propres icônes, son propre tableau,
 * sa propre pagination), et un composant de 150 lignes coûte moins cher à
 * maintenir qu'une dépendance dont il faudrait de toute façon reprendre
 * entièrement l'habillage pour l'accorder aux jetons de design du site.
 *
 * Un `<select>` natif reste préférable en dessous d'une dizaine d'entrées —
 * il est plus robuste et déjà accessible partout. Ce composant n'a de sens
 * que quand la liste devient trop longue pour être parcourue à l'oeil
 * (les 49 missions budgétaires de la page Historique).
 */

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  id: string;
  label: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Message affiché quand la recherche ne ramène rien. */
  messageVide?: string;
  className?: string;
}

export function Combobox({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = 'Rechercher…',
  messageVide = 'Aucun résultat.',
  className = '',
}: ComboboxProps) {
  const listeId = useId();
  const [ouvert, setOuvert] = useState(false);
  const [saisie, setSaisie] = useState('');
  const [indexActif, setIndexActif] = useState(0);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const champRef = useRef<HTMLInputElement>(null);
  const listeRef = useRef<HTMLUListElement>(null);

  const optionSelectionnee = options.find((option) => option.value === value);

  const optionsFiltrees = useMemo(() => {
    const recherche = normaliserPourRecherche(saisie.trim());
    if (!recherche) return options;
    return options.filter((option) => normaliserPourRecherche(option.label).includes(recherche));
  }, [options, saisie]);

  // L'index actif doit toujours désigner une option existante : filtrer
  // réduit la liste, et un index resté au-delà pointerait dans le vide —
  // Entrée ne validerait alors rien du tout.
  useEffect(() => {
    setIndexActif(0);
  }, [saisie]);

  // Fermeture au clic hors du composant. `mousedown` et non `click` : un clic
  // sur une option doit d'abord être traité par celle-ci.
  useEffect(() => {
    if (!ouvert) return undefined;
    const surClicExterieur = (event: MouseEvent) => {
      if (!conteneurRef.current?.contains(event.target as Node)) {
        setOuvert(false);
        setSaisie('');
      }
    };
    document.addEventListener('mousedown', surClicExterieur);
    return () => document.removeEventListener('mousedown', surClicExterieur);
  }, [ouvert]);

  // Garde l'option active dans la partie visible de la liste quand on la
  // parcourt aux flèches : sans cela, le focus clavier « sort » de l'écran
  // dès la sixième option.
  useEffect(() => {
    if (!ouvert) return;
    listeRef.current?.children[indexActif]?.scrollIntoView({ block: 'nearest' });
  }, [indexActif, ouvert]);

  const choisir = (option: ComboboxOption) => {
    onChange(option.value);
    setOuvert(false);
    setSaisie('');
    // Pas de `focus()` ici : `preventDefault` sur le mousedown de l'option
    // empêche déjà le champ de perdre le focus, et le lui rendre relancerait
    // `onFocus` — donc rouvrirait la liste que l'on vient de fermer, en
    // laissant le champ vide au lieu d'afficher la sélection.
  };

  const surTouche = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!ouvert) {
        setOuvert(true);
        return;
      }
      if (optionsFiltrees.length === 0) return;
      const pas = event.key === 'ArrowDown' ? 1 : -1;
      setIndexActif(
        (precedent) => (precedent + pas + optionsFiltrees.length) % optionsFiltrees.length,
      );
      return;
    }

    if (event.key === 'Enter') {
      if (!ouvert) return;
      event.preventDefault();
      const option = optionsFiltrees[indexActif];
      if (option) choisir(option);
      return;
    }

    if (event.key === 'Escape') {
      // Ne referme que si la liste est ouverte, pour ne pas avaler la touche
      // (une modale parente pourrait vouloir s'en servir).
      if (!ouvert) return;
      event.preventDefault();
      setOuvert(false);
      setSaisie('');
      return;
    }

    if (event.key === 'Tab' && ouvert) {
      setOuvert(false);
      setSaisie('');
    }
  };

  return (
    <div ref={conteneurRef} className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          ref={champRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={ouvert}
          aria-controls={listeId}
          aria-autocomplete="list"
          aria-activedescendant={
            ouvert && optionsFiltrees[indexActif]
              ? `${listeId}-${optionsFiltrees[indexActif].value}`
              : undefined
          }
          // Fermée, le champ affiche la sélection courante : le composant se
          // lit alors comme une liste déroulante ordinaire. Ouverte, il
          // repart vide pour que la frappe filtre au lieu de s'ajouter au
          // libellé sélectionné.
          value={ouvert ? saisie : (optionSelectionnee?.label ?? '')}
          placeholder={ouvert ? placeholder : label}
          onChange={(event) => {
            setSaisie(event.target.value);
            setOuvert(true);
          }}
          onFocus={() => setOuvert(true)}
          // En complément de `onFocus` : une fois la liste refermée sur une
          // sélection, le champ garde le focus. Sans ce clic, il n'y aurait
          // plus aucun moyen de la rouvrir à la souris — aucun second
          // événement `focus` ne se produit sur un champ déjà focalisé.
          onClick={() => setOuvert(true)}
          onKeyDown={surTouche}
          className="h-8 w-full rounded-md border border-line-strong bg-surface pl-8 pr-8
            text-[13px] font-semibold text-ink placeholder:font-normal
            placeholder:text-ink-faint"
        />
        {ouvert && saisie !== '' && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => {
              setSaisie('');
              champRef.current?.focus();
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-faint
              hover:bg-surface-hover hover:text-ink"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {ouvert && (
        <ul
          ref={listeRef}
          id={listeId}
          role="listbox"
          aria-label={label}
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border
            border-line-strong bg-surface py-1 shadow-lg"
        >
          {optionsFiltrees.length === 0 ? (
            <li className="px-3 py-2 text-[13px] text-ink-muted">{messageVide}</li>
          ) : (
            optionsFiltrees.map((option, index) => (
              <li
                key={option.value}
                id={`${listeId}-${option.value}`}
                role="option"
                aria-selected={option.value === value}
                // `mousedown` plutôt que `click` : le champ perdrait le focus
                // avant que le clic n'aboutisse, et le gestionnaire de clic
                // extérieur refermerait la liste sans rien sélectionner.
                onMouseDown={(event) => {
                  event.preventDefault();
                  choisir(option);
                }}
                onMouseEnter={() => setIndexActif(index)}
                className={`cursor-pointer px-3 py-1.5 text-[13px] ${
                  index === indexActif ? 'bg-surface-hover' : ''
                } ${option.value === value ? 'font-semibold text-accent' : 'text-ink'}`}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default Combobox;
