/**
 * Contains various move-related banlists and related constants.
 *
 * @remarks
 * Note that PokéRogue intentionally diverges from the mainline games in these lists, as follows:
 * - Most signature moves can be called by move-calling moves like Metronome.
 * - Sketch can Sketch everything except itself and Struggle
 * @module
 */

import { MoveId } from "../../enums/move-id.js";

/**
 * Array containing all move-calling moves, used for DRY when writing move banlists.
 */
const moveCallingMoves = [
  MoveId.ASSIST,
  MoveId.METRONOME,
  MoveId.MIRROR_MOVE,
  MoveId.NATURE_POWER,
  MoveId.SLEEP_TALK,
  MoveId.SNATCH,
];

/** Set of moves that cannot be called by {@linkcode MoveId.METRONOME | Metronome}. */
export const invalidMetronomeMoves = new Set([
  ...moveCallingMoves,
  MoveId.COUNTER,
  MoveId.DESTINY_BOND,
  MoveId.DETECT,
  MoveId.ENDURE,
  MoveId.FOCUS_PUNCH,
  MoveId.FOLLOW_ME,
  MoveId.HELPING_HAND,
  MoveId.MIMIC,
  MoveId.MIRROR_COAT,
  MoveId.PROTECT,
  MoveId.SKETCH,
  MoveId.SNORE,
  MoveId.STRUGGLE,
  MoveId.TRANSFORM
]);

/** Set of moves that cannot be called by {@linkcode MoveId.ASSIST | Assist} */
export const invalidAssistMoves = new Set([
  ...moveCallingMoves,
  MoveId.COUNTER,
  MoveId.DESTINY_BOND,
  MoveId.DETECT,
  MoveId.DIG,
  MoveId.DIVE,
  MoveId.ENDURE,
  MoveId.FLY,
  MoveId.FOCUS_PUNCH,
  MoveId.FOLLOW_ME,
  MoveId.HELPING_HAND,
  MoveId.MIMIC,
  MoveId.MIRROR_COAT,
  MoveId.PROTECT,
  MoveId.ROAR,
  MoveId.SKETCH,
  MoveId.STRUGGLE,
  MoveId.TRANSFORM,
  MoveId.TRICK,
  MoveId.WHIRLWIND,
]);

/** Set of moves that cannot be called by {@linkcode MoveId.SLEEP_TALK Sleep Talk} */
export const invalidSleepTalkMoves = new Set([
  ...moveCallingMoves,
  MoveId.BELCH,
  MoveId.BEAK_BLAST,
  MoveId.BIDE,
  MoveId.BOUNCE,
  MoveId.DIG,
  MoveId.DIVE,
  MoveId.FREEZE_SHOCK,
  MoveId.FLY,
  MoveId.FOCUS_PUNCH,
  MoveId.GEOMANCY,
  MoveId.ICE_BURN,
  MoveId.MIMIC,
  MoveId.PHANTOM_FORCE,
  MoveId.RAZOR_WIND,
  MoveId.SHADOW_FORCE,
  MoveId.SHELL_TRAP,
  MoveId.SKETCH,
  MoveId.SKULL_BASH,
  MoveId.SKY_ATTACK,
  MoveId.SKY_DROP,
  MoveId.SOLAR_BLADE,
  MoveId.SOLAR_BEAM,
  MoveId.STRUGGLE,
  MoveId.UPROAR,
]);

/** Set of moves that cannot be copied by {@linkcode MoveId.COPYCAT Copycat} */
export const invalidCopycatMoves = new Set([
  ...moveCallingMoves,
  MoveId.COUNTER,
  MoveId.DESTINY_BOND,
  MoveId.DETECT,
  MoveId.ENDURE,
  MoveId.FOCUS_PUNCH,
  MoveId.FOLLOW_ME,
  MoveId.HELPING_HAND,
  MoveId.MIMIC,
  MoveId.MIRROR_COAT,
  MoveId.PROTECT,
  MoveId.ROAR,
  MoveId.SKETCH,
  MoveId.STRUGGLE,
  MoveId.TRANSFORM,
  MoveId.TRICK,
  MoveId.WHIRLWIND,
]);

