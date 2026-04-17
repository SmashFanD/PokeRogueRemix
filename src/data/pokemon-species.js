import { AbilityId } from "../enums/ability-id.js";
import { EvoLevelThresholdKind } from "../enums/evo-lvl-threshold-kind.js";
import { PartyMemberStrength } from "../enums/party-member-strength.js";
import { SpeciesId } from "../enums/species-id.js";
import { capitalize } from "../utils.js";

export class PokemonSpeciesForm {
 speciesId;
  _formIndex;
  _generation;
  type1;
  type2;
  height;
  weight;
  ability1;
  ability2;
  abilityHidden;
  baseTotal;
  baseStats;
  catchRate;
  /** The base amount of friendship this species has when caught, as an integer from 0-255. */
  baseFriendship;
  baseExp;
  genderDiffs;
  isStarterSelectable;

  constructor(
    type1,
    type2,
    height,
    weight,
    ability1,
    ability2,
    abilityHidden,
    baseTotal,
    baseHp,
    baseAtk,
    baseDef,
    baseSpatk,
    baseSpdef,
    baseSpd,
    catchRate,
    baseFriendship,
    baseExp,
    genderDiffs,
    isStarterSelectable,
  ) {
    this.type1 = type1;
    this.type2 = type2;
    this.height = height;
    this.weight = weight;
    this.ability1 = ability1;
    this.ability2 = ability2 === AbilityId.NONE ? ability1 : ability2;
    this.abilityHidden = abilityHidden;
    this.baseTotal = baseTotal;
    this.baseStats = [baseHp, baseAtk, baseDef, baseSpatk, baseSpdef, baseSpd];
    this.catchRate = catchRate;
    this.baseFriendship = baseFriendship;
    this.baseExp = baseExp;
    this.genderDiffs = genderDiffs;
    this.isStarterSelectable = isStarterSelectable;
  }

  /**
   * Method to get the root species id of a Pokemon.
   * Magmortar.getRootSpeciesId(true) => Magmar
   * Magmortar.getRootSpeciesId(false) => Magby
   * @param forStarter boolean to get the nonbaby form of a starter
   * @returns The species
   */
  getRootSpeciesId(forStarter = false) {
    let ret = this.speciesId;
    while (pokemonPrevolutions.hasOwnProperty(ret) && (!forStarter || !speciesStarterCosts.hasOwnProperty(ret))) {
      ret = pokemonPrevolutions[ret];
    }
    return ret;
  }

  isOfType(type) {
    return this.type1 === type || (this.type2 !== null && this.type2 === type);
  }

  /**
   * Method to get the total number of abilities a Pokemon species has.
   * @returns Number of abilities
   */
  getAbilityCount() {
    return this.abilityHidden !== AbilityId.NONE ? 3 : 2;
  }

  /**
   * Method to get the ability of a Pokemon species.
   * @param abilityIndex Which ability to get (should only be 0-2)
   * @returns The id of the Ability
   */
  getAbility(abilityIndex) {
    let ret;
    if (abilityIndex === 0) {
      ret = this.ability1;
    } else if (abilityIndex === 1) {
      ret = this.ability2;
    } else {
      ret = this.abilityHidden;
    }
    return ret;
  }

  getLevelMoves() {
    if (
      pokemonSpeciesFormLevelMoves.hasOwnProperty(this.speciesId)
      && pokemonSpeciesFormLevelMoves[this.speciesId].hasOwnProperty(this.formIndex)
    ) {
      return pokemonSpeciesFormLevelMoves[this.speciesId][this.formIndex].slice(0);
    }
    return pokemonSpeciesLevelMoves[this.speciesId].slice(0);
  }

  /**
   * Gets the BST for the species
   * @returns The species' BST.
   */
  getBaseStatTotal() {
    return this.baseStats.reduce((i, n) => n + i);
  }

  /**
   * Gets the species' base stat amount for the given stat.
   * @param stat  The desired stat.
   * @returns The species' base stat amount.
   */
  getBaseStat(stat) {
    return this.baseStats[stat];
  }

  getSpriteAtlasPath(female, formIndex, shiny, back) {
    const spriteId = this.getSpriteId(female, formIndex, shiny, back).replace(/_{2}/g, "/");
    return `${/_[1-3]$/.test(spriteId) ? "variant/" : ""}${spriteId}`;
  }

  getBaseSpriteKey() {

    return `${""}${this.speciesId}${""}`;
  }

  /** Compute the sprite ID of the pokemon form. */
  getSpriteId(shiny, back = false) {
    const baseSpriteKey = this.getBaseSpriteKey();

    `${back ? "back__" : ""}${baseSpriteKey}`.split("__").map(p => (null));
    
    return `${back ? "back__" : ""}${shiny ? "shiny__" : ""}${baseSpriteKey}${""}`;
  }

  getSpriteKey(shiny, back) {
    return `pkmn__${this.getSpriteId(shiny, back)}`;
  }
  /**
   * Variant Data key/index is either species id or species id followed by -formkey
   * @param formIndex optional form index for pokemon with different forms
   * @returns species id if no additional forms, index with formkey if a pokemon with a form
   */

