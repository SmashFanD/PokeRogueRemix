import { speciesStarterCosts } from "../balance.js";
import { SpeciesId } from "../enums/species-id.js";
import { defaultStarterSpecies } from "./constant.js";

export const EvolutionItem = {
  NONE: 0,

  LINKING_CORD: 1,
  SUN_STONE: 2,
  MOON_STONE: 3,
  LEAF_STONE: 4,
  FIRE_STONE: 5,
  WATER_STONE: 6,
  THUNDER_STONE: 7,
}

const EvoCondKey = {
  HELD_ITEM: 15,
};


export class SpeciesEvolutionCondition {
  data;
  desc;

  constructor(...data) {
    this.data = data;
  }

  conditionsFulfilled(pokemon) {
    console.log(this.data);
    return this.data.every(cond => {
      switch (cond.key) {
        case EvoCondKey.HELD_ITEM:
          return pokemon.getHeldItems().some(m => m.is("SpeciesStatBoosterModifier") && (m.type).key === cond.itemKey);
        default:
          return false;
      }
    });
  }
}

export class SpeciesFormEvolution {
  speciesId;
  preFormKey;
  evoFormKey;
  level;
  item;
  condition;
  /**
   * A triple containing the level thresholds for evolutions based on the encounter sort
   * @see {@linkcode EvoLevelThreshold}
   * @see {@linkcode determineEnemySpecies}
   */
  evoLevelThreshold;
  desc = "";

  constructor(speciesId, preFormKey, evoFormKey, level, item, condition, evoDelay) {
    this.speciesId = speciesId;
    this.preFormKey = preFormKey;
    this.evoFormKey = evoFormKey;
    this.level = level;
    this.item = item || EvolutionItem.NONE;
    if (condition != null) {
      this.condition = new SpeciesEvolutionCondition(...coerceArray(condition));
    }
    if (evoDelay != null) {
      this.evoLevelThreshold = evoDelay;
    }
  }

  /**
   * Checks if a Pokemon fulfills the requirements of this evolution.
   * @param pokemon {@linkcode Pokemon} who wants to evolve
   * @param forFusion defaults to False. Whether this evolution is meant for the secondary fused mon. In that case, use their form key.
   * @param item {@linkcode EvolutionItem} optional, check if the evolution uses a certain item
   * @returns whether this evolution can apply to the Pokemon
   */
  validate(pokemon, item) {
    return (
      pokemon.level >= this.level &&
      (this.preFormKey == null || ( pokemon.getFormKey()) === this.preFormKey) &&
      (this.condition == null || this.condition.conditionsFulfilled(pokemon)) &&
      ((item ?? EvolutionItem.NONE) === (this.item ?? EvolutionItem.NONE))
    );
  }

  /**
   * Checks if this evolution is item-based and any conditions for it are fulfilled
   * @param pokemon {@linkcode Pokemon} who wants to evolve
   * @param forFusion defaults to False. Whether this evolution is meant for the secondary fused mon. In that case, use their form key.
   * @returns whether this evolution uses an item and can apply to the Pokemon
   */
  isValidItemEvolution(pokemon) {
    return (
      this.item != null &&
      pokemon.level >= this.level &&
      // Check form key, using the fusion's form key if we're checking the fusion
      (this.preFormKey == null || (pokemon.getFormKey()) === this.preFormKey) &&
      (this.condition == null || this.condition.conditionsFulfilled(pokemon))
    );
  }

  get evoItem() {
    return this.item ?? EvolutionItem.NONE;
  }
}

export class SpeciesEvolution extends SpeciesFormEvolution {
  constructor(speciesId, level, item, condition, evoDelay) {
    super(speciesId, null, null, level, item, condition, evoDelay);
  }
}

export class FusionSpeciesFormEvolution extends SpeciesFormEvolution {
  primarySpeciesId;

  constructor(primarySpeciesId, evolution) {
    super(evolution.speciesId, evolution.preFormKey, evolution.evoFormKey, evolution.level, evolution.item, evolution.condition?.data ?? null, evolution.evoLevelThreshold);

    this.primarySpeciesId = primarySpeciesId;
  }
}