/** Set of all moves that cannot be called by {@linkcode MoveId.MIRROR_MOVE | Mirror Move}. */
export const invalidMirrorMoveMoves = new Set([
  ...moveCallingMoves,
  MoveId.CONVERSION_2,
  MoveId.COUNTER,
  MoveId.CURSE,
  MoveId.FOCUS_PUNCH,
  MoveId.FUTURE_SIGHT,
  MoveId.HAIL,
  MoveId.HAZE,
  MoveId.HELPING_HAND,
  MoveId.MIMIC,
  MoveId.MIRROR_COAT,
  MoveId.MIST,
  MoveId.MUD_SPORT,
  MoveId.PERISH_SONG,
  MoveId.PSYCH_UP,
  MoveId.RAIN_DANCE,
  MoveId.ROLE_PLAY,
]);

/**
 *  Set of moves that can never have their type overridden by an ability like Pixilate or Normalize
 *
 * Excludes tera blast and tera starstorm, as these are only conditionally forbidden
 */
export const noAbilityTypeOverrideMoves = new Set([
  MoveId.WEATHER_BALL,
  MoveId.HIDDEN_POWER,
]);

/** Set of all moves that cannot be learned by {@linkcode MoveId.SKETCH | Sketch}. */
export const invalidSketchMoves = new Set([
  MoveId.NONE, // TODO: Remove from banlist and do explicit check
  MoveId.STRUGGLE,
  MoveId.SKETCH,
]);

/**
 * Set of all Moves rendered unusable by {@linkcode HealBlockTag | Heal Block}.
 *
 * Pollen Puff is not included as that is only forbidden if used _against_ a Pokemon with Heal Block applied.
 */
export const healBlockedMoves = new Set([
  MoveId.ABSORB,
  MoveId.MEGA_DRAIN,
  MoveId.RECOVER,
  MoveId.SOFT_BOILED,
  MoveId.DREAM_EATER,
  MoveId.LEECH_LIFE,
  MoveId.REST,
  MoveId.GIGA_DRAIN,
  MoveId.MILK_DRINK,
  MoveId.MORNING_SUN,
  MoveId.SYNTHESIS,
  MoveId.MOONLIGHT,
  MoveId.SWALLOW,
  MoveId.WISH,
  MoveId.SLACK_OFF
]);

/** Set of all moves that cannot be locked into by {@linkcode MoveId.ENCORE | Encore}. */
// TODO: Check in Pokemon Champions to see if Dynamax Cannon is still blacklisted
export const invalidEncoreMoves = new Set([
  ...moveCallingMoves,
  MoveId.TRANSFORM,
  MoveId.MIMIC,
  MoveId.SKETCH,
  MoveId.STRUGGLE,
  MoveId.ENCORE,
  // NB: Add Max/G-Max/Z-Move blockage if or when they are implemented
]);

/** Set of all moves that cannot be repeated by {@linkcode MoveId.INSTRUCT}. */
export const invalidInstructMoves = new Set([
  // Locking/Continually Executed moves
  MoveId.OUTRAGE,
  MoveId.ROLLOUT,
  MoveId.PETAL_DANCE,
  MoveId.THRASH,
  MoveId.ICE_BALL,
  MoveId.UPROAR,
  // Multi-turn Moves
  MoveId.BIDE,
  MoveId.FOCUS_PUNCH,
  // "First Turn Only" moves
  MoveId.FAKE_OUT,
  // Moves with a recharge turn
  MoveId.HYPER_BEAM,
  MoveId.BLAST_BURN,
  MoveId.HYDRO_CANNON,
  // Charging & 2-turn moves
  MoveId.DIG,
  MoveId.FLY,
  MoveId.DIVE,
  MoveId.SKY_ATTACK,
  MoveId.SKULL_BASH,
  MoveId.SOLAR_BEAM,
  // Copying/Move-Calling moves + Instruct
  ...moveCallingMoves,
  // Misc moves
  MoveId.SKETCH,
  MoveId.TRANSFORM,
  MoveId.MIMIC,
  MoveId.STRUGGLE,
  // NB: Add Max/G-Max/Z-Move blockage if or when they are implemented
]);