import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import DonutChart from '../components/charts/DonutChart';
import { SiretLink } from '../components/marches/SiretLink';
import { Pagination } from '../components/table/Pagination';
import { SearchInput } from '../components/table/SearchInput';
import { Table, type TableColumn } from '../components/table/Table';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SourceIcon } from '../components/ui/SourceIcon';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useMarches, useMarchesBornes, useMarchesRepartitionCpv } from '../hooks/useMarches';
import { useSyncSearchParams } from '../hooks/useSyncSearchParams';
import type { MarchePublic } from '../types/domain';
import { exportCsv } from '../utils/exportCsv';
import { formatEuros, formatMd } from '../utils/format';
import { parseIntSearchParam, parseStringSearchParam } from '../utils/searchParams';
import { topNAvecAutres } from '../utils/topNAvecAutres';

const SOURCE_URL =
  'https://www.data.economie.gouv.fr/explore/dataset/decp-2022-marches-valides/information/';

const PAGE_SIZE = 20;
// Au-dela de 10 tranches distinctes, le camembert (jusqu'a 46 divisions CPV
// possibles) devient illisible - meme raisonnement que Dashboard.tsx (8
// missions) : les divisions les plus importantes sont detaillees, le reste
// regroupe dans une tranche "Autres".
const NB_DIVISIONS_DISTINCTES = 10;

