interface SiretLinkProps {
  siret: string;
  idType: string | null;
}

// N'affiche un lien vers l'annuaire public que lorsque l'identifiant est
// bien un SIRET (`idType === 'SIRET'`) : la source DECP contient aussi des
// numéros de TVA, IREP, HORS-UE, RIDET ou TAHITI (vérifié réellement sur les
// données) pour lesquels ce lien ne serait pas pertinent - affiche alors
// l'identifiant brut, sans lien.
export function SiretLink({ siret, idType }: SiretLinkProps) {
  if (idType !== 'SIRET') {
    return <span>{siret}</span>;
  }

  return (
    <a
      href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${siret}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-800 hover:underline dark:text-blue-300"
    >
      {siret}
    </a>
  );
}

export default SiretLink;