export const pokemonEvolutions = {
  [SpeciesId.BULBASAUR]: [
    new SpeciesEvolution(SpeciesId.IVYSAUR, 16, null, null)
  ],
  [SpeciesId.IVYSAUR]: [
    new SpeciesEvolution(SpeciesId.VENUSAUR, 32, null, null)
  ],
  [SpeciesId.CHARMANDER]: [
    new SpeciesEvolution(SpeciesId.CHARMELEON, 16, null, null)
  ],
  [SpeciesId.CHARMELEON]: [
    new SpeciesEvolution(SpeciesId.CHARIZARD, 36, null, null)
  ],
  [SpeciesId.SQUIRTLE]: [
    new SpeciesEvolution(SpeciesId.WARTORTLE, 16, null, null)
  ],
  [SpeciesId.WARTORTLE]: [
    new SpeciesEvolution(SpeciesId.BLASTOISE, 36, null, null)
  ],
  [SpeciesId.CATERPIE]: [
    new SpeciesEvolution(SpeciesId.METAPOD, 7, null, null)
  ],
  [SpeciesId.METAPOD]: [
    new SpeciesEvolution(SpeciesId.BUTTERFREE, 10, null, null)
  ],
  [SpeciesId.WEEDLE]: [
    new SpeciesEvolution(SpeciesId.KAKUNA, 7, null, null)
  ],
  [SpeciesId.KAKUNA]: [
    new SpeciesEvolution(SpeciesId.BEEDRILL, 10, null, null)
  ],
  [SpeciesId.PIDGEY]: [
    new SpeciesEvolution(SpeciesId.PIDGEOTTO, 18, null, null)
  ],
  [SpeciesId.PIDGEOTTO]: [
    new SpeciesEvolution(SpeciesId.PIDGEOT, 36, null, null)
  ],
  [SpeciesId.RATTATA]: [
    new SpeciesEvolution(SpeciesId.RATICATE, 20, null, null)
  ],
  [SpeciesId.SPEAROW]: [
    new SpeciesEvolution(SpeciesId.FEAROW, 20, null, null)
  ],
  [SpeciesId.EKANS]: [
    new SpeciesEvolution(SpeciesId.ARBOK, 22, null, null)
  ],
  [SpeciesId.SANDSHREW]: [
    new SpeciesEvolution(SpeciesId.SANDSLASH, 22, null, null)
  ],
  [SpeciesId.NIDORAN_F]: [
    new SpeciesEvolution(SpeciesId.NIDORINA, 16, null, null)
  ],
  [SpeciesId.NIDORAN_M]: [
    new SpeciesEvolution(SpeciesId.NIDORINO, 16, null, null)
  ],
  [SpeciesId.ZUBAT]: [
    new SpeciesEvolution(SpeciesId.GOLBAT, 22, null, null)
  ],
  [SpeciesId.ODDISH]: [
    new SpeciesEvolution(SpeciesId.GLOOM, 21, null, null)
  ],
  [SpeciesId.PARAS]: [
    new SpeciesEvolution(SpeciesId.PARASECT, 24, null, null)
  ],
  [SpeciesId.VENONAT]: [
    new SpeciesEvolution(SpeciesId.VENOMOTH, 31, null, null)
  ],
  [SpeciesId.DIGLETT]: [
    new SpeciesEvolution(SpeciesId.DUGTRIO, 26, null, null)
  ],
  [SpeciesId.MEOWTH]: [
    new SpeciesFormEvolution(SpeciesId.PERSIAN, "", "", 28, null, null)
  ],
  [SpeciesId.PSYDUCK]: [
    new SpeciesEvolution(SpeciesId.GOLDUCK, 33, null, null)
  ],
  [SpeciesId.MANKEY]: [
    new SpeciesEvolution(SpeciesId.PRIMEAPE, 28, null, null)
  ],
  [SpeciesId.POLIWAG]: [
    new SpeciesEvolution(SpeciesId.POLIWHIRL, 25, null, null)
  ],
  [SpeciesId.ABRA]: [
    new SpeciesEvolution(SpeciesId.KADABRA, 16, null, null)
  ],
  [SpeciesId.MACHOP]: [
    new SpeciesEvolution(SpeciesId.MACHOKE, 28, null, null)
  ],
  [SpeciesId.BELLSPROUT]: [
    new SpeciesEvolution(SpeciesId.WEEPINBELL, 21, null, null)
  ],
  [SpeciesId.TENTACOOL]: [
    new SpeciesEvolution(SpeciesId.TENTACRUEL, 30, null, null)
  ],
  [SpeciesId.GEODUDE]: [
    new SpeciesEvolution(SpeciesId.GRAVELER, 25, null, null)
  ],
  [SpeciesId.PONYTA]: [
    new SpeciesEvolution(SpeciesId.RAPIDASH, 40, null, null)
  ],
  [SpeciesId.SLOWPOKE]: [
    new SpeciesEvolution(SpeciesId.SLOWBRO, 37, null, null)
  ],
  [SpeciesId.MAGNEMITE]: [
    new SpeciesEvolution(SpeciesId.MAGNETON, 30, null, null)
  ],
  [SpeciesId.DODUO]: [
    new SpeciesEvolution(SpeciesId.DODRIO, 31, null, null)
  ],
  [SpeciesId.SEEL]: [
    new SpeciesEvolution(SpeciesId.DEWGONG, 34, null, null)
  ],
  [SpeciesId.GRIMER]: [
    new SpeciesEvolution(SpeciesId.MUK, 38, null, null)
  ],
  [SpeciesId.GASTLY]: [
    new SpeciesEvolution(SpeciesId.HAUNTER, 25, null, null)
  ],
  [SpeciesId.DROWZEE]: [
    new SpeciesEvolution(SpeciesId.HYPNO, 26, null, null)
  ],
  [SpeciesId.KRABBY]: [
    new SpeciesEvolution(SpeciesId.KINGLER, 28, null, null)
  ],
  [SpeciesId.VOLTORB]: [
    new SpeciesEvolution(SpeciesId.ELECTRODE, 30, null, null)
  ],
  [SpeciesId.CUBONE]: [
    new SpeciesEvolution(SpeciesId.MAROWAK, 28, null, null)
  ],
  [SpeciesId.KOFFING]: [
    new SpeciesEvolution(SpeciesId.WEEZING, 35, null, null)
  ],
  [SpeciesId.RHYHORN]: [
    new SpeciesEvolution(SpeciesId.RHYDON, 42, null, null)
  ],
  [SpeciesId.HORSEA]: [
    new SpeciesEvolution(SpeciesId.SEADRA, 32, null, null)
  ],
  [SpeciesId.GOLDEEN]: [
    new SpeciesEvolution(SpeciesId.SEAKING, 33, null, null)
  ],
  [SpeciesId.MAGIKARP]: [
    new SpeciesEvolution(SpeciesId.GYARADOS, 20, null, null)
  ],
  [SpeciesId.OMANYTE]: [
    new SpeciesEvolution(SpeciesId.OMASTAR, 40, null, null)
  ],
  [SpeciesId.KABUTO]: [
    new SpeciesEvolution(SpeciesId.KABUTOPS, 40, null, null)
  ],
  [SpeciesId.DRATINI]: [
    new SpeciesEvolution(SpeciesId.DRAGONAIR, 30, null, null)
  ],
  [SpeciesId.DRAGONAIR]: [
    new SpeciesEvolution(SpeciesId.DRAGONITE, 55, null, null)
  ]
}

