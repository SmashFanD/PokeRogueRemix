export const Stat = {
    HP: 0,
    ATK: 1,
    DEF: 2,
    SPATK: 3,
    SPDEF: 4,
    SPD: 5,
    ACC: 6, //This stat will be useless later on
    EVA: 7,
}

/** A constant array comprised of the {@linkcode Stat} values that make up {@linkcode PermanentStat}. */
export const PERMANENT_STATS = [Stat.HP, Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD];
/** A constant array comprised of the {@linkcode Stat} values that make up {@linkcode EFfectiveStat}. */
export const EFFECTIVE_STATS = [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD];

/** A constant array comprised of {@linkcode Stat} the values that make up {@linkcode BattleStat}. */
export const BATTLE_STATS = [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD, Stat.ACC, Stat.EVA];

/** A constant array comprised of {@linkcode Stat} the values that make up {@linkcode TempBattleStat}. */
export const TEMP_BATTLE_STATS = [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD, Stat.ACC];
export const TEMP_BATTLE_STATS_MAX_STAGE = 6;

/**
 * Provides the translation key corresponding to the amount of stat stages and whether those stat stages
 * are positive or negative.
 * @param stages the amount of stages
 * @param isIncrease dictates a negative (`false`) or a positive (`true`) stat stage change
 * @returns the translation key fitting the conditions described by {@linkcode stages} and {@linkcode isIncrease}
 */
export function getStatStageChangeDescriptionKey(stages, isIncrease) {
  if (stages === 1) {
    return isIncrease ? "battle:statRose" : "battle:statFell";
  }
  if (stages === 2) {
    return isIncrease ? "battle:statSharplyRose" : "battle:statHarshlyFell";
  }
  if (stages > 2) {
    return isIncrease ? "battle:statRoseDrastically" : "battle:statSeverelyFell";
  }
  return isIncrease ? "battle:statWontGoAnyHigher" : "battle:statWontGoAnyLower";
}

/**
 * Provides the translation key corresponding to a given stat which can be translated into its full name.
 * @param stat the {@linkcode Stat} to be translated
 * @returns the translation key corresponding to the given {@linkcode Stat}
 */
export function getStatKey(stat) {
  return `pokemonInfo:stat.${Stat[stat].toLowerCase()}`;
}

/**
 * Provides the translation key corresponding to a given stat which can be translated into its shortened name.
 * @param stat the {@linkcode Stat} to be translated
 * @returns the translation key corresponding to the given {@linkcode Stat}
 */
export function getShortenedStatKey(stat) {
  return `pokemonInfo:stat.${Stat[stat].toLowerCase()}Shortened`;
}