  getIconAtlasKey(shiny) {
    //1 is for gen1 here
    return `pokemon_icons_${1}${""}`;
  }

  getIconId(shiny) {
    let ret = this.speciesId.toString();
    if (shiny) {
      ret += "s";
    }

    return ret;
  }

  getCryKey() {
    let speciesId = this.speciesId;

    let ret = speciesId.toString();
    return `cry/${ret}`;
  }

  validateStarterMoveset(moveset) {
    const rootSpeciesId = this.getRootSpeciesId();
    for (const moveId of moveset) {
      if (
        pokemonFormLevelMoves.hasOwnProperty(this.speciesId)
        && pokemonFormLevelMoves[this.speciesId].hasOwnProperty(this.formIndex)
      ) {
        if (!pokemonFormLevelMoves[this.speciesId][this.formIndex].find(lm => lm[0] <= 5 && lm[1] === moveId)) {
          return false;
        }
      } else if (!pokemonSpeciesLevelMoves[this.speciesId].find(lm => lm[0] <= 5 && lm[1] === moveId)) {
        return false;
      }
    }

    return true;
  }

  async loadAssets(
    shiny = false,
    startLoad = false,
    back = false,
  ) {
    // We need to populate the color cache for this species' variant
    const spriteKey = this.getSpriteKey(shiny, back);
    globalScene.loadPokemonAtlas(spriteKey, this.getSpriteAtlasPath(shiny, back));
    globalScene.load.audio(this.getCryKey(), `audio/${this.getCryKey()}.m4a`);
    
    return new Promise(resolve => {
      globalScene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        const originalWarn = console.warn;
        // Ignore warnings for missing frames, because there will be a lot
        console.warn = () => {};
        const frameNames = globalScene.anims.generateFrameNames(spriteKey, {
          zeroPad: 4,
          suffix: ".png",
          start: 1,
          end: 400,
        });
        console.warn = originalWarn;
        const spritePath = this.getSpriteAtlasPath(shiny, back)
          .replace("variant/", "")
          .replace(/_[1-3]$/, "");
        
      });
      if (startLoad) {
        if (!globalScene.load.isLoading()) {
          globalScene.load.start();
        }
      } else {
        resolve();
      }
    });
  }

  cry(soundConfig, ignorePlay) {
    const cryKey = this.getCryKey();
    let cry = globalScene.sound.get(cryKey);
    if (cry?.pendingRemove) {
      cry = null;
    }
    cry = globalScene.playSound(cry ?? cryKey, soundConfig);
    if (cry && ignorePlay) {
      cry.stop();
    }
    return cry;
  }
}
export class PokemonSpecies extends PokemonSpeciesForm {
  name;
  subLegendary;
  legendary;
  mythical;
  category;
  growthRate;
  /** The chance (as a decimal) for this Species to be male, or `null` for genderless species */
  malePercent;

  constructor(
    id,
    generation,
    subLegendary,
    legendary,
    mythical,
    category,
    type1,
    type2,
    height,
    weight,
    ability1,
    ability2,
    abilityHidden,
    baseTotal,
    baseHp,
    baseAtk,
    baseDef,
    baseSpatk,
    baseSpdef,
    baseSpd,
    catchRate,
    baseFriendship,
    baseExp,
    growthRate,
    malePercent,
    genderDiffs,
    canChangeForm,
  ) {
    super(
      type1,
      type2,
      height,
      weight,
      ability1,
      ability2,
      abilityHidden,
      baseTotal,
      baseHp,
      baseAtk,
      baseDef,
      baseSpatk,
      baseSpdef,
      baseSpd,
      catchRate,
      baseFriendship,
      baseExp,
      genderDiffs,
      false,
    );
    this.speciesId = id;
    this.generation = generation;
    this.subLegendary = subLegendary;
    this.legendary = legendary;
    this.mythical = mythical;
    this.category = category;
    this.growthRate = growthRate;
    this.malePercent = malePercent;
    this.genderDiffs = genderDiffs;

    this.localize();
  }

  getName() {
    return this.name;
  }

  /**
   * Pick and return a random {@linkcode Gender} for a {@linkcode Pokemon}.
   * @returns A randomly rolled gender based on this Species' {@linkcode malePercent}.
   */
  generateGender() {
    if (this.malePercent == null) {
      return Gender.GENDERLESS;
    }

    if (randSeedFloat() * 100 <= this.malePercent) {
      return Gender.MALE;
    }
    return Gender.FEMALE;
  }

  localize() {
    this.name = `${capitalize(SpeciesId[this.speciesId], 0)}`;
  }

  getWildSpeciesForLevel(level, allowEvolving, isBoss) {
    return this.getSpeciesForLevel(
      level,
      allowEvolving,
      false,
      (isBoss ? PartyMemberStrength.WEAKER : PartyMemberStrength.AVERAGE) + 1,
      isBoss ? EvoLevelThresholdKind.NORMAL : EvoLevelThresholdKind.WILD,
    );
  }

