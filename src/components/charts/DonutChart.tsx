import type { PieLabelRenderProps } from 'recharts';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { useExportPng } from '../../hooks/useExportPng';
import { useThemeStore } from '../../store/useThemeStore';
import { couleurPourLabel } from '../../utils/couleurCategorielle';
import { formatMd, formatPct } from '../../utils/format';
import { Button } from '../ui/Button';

export interface DonutDatum {
  label: string;
  value: number;
  /**
   * Sous-éléments agrégés dans cette tranche (ex : les missions regroupées
   * dans une tranche « Autres » côté Dashboard). Optionnel — DonutChart reste
   * un composant générique {label, value}[], ce champ n'est utilisé que pour
   * enrichir la tooltip quand l'appelant en fournit.
   */
  details?: { label: string; value: number }[];
}

interface DonutChartProps {
  data: DonutDatum[];
  /** Nom de fichier proposé pour l'export PNG (CDC 6.2). */
  nomFichierExport?: string;
  /**
   * Palette imposée, appliquée dans l'ordre des tranches. Sert aux séries
   * courtes et ordonnées (les 5 types de recettes), où une rampe d'une seule
   * teinte fait lire la quantité à la valeur. Sans cette prop, on retombe sur
   * la palette catégorielle par hash du libellé — seule tenable quand les
   * catégories sont nombreuses et non ordonnées (les 46 divisions CPV des
   * marchés publics, par exemple).
   */
  palette?: string[];
  /**
   * Appelé avec le `label` de la tranche cliquée (souris ou clavier —
   * Entrée/Espace sur une tranche mise en focus par les flèches, navigation
   * clavier native de recharts). Laisser vide pour un graphique non cliquable.
   */
  onSliceClick?: (label: string) => void;
}

interface DonutTooltipProps {
  active?: boolean;
  payload?: { payload: DonutDatum }[];
  total: number;
  estSombre: boolean;
}