const dateFormatter = new Intl.DateTimeFormat('fr-FR');

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export default function Marches() {
  const [searchParams] = useSearchParams();

  const [q, setQ] = useState(() => parseStringSearchParam(searchParams.get('q')) ?? '');
  const [dateDebut, setDateDebut] = useState(
    () => parseStringSearchParam(searchParams.get('date_debut')) ?? '',
  );
  const [dateFin, setDateFin] = useState(
    () => parseStringSearchParam(searchParams.get('date_fin')) ?? '',
  );
  const [montantMin, setMontantMin] = useState(
    () => parseStringSearchParam(searchParams.get('montant_min')) ?? '',
  );
  const [montantMax, setMontantMax] = useState(
    () => parseStringSearchParam(searchParams.get('montant_max')) ?? '',
  );
  const [cpvDivision, setCpvDivision] = useState<string | undefined>(() =>
    parseStringSearchParam(searchParams.get('cpv')),
  );
  const [page, setPage] = useState(() => parseIntSearchParam(searchParams.get('page')) ?? 1);

  const qDebounced = useDebouncedValue(q, 300);

  // Toute modification de filtre (hors changement de page lui-meme) revient
  // a la page 1 : rester sur une page 5 devenue hors bornes apres un filtre
  // plus restrictif afficherait sinon une page vide trompeuse. Comparaison
  // a la derniere valeur de filtresKey VUE (pas un simple booleen "premier
  // rendu") : React.StrictMode (main.tsx) double-invoque cet effet au
  // montage en developpement (monte, nettoie, remonte) - un booleen
  // "premier rendu" est consomme des le premier des deux appels et laisse
  // le second reinitialiser la page a tort, perdant le `?page=3` d'un lien
  // partage des le chargement. Comparer contre la valeur precedente reste
  // correct face a ce double-appel (la valeur n'a pas change entre les deux).
  const filtresKey = JSON.stringify([qDebounced, dateDebut, dateFin, montantMin, montantMax, cpvDivision]);
  const filtresKeyPrecedente = useRef(filtresKey);
  useEffect(() => {
    if (filtresKeyPrecedente.current === filtresKey) return;
    filtresKeyPrecedente.current = filtresKey;
    setPage(1);
  }, [filtresKey]);

  useSyncSearchParams({
    q: qDebounced,
    date_debut: dateDebut,
    date_fin: dateFin,
    montant_min: montantMin,
    montant_max: montantMax,
    cpv: cpvDivision,
    page: page !== 1 ? String(page) : undefined,
  });

  const filtres = {
    q: qDebounced || undefined,
    dateDebut: dateDebut || undefined,
    dateFin: dateFin || undefined,
    montantMin: montantMin ? Number(montantMin) : undefined,
    montantMax: montantMax ? Number(montantMax) : undefined,
    cpvDivision,
  };

  const { data: pageData, isFetching } = useMarches({ ...filtres, page, pageSize: PAGE_SIZE });
  const { data: repartition } = useMarchesRepartitionCpv(filtres);
  const { data: bornes } = useMarchesBornes();

  const labelParDivision = useMemo(
    () => new Map((repartition ?? []).map((item) => [item.cpvDivision, item.label])),
    [repartition],
  );
  const divisionParLabel = useMemo(
    () => new Map((repartition ?? []).map((item) => [item.label, item.cpvDivision])),
    [repartition],
  );

  const donutData = useMemo(
    () =>
      topNAvecAutres(
        (repartition ?? []).map((item) => ({ label: item.label, value: item.montantTotal })),
        NB_DIVISIONS_DISTINCTES,
      ),
    [repartition],
  );

  const handleClicTrancheCpv = (label: string) => {
    const division = divisionParLabel.get(label);
    if (division) setCpvDivision(division);
  };

  const handleExportCsv = () => {
    if (!pageData) return;
    exportCsv<MarchePublic>(pageData.items, `marches-publics-page-${page}.csv`, [
      { cle: 'datenotification', libelle: 'Date de notification' },
      { cle: 'objet', libelle: 'Objet' },
      { cle: 'acheteurSiret', libelle: 'SIRET acheteur' },
      { cle: 'titulaireSiret', libelle: 'Identifiant titulaire' },
      { cle: 'montant', libelle: 'Montant (€)' },
      { cle: 'codecpv', libelle: 'Code CPV' },
    ]);
  };

  const columns: TableColumn<MarchePublic>[] = [
    { key: 'date', header: 'Date', render: (m) => formatDate(m.datenotification) },
    {
      key: 'objet',
      header: 'Objet',
      render: (m) => (
        <span title={m.objet} className="line-clamp-2">
          {m.objet}
        </span>
      ),
    },
    {
      key: 'cpv',
      header: 'Impôt / catégorie',
      render: (m) => labelParDivision.get(m.codecpvDivision) ?? m.codecpvDivision,
    },
    {
      key: 'titulaire',
      header: 'Titulaire',
      render: (m) => <SiretLink siret={m.titulaireSiret} idType={m.titulaireIdType} />,
    },
    {
      key: 'montant',
      header: 'Montant',
      align: 'right',
      render: (m) => formatEuros(m.montant),
    },
  ];

  const totalChiffreLabel = repartition
    ? formatMd(repartition.reduce((somme, item) => somme + item.montantTotal, 0))
    : null;

  const resetFiltres = () => {
    setQ('');
    setDateDebut('');
    setDateFin('');
    setMontantMin('');
    setMontantMax('');
    setCpvDivision(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Marchés publics</h1>
      </div>

      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          Données Essentielles de la Commande Publique (DECP)
          {bornes?.dateMin && bornes?.dateMax && (
            <>
              {' '}
              — {formatDate(bornes.dateMin)} à {formatDate(bornes.dateMax)}, mises à jour
              quotidiennement.
            </>
          )}{' '}
          Seuls des identifiants (SIRET) sont disponibles pour les entreprises et
          administrations : aucun nom n&apos;est fourni par cette source.
          <SourceIcon url={SOURCE_URL} label="marchés publics" />
        </p>
      </Card>

      {donutData.length > 0 && (
        <section>
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Répartition par catégorie (impôt/CPV)
              {totalChiffreLabel && ` — total ${totalChiffreLabel}`}
              {cpvDivision && (
                <Button
                  type="button"
                  variant="secondary"
                  className="ml-3 px-2 py-0.5 text-xs"
                  onClick={() => setCpvDivision(undefined)}
                >
                  Retirer le filtre catégorie
                </Button>
              )}
            </h2>
          </div>
          <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
            Cliquez une tranche pour filtrer la liste par catégorie. Répartition calculée sur
            l&apos;ensemble des marchés correspondant aux filtres actifs, pas seulement la page
            affichée.
          </p>
          <DonutChart
            data={donutData}
            nomFichierExport="marches-publics-repartition-cpv.png"
            onSliceClick={handleClicTrancheCpv}
          />
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Liste des marchés {pageData ? `(${pageData.total.toLocaleString('fr-FR')})` : ''}
          </h2>
          {pageData && pageData.items.length > 0 && (
            <Button
              type="button"
              variant="secondary"
              className="px-3 py-1 text-xs"
              onClick={handleExportCsv}
            >
              Exporter cette page (CSV)
            </Button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SearchInput
            id="recherche-marche"
            label="Rechercher (objet)"
            value={q}
            onChange={setQ}
            placeholder="Ex. hôpital, école, voirie…"
          />
          <label
            htmlFor="date-debut-marche"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Notifié à partir du
            <input
              id="date-debut-marche"
              type="date"
              value={dateDebut}
              min={bornes?.dateMin ?? undefined}
              max={bornes?.dateMax ?? undefined}
              onChange={(event) => setDateDebut(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm
                dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
          <label
            htmlFor="date-fin-marche"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Notifié jusqu&apos;au
            <input
              id="date-fin-marche"
              type="date"
              value={dateFin}
              min={bornes?.dateMin ?? undefined}
              max={bornes?.dateMax ?? undefined}
              onChange={(event) => setDateFin(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm
                dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
          <label
            htmlFor="montant-min-marche"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Montant minimum (€)
            <input
              id="montant-min-marche"
              type="number"
              min={0}
              value={montantMin}
              onChange={(event) => setMontantMin(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm
                dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
          <label
            htmlFor="montant-max-marche"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Montant maximum (€)
            <input
              id="montant-max-marche"
              type="number"
              min={0}
              value={montantMax}
              onChange={(event) => setMontantMax(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm
                dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
          <div className="flex items-end">
            <Button type="button" variant="secondary" onClick={resetFiltres}>
              Réinitialiser les filtres
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <Table
            columns={columns}
            rows={pageData?.items ?? []}
            getRowKey={(m) => String(m.id)}
            emptyMessage={
              isFetching ? 'Chargement…' : 'Aucun marché ne correspond aux filtres actuels.'
            }
          />
        </div>

        {pageData && (
          <div className="mt-4">
            <Pagination
              page={pageData.page}
              totalPages={pageData.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>
    </div>
  );
}