export const pokemonPrevolutions = {};

export function initPokemonPrevolutions() {
  for (const [pk, evolutions] of Object.entries(pokemonEvolutions)) {
    for (const ev of evolutions) {
      pokemonPrevolutions[ev.speciesId] = Number.parseInt(pk);
    }
  }
}


// TODO: This may cause funny business for double starters such as Pichu/Pikachu
export const pokemonStarters = {};

/** The default starters and their evolution lines */
export const defaultStarterSpeciesAndEvolutions = defaultStarterSpecies.flatMap(sId => [sId, ...getEvolutions(sId).values()]);

export function initPokemonStarters() {
  const starterKeys = Object.keys(pokemonPrevolutions);
  starterKeys.forEach(pk => {
    const prevolution = pokemonPrevolutions[pk];
    if (Object.hasOwn(speciesStarterCosts, prevolution)) {
      pokemonStarters[pk] = prevolution;
    } else {
      pokemonStarters[pk] = pokemonPrevolutions[prevolution];
    }
  });
}

/**
 * @param speciesId - The ID of the species to get the evolutions of
 * @returns A set containing all the {@linkcode SpeciesId}s the input species can evolve into
 */
export function getEvolutions(speciesId) {
  const evolutionIds = new Set();
  const recurseEvolutions = (sId) => {
    const evolutions = pokemonEvolutions[sId] ?? [];
    for (const evoSpecies of evolutions) {
      evolutionIds.add(evoSpecies.speciesId);
      recurseEvolutions(evoSpecies.speciesId);
    }
  };
  recurseEvolutions(speciesId);
  return evolutionIds;
}

/**
 * @param speciesId - The ID of the species to get the pre-evolutions of
 * @returns An array containing all the {@linkcode SpeciesId}s that can evolve into the input species
 */
export function getPreEvolutions(speciesId) {
  const preEvoSpecies = [];
  let preEvoSpeciesId = pokemonPrevolutions[speciesId];
  while (preEvoSpeciesId) {
    preEvoSpecies.push(preEvoSpeciesId);
    preEvoSpeciesId = pokemonPrevolutions[preEvoSpeciesId];
  }
  return preEvoSpecies;
}