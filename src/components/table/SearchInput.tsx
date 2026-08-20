interface SearchInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Champ de recherche texte reutilisable - contrairement aux recherches
// existantes (Comparateur.tsx/DepensesFiscales.tsx, filtre client instantane
// sur un tableau deja entierement charge), l'appelant est responsable
// d'eventuellement debouncer la valeur avant de l'utiliser dans une requete
// serveur (cf. useDebouncedValue) - ce composant reste un simple champ
// controle, sans logique de timing.
export function SearchInput({ id, label, value, onChange, placeholder }: SearchInputProps) {
  return (
    <label htmlFor={id} className="block text-sm font-medium text-ink-muted">
      {label}
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border border-line-strong px-3 py-1.5 text-sm
          "
      />
    </label>
  );
}

export default SearchInput;