function DonutTooltip({ active, payload, total, estSombre }: DonutTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0].payload;
  const pct = total > 0 ? datum.value / total : 0;

  return (
    <div
      className="max-w-xs rounded-md border px-2 py-1.5 text-xs shadow-lg"
      style={{
        backgroundColor: estSombre ? '#1f2937' : '#ffffff',
        borderColor: estSombre ? '#374151' : '#e1e0d9',
        color: estSombre ? '#f3f4f6' : '#1f2937',
      }}
    >
      <p className="font-semibold">{datum.label}</p>
      <p>{`${formatMd(datum.value)} (${formatPct(pct)})`}</p>
      {datum.details && datum.details.length > 0 && (
        <>
          <p className="mt-1 border-t border-current pt-1 text-[11px] opacity-70">Détail :</p>
          <ul className="max-h-40 space-y-0.5 overflow-y-auto">
            {datum.details.map((detail) => (
              <li key={detail.label}>{`${detail.label} : ${formatMd(detail.value)}`}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// Angle en radians par degré, pour convertir les angles recharts (en degrés)
// vers les fonctions trigonométriques natives de JS.
const RADIAN = Math.PI / 180;

// Géométrie des « callout labels » (étiquettes externes reliées à leur
// tranche par un trait) : distances additionnelles au-delà de outerRadius,
// en pixels. RAYON_DEPART = où le trait démarre (juste au bord de la
// tranche) ; RAYON_COUDE = où le trait « casse » pour repartir à
// l'horizontale ; LONGUEUR_SEGMENT = longueur du segment horizontal final,
// jusqu'au point d'ancrage du texte.
const RAYON_DEPART_TRAIT = 5;
const RAYON_COUDE_TRAIT = 16;
const LONGUEUR_SEGMENT_HORIZONTAL = 12;

// Écart vertical minimal (px) entre deux étiquettes voisines du même côté du
// camembert, pour deux libellés tenant sur une seule ligne (cf.
// résoudreChevauchements ci-dessous) : sur 2 lignes (libellé + valeur) à
// 10px, ~26px laisse un léger interligne sans coller les blocs. Un libellé
// qui s'enveloppe sur plusieurs lignes (cf. envelopperLabel) a besoin de
// davantage d'espace : HAUTEUR_LIGNE_SUPPLEMENTAIRE ci-dessous s'ajoute alors
// une fois par ligne de libellé au-delà de la première.
const ESPACEMENT_MIN_LABELS = 26;
const HAUTEUR_LIGNE_SUPPLEMENTAIRE = 12;

// Largeur max (en caractères) d'une ligne de libellé affiché à côté du trait
// : au-delà, le libellé s'enveloppe sur une ligne supplémentaire plutôt que
// d'être tronqué — le nom complet de chaque mission doit rester lisible
// directement sur le graphique (retour utilisateur), pas seulement dans la
// légende ou la tooltip au survol. Volontairement réduite (26 à l'origine) :
// la marge horizontale réservée aux étiquettes a elle-même été réduite pour
// agrandir le disque (cf. le composant plus bas) — des lignes plus courtes
// compensent en s'enveloppant davantage, plutôt que de dépasser la largeur
// du graphique. La hauteur du conteneur, elle, reste généreuse pour
// absorber ces lignes supplémentaires sans se sentir à l'étroit.
const MAX_CARACTERES_PAR_LIGNE_LABEL = 18;

/**
 * Enveloppe `label` en plusieurs lignes d'au plus `maxCaracteres` caractères
 * chacune, en ne coupant jamais un mot (un mot isolé plus long que
 * `maxCaracteres` reste seul sur sa ligne plutôt que d'être coupé ou
 * tronqué : aucune perte d'information, contrairement à l'ancienne
 * troncature avec « … »).
 */
function envelopperLabel(label: string, maxCaracteres: number): string[] {
  const mots = label.split(' ');
  const lignes: string[] = [];
  let ligneActuelle = '';

  mots.forEach((mot) => {
    const candidate = ligneActuelle ? `${ligneActuelle} ${mot}` : mot;
    if (candidate.length <= maxCaracteres || !ligneActuelle) {
      ligneActuelle = candidate;
    } else {
      lignes.push(ligneActuelle);
      ligneActuelle = mot;
    }
  });
  if (ligneActuelle) lignes.push(ligneActuelle);

  return lignes;
}

// Angle de séparation appliqué entre chaque tranche (prop `paddingAngle` de
// <Pie> ci-dessous) : dupliqué ici comme constante plutôt que codé en dur à
// deux endroits, car calculerAnglesMedians doit reproduire EXACTEMENT le
// même calcul d'angle que recharts (voir son commentaire).
const PADDING_ANGLE_PIE = 2;

/**
 * Reproduit le calcul d'angle médian de chaque tranche fait en interne par
 * recharts (`Pie.js`, fonction `getRealPieData`/`parseCoordinateOfPie`),
 * pour startAngle=0, endAngle=360, minAngle=0 (valeurs par défaut, non
 * personnalisées sur notre <Pie>). Nécessaire pour construire un rendu
 * d'étiquette à trait STATELESS (voir renderLabelATrait) : plutôt que
 * d'accumuler la géométrie de chaque tranche au fil des appels du callback
 * `label` de recharts (fragile — un appel de recharts ne correspond pas
 * forcément à un rendu complet du Pie, cf. commentaire de renderLabelATrait),
 * on calcule ici, en une fois et indépendamment de recharts, l'angle de
 * toutes les tranches à partir de `data` seul.
 */
function calculerAnglesMedians(donnees: DonutDatum[], paddingAngle: number): number[] {
  const total = donnees.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return donnees.map(() => 0);

  const nbTranchesNonNulles = donnees.filter((item) => item.value !== 0).length;
  // Cercle complet (|endAngle - startAngle| = 360) : recharts compte un
  // espacement par tranche (y compris entre la dernière et la première),
  // pas seulement entre tranches consécutives.
  const angleEspacementTotal = nbTranchesNonNulles * paddingAngle;
  const angleUtileTotal = 360 - angleEspacementTotal;

  let finPrecedente = 0;
  return donnees.map((item, index) => {
    const pourcentage = item.value / total;
    const debut = index === 0 ? 0 : finPrecedente + (item.value !== 0 ? paddingAngle : 0);
    const fin = debut + pourcentage * angleUtileTotal;
    finPrecedente = fin;
    return (debut + fin) / 2;
  });
}

interface TrancheBrute {
  index: number;
  label: string;
  lignesLabel: string[];
  value: number;
  couleur: string;
  cote: 'gauche' | 'droite';
  sx: number;
  sy: number;
  mx: number;
  my: number;
  ex: number;
  ey: number;
}

interface GeometriePie {
  cx: number;
  cy: number;
  outerRadius: number;
}

/**
 * Calcule la position de chaque étiquette externe (point de départ du trait
 * sur le bord de la tranche, coude, point d'ancrage du texte), puis
 * redistribue verticalement les étiquettes qui se chevaucheraient — tri par
 * position naturelle, puis écart minimal forcé entre voisines du même côté
 * (gauche/droite) du camembert. Sur de très petites tranches adjacentes, un
 * chevauchement mineur peut subsister : on privilégie un espacement propre
 * pour l'immense majorité des cas plutôt qu'une garantie absolue.
 *
 * Fonction pure — même géométrie (`cx`/`cy`/`outerRadius`, identique pour
 * toutes les tranches d'un même Pie) et mêmes tranches en entrée =
 * exactement le même résultat en sortie, quel que soit le nombre de fois où
 * elle est appelée (voir renderLabelATrait, qui en dépend pour rester
 * stateless).
 */
function calculerPositionsLabels(
  tranches: {
    index: number;
    label: string;
    lignesLabel: string[];
    value: number;
    couleur: string;
    midAngle: number;
  }[],
  { cx, cy, outerRadius }: GeometriePie,
): TrancheBrute[] {
  const brutes: TrancheBrute[] = tranches.map((tranche) => {
    const cos = Math.cos(-tranche.midAngle * RADIAN);
    const sin = Math.sin(-tranche.midAngle * RADIAN);
    const sx = cx + (outerRadius + RAYON_DEPART_TRAIT) * cos;
    const sy = cy + (outerRadius + RAYON_DEPART_TRAIT) * sin;
    const mx = cx + (outerRadius + RAYON_COUDE_TRAIT) * cos;
    const my = cy + (outerRadius + RAYON_COUDE_TRAIT) * sin;
    const cote: 'gauche' | 'droite' = cos >= 0 ? 'droite' : 'gauche';
    const ex = mx + (cote === 'droite' ? LONGUEUR_SEGMENT_HORIZONTAL : -LONGUEUR_SEGMENT_HORIZONTAL);

    return {
      index: tranche.index,
      label: tranche.label,
      lignesLabel: tranche.lignesLabel,
      value: tranche.value,
      couleur: tranche.couleur,
      cote,
      sx,
      sy,
      mx,
      my,
      ex,
      ey: my,
    };
  });

  (['gauche', 'droite'] as const).forEach((cote) => {
    const surCeCote = brutes.filter((tranche) => tranche.cote === cote).sort((a, b) => a.ey - b.ey);
    for (let i = 1; i < surCeCote.length; i += 1) {
      const precedente = surCeCote[i - 1];
      const courante = surCeCote[i];
      // Une étiquette dont le libellé s'enveloppe sur plusieurs lignes
      // s'étend davantage vers le haut (cf. renderLabelATrait, qui empile
      // les lignes de libellé au-dessus de `ey`) : l'écart minimal exigé
      // avec la voisine du dessus grandit d'autant.
      const espacementMin =
        ESPACEMENT_MIN_LABELS + (courante.lignesLabel.length - 1) * HAUTEUR_LIGNE_SUPPLEMENTAIRE;
      if (courante.ey - precedente.ey < espacementMin) {
        courante.ey = precedente.ey + espacementMin;
      }
    }
  });

  return brutes;
}

export default function DonutChart({
  data,
  nomFichierExport = 'recettes-par-type.png',
  palette,
  onSliceClick,
}: DonutChartProps) {
  const estSombre = useThemeStore((state) => state.theme === 'dark');
  const { ref: exportRef, exporterPng, enCours: exportEnCours } = useExportPng<HTMLDivElement>();

  const couleurTranche = (label: string, index: number) =>
    palette && palette.length > 0 ? palette[index % palette.length] : couleurPourLabel(label);

  if (data.length === 0) {
    return (
      <div
        className="flex h-64 items-center justify-center rounded-lg border border-dashed
          border-line-strong text-sm text-ink-muted"
      >
        Aucune donnée à afficher pour cette année.
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Géométrie ANGULAIRE des étiquettes à trait (tout sauf la position
  // pixel réelle, qui dépend de la taille rendue du graphique — voir
  // renderLabelATrait) : calculée une fois par rendu de DonutChart, à
  // partir de `data` seul, indépendamment de recharts.
  const angleMedianParIndex = calculerAnglesMedians(data, PADDING_ANGLE_PIE);
  const tranchesGeometrieAngulaire = data.map((entry, index) => ({
    index,
    label: entry.label,
    lignesLabel: envelopperLabel(entry.label, MAX_CARACTERES_PAR_LIGNE_LABEL),
    value: entry.value,
    couleur: couleurTranche(entry.label, index),
    midAngle: angleMedianParIndex[index],
  }));

  // Recharts câble les gestionnaires d'événements posés sur <Pie> (et pas sur
  // chaque <Cell>) à chaque secteur, y compris son support clavier natif : le
  // Pie entier est un seul arrêt de tabulation (rootTabIndex), les flèches
  // gauche/droite déplacent le focus entre tranches, et onKeyDown reçoit
  // alors les mêmes (data, index, event) que onClick — d'où l'activation
  // Entrée/Espace ci-dessous, gratuite pour la navigation clavier entre
  // tranches.
  const declencherClic = (entry: { payload?: DonutDatum }) => {
    if (!onSliceClick || !entry.payload) return;
    onSliceClick(entry.payload.label);
  };

  // Étiquettes externes reliées par un trait (« callout labels ») : recharts
  // appelle cette fonction une fois par tranche avec la géométrie RÉELLE en
  // pixels (cx, cy, outerRadius — identiques pour toutes les tranches d'un
  // même Pie ; seul l'index varie). Elle doit rester STATELESS : recharts
  // peut la rappeler bien plus souvent qu'« une fois par tranche à chaque
  // rendu de DonutChart » — Pie gère en interne un état de focus (flèches du
  // clavier entre tranches) qui déclenche SES PROPRES re-rendus, indépendants
  // de DonutChart, et qui réinvoquent cette même closure. Une première
  // version accumulait la géométrie de chaque tranche dans un tableau mutable
  // et ne dessinait tous les traits qu'au dernier appel : ce tableau n'étant
  // remis à zéro qu'au rendu SUIVANT de DonutChart (pas à chaque rappel de
  // Pie), la navigation au clavier entre tranches le faisait grossir sans
  // fin, dupliquant les étiquettes dans le DOM (constaté à la vérification
  // manuelle). Ici, chaque appel recalcule la table complète des positions
  // (calculerPositionsLabels, pure — cf. son commentaire) à partir de
  // `tranchesGeometrieAngulaire` (stable, calculé une fois par rendu de
  // DonutChart) et de la géométrie pixel reçue, et ne rend QUE sa propre
  // tranche : même appelée n'importe quand, n'importe combien de fois, dans
  // n'importe quel ordre, le résultat pour un index donné est toujours
  // identique.
  /* eslint-disable react/prop-types -- `renderLabelATrait` n'est pas un
     composant React : c'est un callback de rendu passé à la prop `label` de
     <Pie>, typé via `PieLabelRenderProps` de recharts (pas de React.FC ni de
     props publiques à documenter par un contrat propTypes). react/prop-types
     le détecte malgré tout comme un composant (il retourne du JSX), d'où ce
     désactivage scopé à sa seule définition. */
  const renderLabelATrait = (props: PieLabelRenderProps) => {
    const { cx, cy, outerRadius, index } = props as PieLabelRenderProps & {
      cx: number;
      cy: number;
      outerRadius: number;
      index: number;
    };

    const positions = calculerPositionsLabels(tranchesGeometrieAngulaire, { cx, cy, outerRadius });
    const tranche = positions.find((position) => position.index === index);
    if (!tranche) return null;

    const couleurTexte = estSombre ? '#e5e7eb' : '#374151';
    const xTexte = tranche.ex + (tranche.cote === 'droite' ? 4 : -4);
    const ancrage = tranche.cote === 'droite' ? 'start' : 'end';

    // Les lignes de libellé (1 ou plus, cf. envelopperLabel) sont empilées
    // vers le HAUT à partir de `ey - 3`, pour que la dernière ligne du
    // libellé (la plus proche de la valeur) garde toujours cette même
    // position quel que soit le nombre de lignes — c'est cette invariance
    // que resoudreChevauchements (calculerPositionsLabels) suppose pour son
    // calcul d'espacement minimal.
    const nbLignes = tranche.lignesLabel.length;

    return (
      <g aria-hidden="true">
        <path
          d={`M${tranche.sx},${tranche.sy} L${tranche.mx},${tranche.my} L${tranche.ex},${tranche.ey}`}
          fill="none"
          stroke={tranche.couleur}
          strokeWidth={1}
        />
        <circle cx={tranche.ex} cy={tranche.ey} r={2} fill={tranche.couleur} stroke="none" />
        <text fontSize={10} textAnchor={ancrage} fill={couleurTexte}>
          {tranche.lignesLabel.map((ligne, indexLigne) => (
            <tspan
              // Lignes dérivées d'un simple découpage de texte, sans
              // identité propre ni réordonnancement possible : l'index est
              // un identifiant stable pour ces tspans.
              // eslint-disable-next-line react/no-array-index-key
              key={indexLigne}
              x={xTexte}
              y={tranche.ey - 3 - (nbLignes - 1 - indexLigne) * HAUTEUR_LIGNE_SUPPLEMENTAIRE}
              fontWeight={600}
            >
              {ligne}
            </tspan>
          ))}
          <tspan x={xTexte} y={tranche.ey + 10}>
            {formatMd(tranche.value)}
          </tspan>
        </text>
      </g>
    );
  };
  /* eslint-enable react/prop-types */

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-1 text-xs"
          onClick={() => exporterPng(nomFichierExport)}
          disabled={exportEnCours}
        >
          {exportEnCours ? 'Export en cours…' : 'Exporter PNG'}
        </Button>
      </div>

      <div ref={exportRef} className="space-y-2 bg-surface">
        {/* donut-chart-pie : classe ciblée par src/index.css pour neutraliser
            le contour de focus par défaut du navigateur au clic souris tout
            en le conservant à la navigation clavier (:focus-visible).
            Marges horizontales réduites au minimum tenant compte de
            MAX_CARACTERES_PAR_LIGNE_LABEL (retour utilisateur : graphiques
            trop petits une fois les deux camemberts côte à côte - moins de
            marge réservée aux étiquettes laisse plus de place au disque
            lui-même). La hauteur du conteneur, elle, ne contraint jamais le
            rayon ici (bien plus grande que la largeur disponible en colonne
            côte à côte) : elle sert uniquement à donner assez d'espace
            vertical aux étiquettes qui s'enveloppent sur plusieurs lignes. */}
        <div className="donut-chart-pie h-[26rem]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 24, right: 110, bottom: 24, left: 110 }}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius="42%"
                outerRadius="66%"
                paddingAngle={2}
                stroke={estSombre ? '#111827' : '#fcfcfb'}
                strokeWidth={2}
                label={renderLabelATrait}
                labelLine={false}
                // Désactivée : l'animation d'entrée démarre les tranches à un
                // angle nul, ce qui retarde leur présence dans le DOM (gênant
                // pour les tests, et pour un éventuel export PNG déclenché
                // juste après le montage).
                isAnimationActive={false}
                className={onSliceClick ? 'cursor-pointer' : undefined}
                onClick={onSliceClick ? declencherClic : undefined}
                // Empêche le focus au clic souris sur la tranche (chaque
                // secteur est un <g tabIndex="-1"> posé par recharts pour
                // son support clavier — un tel élément reçoit normalement le
                // focus au clic, avec le contour associé). `preventDefault`
                // sur mousedown est la façon standard de bloquer ce focus
                // « au clic » sans toucher au clic lui-même (mousedown
                // précède click ; le clic et la navigation continuent de
                // fonctionner normalement) ni à la navigation clavier
                // (Tab/flèches, qui ne passe jamais par mousedown). Nécessaire
                // en complément de :focus-visible (src/index.css) : les
                // navigateurs l'appliquent aussi sur un clic pour ce type
                // d'élément SVG non nativement interactif — retour
                // utilisateur constaté au clic sur une tranche.
                onMouseDown={(_entry, _index, event) => event.preventDefault()}
                onKeyDown={
                  onSliceClick
                    ? (entry, _index, event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          declencherClic(entry);
                        }
                      }
                    : undefined
                }
              >
                {data.map((entry, index) => (
                  <Cell key={entry.label} fill={couleurTranche(entry.label, index)} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip total={total} estSombre={estSombre} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Légende de rappel simplifiée (couleur + nom, sans valeur — déjà
            portée par les étiquettes à traits ci-dessus) : les callout labels
            remplacent la légende recharts comme lecture principale, mais une
            légende reste nécessaire dès 2 séries pour ne jamais faire
            reposer l'identification d'une tranche sur la seule couleur (cf.
            skill dataviz) — utile en particulier si deux tranches proches en
            couleur (collision de hash, cf. couleurCategorielle.ts) ou si le
            libellé d'une tranche est difficile à repérer visuellement parmi
            les autres. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-xs text-ink-muted">
          {data.map((entry, index) => (
            <span key={entry.label} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: couleurTranche(entry.label, index) }}
              />
              {entry.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
