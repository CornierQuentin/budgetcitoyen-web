import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import DonutChart from '../components/charts/DonutChart';
import { SiretLink } from '../components/marches/SiretLink';
import { Pagination } from '../components/table/Pagination';
import { SearchInput } from '../components/table/SearchInput';
import { Table, type TableColumn } from '../components/table/Table';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SearchIcon } from '../components/ui/icons';
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
  const filtresKey = JSON.stringify([
    qDebounced,
    dateDebut,
    dateFin,
    montantMin,
    montantMax,
    cpvDivision,
  ]);
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

  const filtresActifs = Boolean(
    qDebounced || dateDebut || dateFin || montantMin || montantMax || cpvDivision,
  );

  function messageVideCourant(): ReactNode {
    if (isFetching) return <span role="status">Chargement…</span>;
    if (!filtresActifs) return 'Aucun marché disponible.';
    return (
      <span>
        Aucun marché ne correspond aux filtres actuels.{' '}
        <button
          type="button"
          onClick={resetFiltres}
          className="font-medium text-accent hover:underline "
        >
          Réinitialiser les filtres
        </button>
      </span>
    );
  }
  const messageVide = messageVideCourant();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-[-0.02em] text-ink">Marchés publics</h1>
        <p className="mt-0.5 max-w-prose text-[13px] text-ink-muted">
          Les contrats passés par l&apos;État et les collectivités, tels que déclarés dans les
          Données Essentielles de la Commande Publique.
          <SourceIcon url={SOURCE_URL} label="marchés publics" />
        </p>
      </div>

      <section aria-label="Repères de la source" className="grid gap-4 sm:grid-cols-3">
        <Card className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium text-ink-muted">Marchés recensés</span>
          <span className="text-2xl font-bold tracking-[-0.028em] tabular-nums text-ink">
            {pageData ? pageData.total.toLocaleString('fr-FR') : '—'}
          </span>
          <span className="text-xs text-ink-faint">
            {filtresActifs ? 'correspondant aux filtres actifs' : 'mise à jour quotidienne'}
          </span>
        </Card>
        <Card className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium text-ink-muted">Montant cumulé</span>
          <span className="text-2xl font-bold tracking-[-0.028em] tabular-nums text-ink">
            {totalChiffreLabel ?? '—'}
          </span>
          {/* Précision indispensable : cumuler seize ans de marchés ne produit
              pas un total annuel, et le laisser croire serait trompeur. */}
          <span className="text-xs text-ink-faint">
            sur toute la période — jamais un total annuel
          </span>
        </Card>
        <Card className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium text-ink-muted">Période couverte</span>
          <span className="text-2xl font-bold tracking-[-0.028em] tabular-nums text-ink">
            {bornes?.dateMin && bornes?.dateMax
              ? `${new Date(bornes.dateMin).getFullYear()} → ${new Date(bornes.dateMax).getFullYear()}`
              : '—'}
          </span>
          <span className="text-xs tabular-nums text-ink-faint">
            {bornes?.dateMin && bornes?.dateMax
              ? `du ${formatDate(bornes.dateMin)} au ${formatDate(bornes.dateMax)}`
              : 'période inconnue'}
          </span>
        </Card>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)]">
        <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-ink">
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
          <label htmlFor="date-debut-marche" className="block text-sm font-medium text-ink-muted">
            Notifié à partir du
            <input
              id="date-debut-marche"
              type="date"
              value={dateDebut}
              min={bornes?.dateMin ?? undefined}
              max={bornes?.dateMax ?? undefined}
              onChange={(event) => setDateDebut(event.target.value)}
              className="mt-1 block w-full rounded-md border border-line-strong px-3 py-1.5 text-sm
                "
            />
          </label>
          <label htmlFor="date-fin-marche" className="block text-sm font-medium text-ink-muted">
            Notifié jusqu&apos;au
            <input
              id="date-fin-marche"
              type="date"
              value={dateFin}
              min={bornes?.dateMin ?? undefined}
              max={bornes?.dateMax ?? undefined}
              onChange={(event) => setDateFin(event.target.value)}
              className="mt-1 block w-full rounded-md border border-line-strong px-3 py-1.5 text-sm
                "
            />
          </label>
          <label htmlFor="montant-min-marche" className="block text-sm font-medium text-ink-muted">
            Montant minimum (€)
            <input
              id="montant-min-marche"
              type="number"
              min={0}
              value={montantMin}
              onChange={(event) => setMontantMin(event.target.value)}
              className="mt-1 block w-full rounded-md border border-line-strong px-3 py-1.5 text-sm
                "
            />
          </label>
          <label htmlFor="montant-max-marche" className="block text-sm font-medium text-ink-muted">
            Montant maximum (€)
            <input
              id="montant-max-marche"
              type="number"
              min={0}
              value={montantMax}
              onChange={(event) => setMontantMax(event.target.value)}
              className="mt-1 block w-full rounded-md border border-line-strong px-3 py-1.5 text-sm
                "
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
            emptyMessage={messageVide}
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
        </div>

        <div className="flex flex-col gap-4">
          {donutData.length > 0 && (
            <Card
              title="Par catégorie d'achat"
              note={totalChiffreLabel ? `total ${totalChiffreLabel}` : undefined}
              actions={
                cpvDivision ? (
                  <Button variant="secondary" size="sm" onClick={() => setCpvDivision(undefined)}>
                    Retirer le filtre
                  </Button>
                ) : undefined
              }
              footer="Cliquez une tranche pour filtrer la liste. Répartition calculée sur l'ensemble des marchés correspondant aux filtres actifs, pas seulement la page affichée."
            >
              <DonutChart
                data={donutData}
                nomFichierExport="marches-publics-repartition-cpv.png"
                onSliceClick={handleClicTrancheCpv}
              />
            </Card>
          )}

          {/* La limite de la source est dite une fois, à sa place, plutôt que
              répétée à côté de chaque colonne « titulaire ». */}
          <Card className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 flex-none items-center justify-center rounded-md
                bg-accent-soft text-accent"
            >
              <SearchIcon className="h-[17px] w-[17px]" />
            </span>
            <div>
              <h2 className="text-[13.5px] font-bold text-ink">
                Pourquoi pas de noms d&apos;entreprises ?
              </h2>
              <p className="mt-1 text-[12.5px] text-ink-muted">
                La source ne fournit que des identifiants. Quand il s&apos;agit d&apos;un SIRET, le
                numéro renvoie vers l&apos;annuaire public des entreprises ; les autres types
                d&apos;identifiants (TVA, hors-UE…) ne sont pas cliquables.
              </p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
