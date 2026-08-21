import { useMemo, useState } from 'react';

import DonutChart from '../components/charts/DonutChart';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SourceIcon } from '../components/ui/SourceIcon';
import { useDepensesFiscales, useDepensesFiscalesAnnees } from '../hooks/useDepensesFiscales';
import type { DepenseFiscale, StatutMontant } from '../types/domain';
import { exportCsv } from '../utils/exportCsv';
import { formatMd } from '../utils/format';
import { topNAvecAutres } from '../utils/topNAvecAutres';

// URL publique du dataset (portail data.economie.gouv.fr, OpenDataSoft) : la
// seule édition de l'annexe "Voies et moyens" Tome II disponible en format
// structuré (xlsx) — pas d'édition plus récente publiée sous cette forme.
const SOURCE_URL =
  'https://www.data.economie.gouv.fr/explore/assets/plf2023_voies_et_moyens_t2_liste_des_depenses_fiscales/';

// 9 catégories (types d'impôt) au total dans la source : aucune agrégation
// "Autres" ne se déclenche en pratique, topNAvecAutres reste néanmoins la
// même brique que Dashboard/Comparateur pour rester générique si une future
// édition ajoutait des catégories.
const NB_CATEGORIES_DISTINCTES = 9;

const STATUT_LABEL: Record<StatutMontant, string> = {
  chiffre: '',
  epsilon: 'ε (< 0,5 M€)',
  non_calculable: 'nc',
  aucun_effet: '—',
};

// Libellés lisibles des statuts, pour la carte « Qualité du chiffrage » :
// `STATUT_LABEL` ci-dessus sert au jeton compact affiché dans le tableau
// (ε / nc / —), illisible hors contexte.
const STATUT_DESCRIPTION: Record<StatutMontant, string> = {
  chiffre: 'Chiffré',
  non_calculable: 'Non calculable',
  epsilon: 'Inférieur à 0,5 M€',
  aucun_effet: 'Aucun effet budgétaire',
};

const montantFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

function formatMontantMillions(montantMillions: number): string {
  return `${montantFormatter.format(montantMillions)} M€`;
}

// Affichage explicite du statut d'une mesure non chiffrable : ne jamais
// afficher "0 €" (fausserait la lecture), toujours le jeton source (ε/nc/—).
function formatMontant(depense: DepenseFiscale): string {
  if (depense.statutMontant === 'chiffre' && depense.montantMillions !== null) {
    return formatMontantMillions(depense.montantMillions);
  }
  return STATUT_LABEL[depense.statutMontant];
}