  /**
   * Determine which species of Pokémon to use for a given level in a trainer battle.
   *
   * @see {@linkcode getSpeciesForLevel}
   */
  getTrainerSpeciesForLevel(
    level,
    allowEvolving = false,
    strength = PartyMemberStrength.WEAKER,
    encounterKind = EvoLevelThresholdKind.NORMAL
  ) {
    return this.getSpeciesForLevel(level, allowEvolving, true, strength, encounterKind);
  }

  /**
   * Determine which species of Pokémon to use for a given level
   * @see {@linkcode determineEnemySpecies}
   */
  getSpeciesForLevel(
    level,
    allowEvolving = false,
    forTrainer = false,
    strength = PartyMemberStrength.WEAKEST,
    encounterKind = EvoLevelThresholdKind.NORMAL
  ) {
    return determineEnemySpecies(this, level, allowEvolving, forTrainer, strength, encounterKind);
  }

  getEvolutionLevels() {
    const evolutionLevels = [];

    //console.log(Species[this.speciesId], pokemonEvolutions[this.speciesId])

    if (pokemonEvolutions.hasOwnProperty(this.speciesId)) {
      for (const e of pokemonEvolutions[this.speciesId]) {
        const speciesId = e.speciesId;
        const level = e.level;
        evolutionLevels.push([speciesId, level]);
        //console.log(Species[speciesId], getPokemonSpecies(speciesId), getPokemonSpecies(speciesId).getEvolutionLevels());
        const nextEvolutionLevels = getPokemonSpecies(speciesId).getEvolutionLevels();
        for (const npl of nextEvolutionLevels) {
          evolutionLevels.push(npl);
        }
      }
    }

    return evolutionLevels;
  }

  /**
   * Get all prevolution levels for this species
   *
   * @remarks
   * `withThresholds` is used to return the evolution level thresholds for the species, to be used
   * when generating
   *
   * @param withThresholds - Whether to include evolution level thresholds in the returned data; default `false`
   */
  getPrevolutionLevels(withThresholds = false) {
    const prevolutionLevels = [];

    const allEvolvingPokemon = Object.keys(pokemonEvolutions);
    for (const p of allEvolvingPokemon) {
      const speciesId = Number.parseInt(p);
      for (const e of pokemonEvolutions[p]) {
        if (
          e.speciesId === this.speciesId
          && (this.forms.length === 0 || !e.evoFormKey || e.evoFormKey === this.forms[this.formIndex].formKey)
          && prevolutionLevels.every(pe => pe[0] !== speciesId)
        ) {
          const level = e.level;
          if (withThresholds && e.evoLevelThreshold) {
            prevolutionLevels.push([speciesId, level, e.evoLevelThreshold]);
          } else {
            prevolutionLevels.push([speciesId, level]);
          }
          const subPrevolutionLevels = getPokemonSpecies(speciesId).getPrevolutionLevels(withThresholds);
          for (const spl of subPrevolutionLevels) {
            prevolutionLevels.push(spl);
          }
        }
      }
    }

    return prevolutionLevels;
  }

  // This could definitely be written better and more accurate to the getSpeciesForLevel logic, but it is only for generating movesets for evolved Pokemon
  getSimulatedEvolutionChain(
    currentLevel,
    forTrainer = false,
    isBoss = false,
    player = false,
  ) {
    const ret = [];
    if (pokemonPrevolutions.hasOwnProperty(this.speciesId)) {
      const prevolutionLevels = this.getPrevolutionLevels().reverse();
      const levelDiff = player ? 0 : forTrainer || isBoss ? (forTrainer && isBoss ? 2.5 : 5) : 10;
      ret.push([prevolutionLevels[0][0], 1]);
      for (let l = 1; l < prevolutionLevels.length; l++) {
        const evolution = pokemonEvolutions[prevolutionLevels[l - 1][0]].find(
          e => e.speciesId === prevolutionLevels[l][0],
        );
        ret.push([
          prevolutionLevels[l][0],
          Math.min(
            Math.max(
              evolution?.level
                + Math.round(
                  randSeedGauss(0.5, 1 + levelDiff * 0.2)
                    * Math.max(evolution?.evoLevelThreshold?.[EvoLevelThresholdKind.WILD] ?? 0, 0.5)
                    * 5,
                )
                - 1,
              2,
              evolution?.level,
            ),
            currentLevel - 1,
          ),
        ]); // TODO: are those bangs correct?
      }
      const lastPrevolutionLevel = ret[prevolutionLevels.length - 1][1];
      const evolution = pokemonEvolutions[prevolutionLevels.at(-1)[0]].find(e => e.speciesId === this.speciesId);
      ret.push([
        this.speciesId,
        Math.min(
          Math.max(
            lastPrevolutionLevel
              + Math.round(
                randSeedGauss(0.5, 1 + levelDiff * 0.2)
                  * Math.max(evolution?.evoLevelThreshold?.[EvoLevelThresholdKind.WILD] ?? 0, 0.5)
                  * 5,
              ),
            lastPrevolutionLevel + 1,
            evolution?.level,
          ),
          currentLevel,
        ),
      ]); // TODO: are those bangs correct?
    } else {
      ret.push([this.speciesId, 1]);
    }

    return ret;
  }
}