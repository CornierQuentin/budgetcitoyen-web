import { describe, expect, it } from 'vitest';

import {
  CATEGORICAL_COLORS,
  COULEUR_AUTRES,
  couleurPourLabel,
  indexHashLabel,
} from './couleurCategorielle';

describe('indexHashLabel', () => {
  it('retourne toujours le même index pour le même libellé', () => {
    const index1 = indexHashLabel('Défense', 8);
    const index2 = indexHashLabel('Défense', 8);

    expect(index1).toBe(index2);
  });

  it('retourne un index dans les bornes [0, tailleModulo)', () => {
    ['Défense', 'Enseignement scolaire', 'Justice', 'A', ''].forEach((label) => {
      const index = indexHashLabel(label, 8);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(8);
    });
  });
});

describe('couleurPourLabel', () => {
  it('attribue une couleur stable à un même libellé, indépendamment de son ordre/contexte', () => {
    const couleurA = couleurPourLabel('Écologie, développement et mobilité durables');
    const couleurB = couleurPourLabel('Écologie, développement et mobilité durables');

    expect(couleurA).toBe(couleurB);
    expect(CATEGORICAL_COLORS).toContain(couleurA);
  });

  it("ne dépend pas des autres libellés du graphique (contrairement à un index de position) : ajouter/retirer un libellé ne change pas la couleur des autres", () => {
    // C'est la propriété recherchée par le hash (stabilité d'un libellé
    // donné d'une année sur l'autre, même si la composition du classement
    // change), à la différence d'un ancien `CATEGORICAL_COLORS[index % 8]`
    // positionnel : ici, un libellé garde sa couleur qu'il soit seul ou
    // entouré d'autres libellés.
    const label = 'Enseignement scolaire';
    expect(couleurPourLabel(label)).toBe(couleurPourLabel(label));
    // Le calcul ne prend en paramètre que le libellé lui-même : aucune autre
    // donnée (ordre, libellés voisins) n'entre en jeu, donc pas de scénario
    // à tester ici au-delà de la pure fonction — les tests d'intégration
    // (Dashboard) couvrent le rendu réel à travers les années.
  });

  it('deux libellés distincts peuvent recevoir la même couleur (collision acceptée), mais toujours dans la palette', () => {
    const labels = ['Défense', 'Justice', 'Culture', 'Sport', 'Santé', 'Travail', 'Écologie'];
    labels.forEach((label) => {
      expect(CATEGORICAL_COLORS).toContain(couleurPourLabel(label));
    });
  });

  it('attribue systématiquement le gris neutre à la tranche « Autres », jamais une couleur de la palette', () => {
    expect(couleurPourLabel('Autres')).toBe(COULEUR_AUTRES);
    expect(CATEGORICAL_COLORS).not.toContain(COULEUR_AUTRES);
  });

  it('reconnaît « Autres » indépendamment de la casse (type de recette AUTRES inclus)', () => {
    expect(couleurPourLabel('AUTRES')).toBe(COULEUR_AUTRES);
    expect(couleurPourLabel('autres')).toBe(COULEUR_AUTRES);
  });

  it("ne confond pas un libellé qui contient « autres » avec la tranche « Autres » elle-même", () => {
    expect(couleurPourLabel('Autres interventions')).not.toBe(COULEUR_AUTRES);
  });

  it('donne 4 couleurs distinctes aux 4 vrais types de recette (IR, TVA, IS, TICPE)', () => {
    // Cas concret qui a motivé le passage d'une simple somme des points de
    // code à un hash polynomial (voir commentaire de indexHashLabel) : avec
    // une somme, IR et TVA retombaient sur le même index — gênant sur un
    // graphique qui n'affiche que 4 types nommés (AUTRES est colorée à part,
    // en gris). Le hash polynomial n'élimine pas toute collision possible en
    // général (assumé, voir couleurPourLabel), mais règle ce cas réel.
    const couleurs = new Set(['IR', 'TVA', 'IS', 'TICPE'].map((type) => couleurPourLabel(type)));
    expect(couleurs.size).toBe(4);
  });
});