function normaliserPourRecherche(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export default function DepensesFiscales() {
  const { data: annees } = useDepensesFiscalesAnnees();
  const anneesDisponibles = (annees ?? []).slice().sort((a, b) => b - a);
  const [anneeChoisie, setAnneeChoisie] = useState<number | undefined>(undefined);
  const anneeActive = anneeChoisie ?? anneesDisponibles[0];

  const { data: depensesFiscales } = useDepensesFiscales(anneeActive);

  const [recherche, setRecherche] = useState('');
  const rechercheNormalisee = normaliserPourRecherche(recherche.trim());
  const depensesFiltrees = (depensesFiscales ?? []).filter((depense) => {
    if (rechercheNormalisee === '') return true;
    const champs = [
      depense.categorie,
      depense.sousCategorie,
      depense.libelle,
      depense.beneficiaire,
    ];
    return champs.some((champ) => normaliserPourRecherche(champ).includes(rechercheNormalisee));
  });

  // Seules les mesures au statut "chiffre" ont un montant exploitable : les
  // autres (ε/nc/aucun effet) sont exclues du total et du camembert, jamais
  // traitées comme 0 (cf. StatutMontant côté backend).
  const mesuresChiffrees = (depensesFiscales ?? []).filter(
    (depense) => depense.statutMontant === 'chiffre' && depense.montantMillions !== null,
  );
  const repartitionStatuts = (Object.keys(STATUT_LABEL) as (keyof typeof STATUT_LABEL)[]).map(
    (statut) => ({
      statut,
      nombre: (depensesFiscales ?? []).filter((d) => d.statutMontant === statut).length,
    }),
  );

  const mesureLaPlusCouteuse = mesuresChiffrees
    .slice()
    .sort((a, b) => (b.montantMillions ?? 0) - (a.montantMillions ?? 0))[0];

  const totalChiffreEuros = mesuresChiffrees.reduce(
    (somme, depense) => somme + (depense.montantMillions ?? 0) * 1_000_000,
    0,
  );
  const nbNonChiffrees = (depensesFiscales ?? []).length - mesuresChiffrees.length;

  const donutData = useMemo(() => {
    const parCategorie = mesuresChiffrees.reduce((map, depense) => {
      map.set(
        depense.categorie,
        (map.get(depense.categorie) ?? 0) + (depense.montantMillions ?? 0) * 1_000_000,
      );
      return map;
    }, new Map<string, number>());
    return topNAvecAutres(
      Array.from(parCategorie, ([label, value]) => ({ label, value })),
      NB_CATEGORIES_DISTINCTES,
    );
  }, [mesuresChiffrees]);

  const handleExportCsv = () => {
    exportCsv(
      (depensesFiscales ?? []).map((depense) => ({
        numero: depense.numero,
        categorie: depense.categorie,
        sousCategorie: depense.sousCategorie,
        sousSousCategorie: depense.sousSousCategorie ?? '',
        libelle: depense.libelle,
        beneficiaire: depense.beneficiaire,
        montant: formatMontant(depense),
      })),
      `depenses-fiscales-${anneeActive}.csv`,
      [
        { cle: 'numero', libelle: 'Numéro' },
        { cle: 'categorie', libelle: 'Impôt concerné' },
        { cle: 'sousCategorie', libelle: 'Sous-catégorie' },
        { cle: 'sousSousCategorie', libelle: 'Sous-sous-catégorie' },
        { cle: 'libelle', libelle: 'Libellé législatif' },
        { cle: 'beneficiaire', libelle: 'Bénéficiaire' },
        { cle: 'montant', libelle: 'Montant' },
      ],
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-[-0.02em] text-ink">Niches fiscales</h1>
          <p className="mt-0.5 max-w-prose text-[13px] text-ink-muted">
            Les dépenses fiscales — exonérations, crédits et réductions d&apos;impôt — recensées par
            l&apos;annexe « Voies et moyens » du projet de loi de finances.
          </p>
        </div>

        {anneesDisponibles.length > 1 && (
          <label
            htmlFor="annee-depenses-fiscales"
            className="ml-auto flex items-center gap-2 text-[13px] font-medium text-ink-muted"
          >
            Année
            <select
              id="annee-depenses-fiscales"
              value={anneeActive}
              onChange={(event) => setAnneeChoisie(Number(event.target.value))}
              className="h-8 rounded-md border border-line-strong bg-surface px-2 text-[13px]
                font-semibold text-ink"
            >
              {anneesDisponibles.map((annee) => (
                <option key={annee} value={annee}>
                  {annee}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {(depensesFiscales ?? []).length > 0 && (
        <section
          aria-label="Repères du millésime"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <Card className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-ink-muted">Total chiffré</span>
            <span className="text-2xl font-bold tracking-[-0.028em] tabular-nums text-ink">
              {formatMd(totalChiffreEuros)}
            </span>
            <span className="text-xs text-ink-faint">millésime {anneeActive}</span>
          </Card>
          <Card className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-ink-muted">Mesures recensées</span>
            <span className="text-2xl font-bold tracking-[-0.028em] tabular-nums text-ink">
              {(depensesFiscales ?? []).length}
            </span>
            <span className="text-xs tabular-nums text-ink-faint">
              dont {mesuresChiffrees.length} avec un montant
            </span>
          </Card>
          <Card className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-ink-muted">
              Sans montant exploitable
            </span>
            <span className="text-2xl font-bold tracking-[-0.028em] tabular-nums text-ink">
              {(depensesFiscales ?? []).length - mesuresChiffrees.length}
            </span>
            <span className="text-xs text-ink-faint">exclues du total et du graphique</span>
          </Card>
          <Card className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-ink-muted">
              Mesure la plus coûteuse
            </span>
            <span className="text-2xl font-bold tracking-[-0.028em] tabular-nums text-ink">
              {mesureLaPlusCouteuse
                ? formatMd((mesureLaPlusCouteuse.montantMillions ?? 0) * 1e6)
                : '—'}
            </span>
            <span className="truncate text-xs text-ink-faint" title={mesureLaPlusCouteuse?.libelle}>
              {mesureLaPlusCouteuse?.libelle ?? 'aucune mesure chiffrée'}
            </span>
          </Card>
        </section>
      )}

      <Card className="border-accent-line bg-accent-soft ">
        <p className="text-sm text-accent">
          Données {anneeActive ?? ''} (dernier montant réalisé connu — pas une prévision), issues de
          l&apos;annexe « Voies et moyens » Tome II du PLF, seule édition publiée dans un format
          structuré exploitable. Une dépense fiscale n&apos;est connue avec certitude qu&apos;après
          dépouillement des déclarations fiscales de l&apos;année suivante : aucune édition plus
          récente n&apos;existe sous cette forme.
          <SourceIcon url={SOURCE_URL} label={`dépenses fiscales ${anneeActive ?? ''}`} />
        </p>
      </Card>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)]">
        <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-ink">
            Les mesures les plus coûteuses{' '}
            <span className="text-sm font-normal text-ink-muted">
              {depensesFiscales ? `(${depensesFiscales.length} recensées)` : ''}
            </span>
          </h2>
          {depensesFiscales && depensesFiscales.length > 0 && (
            <Button
              type="button"
              variant="secondary"
              className="px-3 py-1 text-xs"
              onClick={handleExportCsv}
            >
              Exporter CSV
            </Button>
          )}
        </div>

        <div className="mt-3 max-w-sm">
          <label
            htmlFor="recherche-depense-fiscale"
            className="block text-sm font-medium text-ink-muted"
          >
            Rechercher une mesure
            <input
              id="recherche-depense-fiscale"
              type="search"
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Ex. TVA, entreprises, crédit d'impôt…"
              className="mt-1 block w-full rounded-md border border-line-strong px-3 py-1.5 text-sm
                "
            />
          </label>
        </div>

        <div className="mt-3 overflow-x-auto rounded-lg border border-line">
          <table className="min-w-full divide-y divide-line text-sm ">
            <thead className="bg-surface-sunken">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium text-ink-muted">
                  Impôt concerné
                </th>
                <th scope="col" className="px-3 py-2 text-left font-medium text-ink-muted">
                  Libellé
                </th>
                <th scope="col" className="px-3 py-2 text-left font-medium text-ink-muted">
                  Bénéficiaire
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium text-ink-muted">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {depensesFiltrees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-ink-muted">
                    Aucune mesure ne correspond à « {recherche.trim()} ».
                  </td>
                </tr>
              ) : (
                depensesFiltrees.map((depense) => (
                  <tr key={depense.numero}>
                    <td className="px-3 py-2 text-ink">{depense.categorie}</td>
                    <td className="px-3 py-2 text-ink-muted" title={depense.libelle}>
                      {depense.libelle}
                    </td>
                    <td className="px-3 py-2 text-ink-muted">{depense.beneficiaire}</td>
                    <td className="px-3 py-2 text-right text-ink-muted">
                      {formatMontant(depense)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>

        <div className="flex flex-col gap-4">
          {depensesFiscales && depensesFiscales.length > 0 && (
            <Card title="Par impôt concerné" note={`total chiffré ${formatMd(totalChiffreEuros)}`}>
              <DonutChart
                data={donutData}
                nomFichierExport={`depenses-fiscales-${anneeActive}.png`}
              />
              {nbNonChiffrees > 0 && (
                <p className="mt-2 text-xs text-ink-muted">
                  {nbNonChiffrees} mesure{nbNonChiffrees > 1 ? 's' : ''} sur{' '}
                  {depensesFiscales.length} n&apos;a pas de montant chiffré exploitable et{' '}
                  {nbNonChiffrees > 1 ? 'sont exclues' : 'est exclue'} de ce total et du graphique.
                </p>
              )}
            </Card>
          )}

          {depensesFiscales && depensesFiscales.length > 0 && (
            <Card
              title="Qualité du chiffrage"
              footer="Le statut vient de la source officielle : il n'est ni interprété ni comblé."
            >
              <ul className="flex flex-col gap-2 text-[13px]">
                {repartitionStatuts.map(({ statut, nombre }) => (
                  <li key={statut} className="flex items-center gap-3">
                    <span className="text-ink">{STATUT_DESCRIPTION[statut]}</span>
                    <span className="ml-auto font-semibold tabular-nums text-ink">{nombre}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
