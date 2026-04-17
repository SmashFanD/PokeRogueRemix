import { AbilityId } from "../../enums/ability-id.js";
import { ArenaTagSide } from "../../enums/arena-tag-side.js";
import { ArenaTagType } from "../../enums/arena-tag-type.js";
import { BattlerTagType } from "../../enums/battler-tag-type.js";
import { HitResult } from "../../enums/hit-result.js";
import { ChargeAnim } from "../../enums/move-anim-common.js";
import { MoveCategory } from "../../enums/move-category.js";
import { MoveEffectTrigger } from "../../enums/move-effect-trigger.js";
import { MoveFlags } from "../../enums/move-flags.js";
import { MoveId } from "../../enums/move-id.js";
import { MovePriorityInBracket } from "../../enums/move-priority-in-bracket.js";
import { MoveResult } from "../../enums/move-result.js";
import { MoveTarget } from "../../enums/move-target.js";
import { MultiHitType } from "../../enums/multihit-type.js";
import { PokemonType } from "../../enums/pokemon-type.js";
import { SpeciesId } from "../../enums/species-id.js";
import { Stat } from "../../enums/stat.js";
import { StatusEffect } from "../../enums/status-effect.js";
import { SwitchType } from "../../enums/switch-type.js";
import { WeatherType } from "../../enums/weather-type.js";
import { globalScene } from "../../global-scene.js";
import { i18next } from "../../i18next.js";
import { capitalize, coerceArray } from "../../utils.js";
import { allMoves } from "../data-list.js";
import { invalidAssistMoves,
  invalidCopycatMoves,
  invalidInstructMoves,
  invalidMetronomeMoves,
  invalidMirrorMoveMoves,
  invalidSketchMoves,
  invalidSleepTalkMoves, } from "./invalid-moves.js";
import { consecutiveUseRestriction,
  counterAttackConditionBoth,
  counterAttackConditionPhysical,
  counterAttackConditionSpecial,
  FailIfInsufficientHpCondition,
  FirstMoveCondition,
  failIfDampCondition,
  failIfTargetNotAttackingCondition,
  failTeleportCondition,
  gravityUseRestriction,
  lastResortCondition,
  MoveCondition,
  MoveRestriction,
  targetSleptOrComatoseCondition,
  upperHandCondition,
  userSleptOrComatoseCondition
} from "./move-condition.js";
import { frenzyMissFunc, getCounterAttackTarget, getMoveTargets } from "./move-utils.js";

export class Move {
  id;
  name;
  _type;
  _category;
  moveTarget;
  power;
  accuracy;
  pp;
  effect;
  chance;
  priority;
  generation;
  attrs = [];
  conditions = [];
  conditionsSeq2 = [];
  
  conditionsSeq3 = [];
  restrictions = [];
  flags = 0;
  _allyTargetDefault = false;
  nameAppend = "";

  constructor(
    id,
    type,
    category,
    defaultMoveTarget,
    power,
    accuracy,
    pp,
    chance,
    priority,
    generation,
  ) {
    this.id = id;
    this._type = type;
    this._category = category;
    this.moveTarget = defaultMoveTarget;
    this.power = power;
    this.accuracy = accuracy;
    this.pp = pp;
    this.chance = chance;
    this.priority = priority;
    this.generation = generation;

    if (defaultMoveTarget === MoveTarget.USER) {
      this.setFlag(MoveFlags.IGNORE_PROTECT, true);
    }
    if (category === MoveCategory.PHYSICAL) {
      this.setFlag(MoveFlags.MAKES_CONTACT, true);
    }

    this.localize();
  }

  get type() {
    return this._type;
  }
  get category() {
    return this._category;
  }

  localize() {
    if (this.id === MoveId.NONE) {
      this.name = "";
      this.effect = "";
      return;
    }

    const i18nKey = capitalize(MoveId[this.id]);
    this.name = `${i18nKey}`;
  }

  /**
   * Get all move attributes that match `attrType`.
   * @param attrType - The name of a {@linkcode MoveAttr} to search for
   * @returns An array containing all attributes matching `attrType`, or an empty array if none match.
   */
  getAttrs(attrType) {
    const targetAttr = MoveAttrs[attrType];
    if (!targetAttr) {
      return [];
    }
    return this.attrs.filter((a) => a instanceof targetAttr);
  }

  /**
   * Check if a move has an attribute that matches `attrType`.
   * @param attrType - The name of a {@linkcode MoveAttr} to search for
   * @returns Whether this move has at least 1 attribute that matches `attrType`
   */
  hasAttr(attrType) {
    const targetAttr = MoveAttrs[attrType];
    if (!targetAttr) {
      return false;
    }
    return this.attrs.some(attr => attr instanceof targetAttr);
  }

  /**
   * Find the first attribute that matches a given predicate function.
   * @param attrPredicate - The predicate function to search `MoveAttr`s by
   * @returns The first {@linkcode MoveAttr} for which `attrPredicate` returns `true`
   */
  findAttr(attrPredicate) {
    // TODO: Remove bang and make return type `MoveAttr`,
    // as well as add overload for functions of type `x is T`
    return this.attrs.find(attrPredicate);
  }

  /**
   * Adds a new MoveAttr to this move (appends to the attr array).
   * If the MoveAttr also comes with a condition, it is added to its {@linkcode MoveCondition} array.
   * @param attrType - The {@linkcode MoveAttr} to add
   * @param args - The arguments needed to instantiate the given class
   * @returns `this`
   */
  attr(attrType, ...args) {
    const attr = new attrType(...args);
    this.attrs.push(attr);
    let attrCondition = attr.getCondition();
    if (attrCondition) {
      if (typeof attrCondition === "function") {
        attrCondition = new MoveCondition(attrCondition);
      }
      this.conditions.push(attrCondition);
    }

    return this;
  }

  /**
   * Adds a new MoveAttr to this move (appends to the attr array).
   * If the MoveAttr also comes with a condition, it is added to its {@linkcode MoveCondition} array.
   *
   * Similar to {@linkcode attr}, except this takes an already instantiated {@linkcode MoveAttr} object
   * as opposed to a constructor and its arguments.
   * @param attrAdd - The {@linkcode MoveAttr} to add
   * @returns `this`
   */
  addAttr(attrAdd) {
    this.attrs.push(attrAdd);
    let attrCondition = attrAdd.getCondition();
    if (attrCondition) {
      if (typeof attrCondition === "function") {
        attrCondition = new MoveCondition(attrCondition);
      }
      this.conditions.push(attrCondition);
    }

    return this;
  }

  /**
   * Sets the move target of this move
   * @param moveTarget - The {@linkcode MoveTarget} to set
   * @returns `this`
   */
  target(moveTarget) {
    this.moveTarget = moveTarget;
    return this;
  }

  /**
   * Getter function that returns if this Move has a given MoveFlag.
   * @param flag - The {@linkcode MoveFlags} to check
   * @returns Whether this Move has the specified flag.
   */
  hasFlag(flag) {
    // Flags are internally represented as bitmasks, so we check by taking the bitwise AND.
    return (this.flags & flag) !== MoveFlags.NONE;
  }

  /**
   * Getter function that returns if the move hits multiple targets
   * @returns boolean
   */
  isMultiTarget() {
    switch (this.moveTarget) {
      case MoveTarget.ALL:
      case MoveTarget.USER_SIDE:
      case MoveTarget.ENEMY_SIDE:
      case MoveTarget.BOTH_SIDES:
        return true;
    }
    return false;
  }

  /**
   * Getter function that returns if the move targets the user or its ally
   * @returns boolean
   */
  isAllyTarget() {
    switch (this.moveTarget) {
      case MoveTarget.USER:
      case MoveTarget.USER_SIDE:
        return true;
    }
    return false;
  }

  //check this
  isChargingMove() {
    return false;
  }

  /**
   * Checks if the target is immune to this Move's type.
   * Currently looks at cases of Grass types with powder moves and Dark types with moves affected by Prankster.
   * @param user - The {@linkcode Pokemon} using this move
   * @param target - The {@linkcode Pokemon} targeted by this move
   * @param type - The {@linkcode PokemonType} of the target
   * @returns Whether the move is blocked by the target's type.
   * Self-targeted moves will return `false` regardless of circumstances.
   */
  isTypeImmune(user, target, type) {
    if (this.moveTarget === MoveTarget.USER) {
      return false;
    }

    switch (type) {
      case PokemonType.GRASS:
        if (this.hasFlag(MoveFlags.POWDER_MOVE)) {
          return true;
        }
        break;
      case PokemonType.DARK:
        if (user.hasAbility(AbilityId.PRANKSTER) && this.category === MoveCategory.STATUS && user.isOpponent(target)) {
          return true;
        }
        break;
    }
    return false;
  }

  /**
   * Checks if the move would hit its target's Substitute instead of the target itself.
   * @param user - The {@linkcode Pokemon} using this move
   * @param target - The {@linkcode Pokemon} targeted by this move
   * @returns Whether this Move will hit the target's Substitute (assuming one exists).
   */
  hitsSubstitute(user, target) {
    if (
      [MoveTarget.USER, MoveTarget.USER_SIDE, MoveTarget.ENEMY_SIDE, MoveTarget.BOTH_SIDES].includes(this.moveTarget)
      || !target?.getTag(BattlerTagType.SUBSTITUTE)
    ) {
      return false;
    }

    const bypassed = new BooleanHolder(false);
    // TODO: Allow this to be simulated
    applyAbAttrs("InfiltratorAbAttr", { pokemon: user, bypassed });

    return !bypassed.value && !this.hasFlag(MoveFlags.SOUND_BASED) && !this.hasFlag(MoveFlags.IGNORE_SUBSTITUTE);
  }

  /**
   * Adds a condition to this move (in addition to any provided by its prior {@linkcode MoveAttr}s).
   * The move will fail upon use if at least 1 of its conditions is not met.
   * @param condition - The {@linkcode MoveCondition} or {@linkcode MoveConditionFunc} to add to the conditions array.
   * @param checkSequence - The sequence number where the failure check occurs
   * @returns `this` for method chaining
   */
  condition(condition, checkSequence = 4) {
    let conditionsArray;
    switch (checkSequence) {
      case 2:
        conditionsArray = this.conditionsSeq2;
        break;
      case 3:
        conditionsArray = this.conditionsSeq3;
        break;
      default:
        conditionsArray = this.conditions;
    }
    if (typeof condition === "function") {
      condition = new MoveCondition(condition);
    }
    conditionsArray.push(condition);

    return this;
  }

  /**
   * Check whether the move has the specified condition in any of its condition arrays.
   * @param condition - The {@linkcode MoveCondition}, must be the same instance.
   * @returns Whether the move has the specified condition
   */
  hasCondition(condition) {
    return (
      this.conditions.includes(condition)
      || this.conditionsSeq2.includes(condition)
      || this.conditionsSeq3.includes(condition)
    );
  }
  /**
   * Adds a restriction condition to this move.
   * The move will not be selectable if at least 1 of its restrictions is met.
   * @param restriction - The function or `MoveRestriction` that evaluates to `true` if the move is restricted from
   *    being selected
   * @param i18nkey - The i18n key for the restriction text, ignored if `restriction` is a `MoveRestriction`
   * @param alsoCondition - If `true`, also adds a {@linkcode MoveCondition} that checks the same condition when the
   *    move is used; default `false`. Ignored if `restriction` is a `MoveRestriction`.
   * @param conditionSeq - The sequence number where the failure check occurs; default `4`. Ignored if `alsoCondition`
   *    is false
   * @returns `this` for method chaining
   */
  restriction(
    restriction,
    i18nkey,
    alsoCondition  = false,
    conditionSeq = 4,
  ) {
    if (typeof restriction === "function") {
      this.restrictions.push(new MoveRestriction(restriction, i18nkey));
      if (alsoCondition) {
        let conditionArray;
        switch (conditionSeq) {
          case 2:
            conditionArray = this.conditionsSeq2;
            break;
          case 3:
            conditionArray = this.conditionsSeq3;
            break;
          default:
            conditionArray = this.conditions;
        }

        conditionArray.push(new MoveCondition((user, _, move) => !restriction(user, move)));
      }
    } else {
      this.restrictions.push(restriction);
    }

    return this;
  }

  /**
   * Mark a move as having one or more edge cases.
   * The move may lack certain niche interactions with other moves/abilities,
   * but still functions as intended in most cases.
   *
   * When using this, **make sure to document the edge case** (or else this becomes pointless).
   * @returns `this`
   */
  edgeCase() {
    return this;
  }

  /**
   * Mark this move as partially implemented.
   * Partial moves are expected to have some core functionality implemented, but may lack
   * certain notable features or interactions with other moves or abilities.
   * @returns `this`
   */
  partial() {
    this.nameAppend += " (P)";
    return this;
  }

  /**
   * Mark this move as unimplemented.
   * Unimplemented moves are ones which have _none_ of their basic functionality enabled,
   * and cannot be used.
   * @returns `this`
   */
  unimplemented() {
    this.nameAppend += " (N)";
    return this;
  }

  /**
   * Sets the flags of the move
   * @param flag {@linkcode MoveFlags}
   * @param on a boolean, if True, then "ORs" the flag onto existing ones, if False then "XORs" the flag onto existing ones
   */
  setFlag(flag, on) {
    // bitwise OR and bitwise XOR respectively
    if (on) {
      this.flags |= flag;
    } else {
      this.flags ^= flag;
    }
  }

  /**
   * Sets the {@linkcode MoveFlags.MAKES_CONTACT} flag for the calling Move
   * @param setFlag - Whether the move should make contact; default `true`
   * @returns `this`
   */
  makesContact(setFlag = true) {
    this.setFlag(MoveFlags.MAKES_CONTACT, setFlag);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.IGNORE_PROTECT} flag for the calling Move
   * @see {@linkcode MoveId.CURSE}
   * @returns The {@linkcode Move} that called this function
   */
  ignoresProtect() {
    this.setFlag(MoveFlags.IGNORE_PROTECT, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.SOUND_BASED} flag for the calling Move
   * @see {@linkcode MoveId.UPROAR}
   * @returns The {@linkcode Move} that called this function
   */
  soundBased() {
    this.setFlag(MoveFlags.SOUND_BASED, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.HIDE_USER} flag for the calling Move
   * @see {@linkcode MoveId.TELEPORT}
   * @returns The {@linkcode Move} that called this function
   */
  hidesUser() {
    this.setFlag(MoveFlags.HIDE_USER, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.HIDE_TARGET} flag for the calling Move
   * @see {@linkcode MoveId.WHIRLWIND}
   * @returns The {@linkcode Move} that called this function
   */
  hidesTarget() {
    this.setFlag(MoveFlags.HIDE_TARGET, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.BITING_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.BITE}
   * @returns The {@linkcode Move} that called this function
   */
  bitingMove() {
    this.setFlag(MoveFlags.BITING_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.PULSE_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.WATER_PULSE}
   * @returns The {@linkcode Move} that called this function
   */
  pulseMove() {
    this.setFlag(MoveFlags.PULSE_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.PUNCHING_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.DRAIN_PUNCH}
   * @returns The {@linkcode Move} that called this function
   */
  punchingMove() {
    this.setFlag(MoveFlags.PUNCHING_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.SLICING_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.X_SCISSOR}
   * @returns The {@linkcode Move} that called this function
   */
  slicingMove() {
    this.setFlag(MoveFlags.SLICING_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.RECKLESS_MOVE} flag for the calling Move
   * @see {@linkcode AbilityId.RECKLESS}
   * @returns The {@linkcode Move} that called this function
   */
  recklessMove() {
    this.setFlag(MoveFlags.RECKLESS_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.BALLBOMB_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.ELECTRO_BALL}
   * @returns The {@linkcode Move} that called this function
   */
  ballBombMove() {
    this.setFlag(MoveFlags.BALLBOMB_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.POWDER_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.STUN_SPORE}
   * @returns The {@linkcode Move} that called this function
   */
  powderMove() {
    this.setFlag(MoveFlags.POWDER_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.DANCE_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.PETAL_DANCE}
   * @returns The {@linkcode Move} that called this function
   */
  danceMove() {
    this.setFlag(MoveFlags.DANCE_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.WIND_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.HURRICANE}
   * @returns The {@linkcode Move} that called this function
   */
  windMove() {
    this.setFlag(MoveFlags.WIND_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.TRIAGE_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.ABSORB}
   * @returns The {@linkcode Move} that called this function
   */
  triageMove() {
    this.setFlag(MoveFlags.TRIAGE_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.GRAVITY} flag for the calling Move and adds {@linkcode gravityUseRestriction} to the
   * move's restrictions.
   *
   * @returns `this`
   *
   * @remarks
   * No {@linkcode condition} is added, as gravity's condition is already checked
   * during the first sequence of a move's failure check, and this would be redundant.
   *
   * @see {@linkcode MoveId.GRAVITY}
   */
  affectedByGravity() {
    this.setFlag(MoveFlags.GRAVITY, true);
    this.restrictions.push(gravityUseRestriction);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.IGNORE_ABILITIES} flag for the calling Move
   * @see {@linkcode MoveId.SUNSTEEL_STRIKE}
   * @returns The {@linkcode Move} that called this function
   */
  ignoresAbilities() {
    this.setFlag(MoveFlags.IGNORE_ABILITIES, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.CHECK_ALL_HITS} flag for the calling Move
   * @see {@linkcode MoveId.TRIPLE_AXEL}
   * @returns The {@linkcode Move} that called this function
   */
  checkAllHits() {
    this.setFlag(MoveFlags.CHECK_ALL_HITS, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.IGNORE_SUBSTITUTE} flag for the calling Move
   * @see {@linkcode MoveId.WHIRLWIND}
   * @returns The {@linkcode Move} that called this function
   */
  ignoresSubstitute() {
    this.setFlag(MoveFlags.IGNORE_SUBSTITUTE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.REFLECTABLE} flag for the calling Move
   * @see {@linkcode MoveId.ATTRACT}
   * @returns The {@linkcode Move} that called this function
   */
  reflectable() {
    this.setFlag(MoveFlags.REFLECTABLE, true);
    return this;
  }

  /**
   * Set the `allyTargetDefault` property for the calling `Move`, causing it to default to targeting the user's ally in Double Battles.
   * @see {@linkcode MoveId.INSTRUCT}
   * @returns `this`
   * @remarks
   * This should not be called for moves that can _only_ target allies (in which case it becomes moot.)
   * Manual switching to enemy targets is still allowed.
   */
  targetsAllyDefault() {
    this._allyTargetDefault = true;
    return this;
  }

  /**
   * Checks if the move flag applies to the pokemon(s) using/receiving the move
   *
   * This method will take the `user`'s ability into account when reporting flags, e.g.
   * calling this method for {@linkcode MoveFlags.MAKES_CONTACT | MAKES_CONTACT}
   * will return `false` if the user has a {@linkcode AbilityId.LONG_REACH} that is not being suppressed.
   *
   * **Note:** This method only checks if the move should have effectively have the flag applied to its use.
   * It does *not* check whether the flag will trigger related effects.
   * For example using this method to check {@linkcode MoveFlags.WIND_MOVE}
   * will not consider {@linkcode AbilityId.WIND_RIDER | Wind Rider }.
   *
   * To simply check whether the move has a flag, use {@linkcode hasFlag}.
   * @param flag - MoveFlag to check on user and/or target
   * @param user - the Pokemon using the move
   * @param target - the Pokemon receiving the move
   * @param isFollowUp (defaults to `false`) `true` if the move was used as a follow up
   * @returns boolean
   * @see {@linkcode hasFlag}
   */
  doesFlagEffectApply({
    flag,
    user,
    target,
    isFollowUp = false,
  }) {
    // special cases below, eg: if the move flag is MAKES_CONTACT, and the user pokemon has an ability that ignores contact (like "Long Reach"), then overrides and move does not make contact
    switch (flag) {
      case MoveFlags.MAKES_CONTACT:
        if (user.hasAbilityWithAttr("IgnoreContactAbAttr") || this.hitsSubstitute(user, target)) {
          return false;
        }
        break;
      case MoveFlags.IGNORE_ABILITIES:
        if (user.hasAbilityWithAttr("MoveAbilityBypassAbAttr")) {
          const abilityEffectsIgnored = new BooleanHolder(false);
          applyAbAttrs("MoveAbilityBypassAbAttr", { pokemon: user, cancelled: abilityEffectsIgnored, move });
          if (abilityEffectsIgnored.value) {
            return true;
          }
          // Sunsteel strike, Moongeist beam, and photon geyser will not ignore abilities if invoked
          // by another move, such as via metronome.
        }
        return this.hasFlag(MoveFlags.IGNORE_ABILITIES) && !isFollowUp;
      case MoveFlags.IGNORE_PROTECT:
        if (
          user.hasAbilityWithAttr("IgnoreProtectOnContactAbAttr")
          && this.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user })
        ) {
          return true;
        }
        break;
    }

    return this.hasFlag(flag);
  }

  /**
   * Apply this move's conditions prior to move effect application.
   * @param user - The {@linkcode Pokemon} using this move
   * @param target - The {@linkcode Pokemon} targeted by this move
   * @param sequence - (Default `4`) The sequence number where the condition check occurs, or `-1` to check all
   * @returns Whether all conditions passed
   * @remarks
   * Only applies conditions intrinsic to the particular move being used.
   */
  applyConditions(user, target, sequence = 4) {
    let conditionsArray;
    switch (sequence) {
      case -1:
        conditionsArray = [...this.conditionsSeq2, ...this.conditionsSeq3, ...this.conditions];
        break;
      case 2:
        conditionsArray = this.conditionsSeq2;
        break;
      case 3:
        conditionsArray = this.conditionsSeq3;
        break;
      case 4:
      default:
        conditionsArray = this.conditions;
    }
    return conditionsArray.every(cond => cond.apply(user, target, this));
  }

  /**
   * Determine whether the move is restricted from being selected due to its own requirements.
   *
   * @remarks
   * Does not check for external factors that prohibit move selection, such as disable
   *
   * @param user - The Pokemon using the move
   * @returns - An array whose first element is `false` if the move is restricted, and the second element is a string
   *    with the reason for the restriction, otherwise, `true` and the empty string.
   */
  checkRestrictions(user) {
    for (const restriction of this.restrictions) {
      if (restriction.apply(user, this)) {
        return [false, restriction.getSelectionDeniedText(user, this)];
      }
    }

    return [true, ""];
  }

  /**
   * Sees if a move has a custom failure text (by looking at each {@linkcode MoveAttr} of this move)
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @returns string of the custom failure text, or `null` if it uses the default text ("But it failed!")
   */
  getFailedText(user, target, move)  {
    for (const attr of this.attrs) {
      const failedText = attr.getFailedText(user, target, move);
      if (failedText) {
        return failedText;
      }
    }
  }

  /**
   * Enemy move choice is random for non boss
   * And effectiveness based if boss until trainers are added
   */
  getUserBenefitScore(user, target, move) {}

  //rework this
  calculateBattleAccuracy(user, target, simulated = false) {
    const moveAccuracy = new NumberHolder(this.accuracy);

    applyMoveAttrs("VariableAccuracyAttr", user, target, this, moveAccuracy);
    applyAbAttrs("WonderSkinAbAttr", {
      pokemon: target,
      opponent: user,
      move: this,
      simulated,
      accuracy: moveAccuracy,
    });

    if (moveAccuracy.value === -1) {
      return moveAccuracy.value;
    }

    const isOhko = this.hasAttr("OneHitKOAccuracyAttr");

    if (!isOhko) {
      globalScene.applyModifiers(PokemonMoveAccuracyBoosterModifier, user.isPlayer(), user, moveAccuracy);
    }

    if (globalScene.arena.weather?.weatherType === WeatherType.FOG) {
      moveAccuracy.value = Math.floor(moveAccuracy.value * 0.95);
    }

    if (!isOhko && globalScene.arena.getTag(ArenaTagType.GRAVITY)) {
      moveAccuracy.value = Math.floor(moveAccuracy.value * 1.3);
    }

    return moveAccuracy.value;
  }

  calculateBattlePower(source, target, simulated = false) {
    if (this.category === MoveCategory.STATUS) {
      return -1;
    }

    const power = new NumberHolder(this.power);

    applyMoveAttrs("VariablePowerAttr", source, target, this, power);

    const typeChangeHolder = new NumberHolder(this.type);

    applyAbAttrs("MoveTypeChangeAbAttr", {
      pokemon: source,
      opponent: target,
      move: this,
      simulated: true,
      moveType: typeChangeHolder,
    });

    const abAttrParams = {
      pokemon: source,
      opponent: target,
      simulated,
      power,
      move: this,
    };

    applyAbAttrs("VariableMovePowerAbAttr", abAttrParams);
    const ally = source.getAlly();
    if (ally != null) {
      applyAbAttrs("AllyMoveCategoryPowerBoostAbAttr", { ...abAttrParams, pokemon: ally });
    }

    for (const p of source.getAlliesGenerator()) {
      applyAbAttrs("UserFieldMoveTypePowerBoostAbAttr", { pokemon: p, opponent: target, move: this, simulated, power });
    }

    const typeBoost = source.findTag(
      t => t instanceof TypeBoostTag && t.boostedType === typeChangeHolder.value,
    );
    if (typeBoost) {
      power.value *= typeBoost.boostValue;
    }

    if (!this.hasAttr("TypelessAttr")) {
      globalScene.arena.applyTags(WeakenMoveTypeTag, typeChangeHolder.value, power);
      globalScene.applyModifiers(AttackTypeBoosterModifier, source.isPlayer(), source, typeChangeHolder.value, power);
    }

    if (source.getTag(HelpingHandTag)) {
      power.value *= 1.5;
    }

    return power.value;
  }

  getPriority(user, simulated = true) {
    const priority = new NumberHolder(this.priority);
    applyMoveAttrs("IncrementMovePriorityAttr", user, null, this, priority);
    applyAbAttrs("ChangeMovePriorityAbAttr", { pokemon: user, simulated, move: this, priority });

    return priority.value;
  }

  getPriorityModifier(user, simulated = true) {
    if (user.getTag(BattlerTagType.BYPASS_SPEED)) {
      return MovePriorityInBracket.FIRST;
    }
    const modifierHolder = new NumberHolder(MovePriorityInBracket.NORMAL);
    applyAbAttrs("ChangeMovePriorityInBracketAbAttr", {
      pokemon: user,
      simulated,
      move: this,
      priority: modifierHolder,
    });
    return modifierHolder.value;
  }

  effectivePowerAbilityCheck(pokemon) {
    const powerMult = new NumberHolder(1);
    const accMult = new NumberHolder(1);
    const instantCharge = new BooleanHolder(false);
    const maxMultiHit = new BooleanHolder(false);

    const params = {
      pokemon,
      move: this,
      powerMult,
      accMult,
      instantCharge,
      maxMultiHit,
      simulated: true,
    };
    applyAbAttrs("AiMovegenMoveStatsAbAttr", params);

    const params2 = {
      pokemon,
      // Setting `opponent` as this pokemon is safe;
      // Any ability attributes that make use of `opponent` in a way that
      // makes the move's power vary based on opponent
      // have `skipDuringMovesetGen` set to true
      // (e.g. moves that rely on opponent weight)
      opponent,
      move: this,
      power: powerMult,
    };
    applyAbAttrs("VariableMovePowerAbAttr", params2);

    return params;
  }

  calculateEffectivePower(pokemon, considerAbilities = !!pokemon) {
    // Status moves are set to 0 effective power
    // Same with variable power moves like low kick, which have -1 power.
    if (this.category === MoveCategory.STATUS || this.power <= 0) {
      return 0;
    }
    // Calculate effective power of move with abilities considered
    // Ignore any neutralizing gas.
    let res;
    if (considerAbilities && pokemon) {
      res = this.effectivePowerAbilityCheck(pokemon);
    }
    const powerMult = res?.powerMult.value ?? 1;
    const accMult = res?.accMult.value ?? 1;

    let effectivePower;
    // Triple axel and triple kick are easier to special case.
    if (this.hasAttr("MultiHitPowerIncrementAttr")) {
      // assume everything with the multihit power increment attr hits 3 times.
      // skipMultiHitCheck is true if skill link is in effect
      if (res?.maxMultiHit || accMult * this.accuracy > 100) {
        effectivePower = this.power * powerMult * 6 * accMult;
      } else {
        // TODO: Rewrite this to care about accuracy multiplier. For now, it increases complexity too much.
        // The only situation where accMult matters is where someone that learns triple kick / triple axel gets an ability that increases accuracy.
        // 47.07 is expected value for move that hits 3 times and has 10 base power.
        effectivePower = 47.07 * powerMult * (this.power / 10);
      }
    } else {
      const multiHitAttr = this.getAttrs("MultiHitAttr")[0];
      if (multiHitAttr && !res?.maxMultiHit) {
        effectivePower =
          multiHitAttr.calculateExpectedHitCount(this, { accMultiplier: accMult, maxMultiHit: res?.maxMultiHit?.value })
          * this.power;
      } else {
        effectivePower =
          this.power * powerMult * (this.accuracy === -1 ? 1 : Math.min(this.accuracy * accMult, 100) / 100);
      }
    }
    /** The number of turns the user must commit to for this move's damage 
     * Change this, use cooldown instead and add the charging turn
    */
    let numTurns = 1;

    // These are intentionally not else-if statements even though there are no
    // pokemon moves that have more than one of these attributes. This allows
    // the function to future proof new moves / custom move behaviors.
    if (this.isChargingMove() && !res?.instantCharge) {
      numTurns += 1;
    }
    return effectivePower / numTurns;
  }

  canBeMultiStrikeEnhanced(user, target) {
    if (this.isChargingMove()) {
      return false;
    }

    if (
      this.category === MoveCategory.STATUS
      || (target != null && user.getMoveCategory(target, this) === MoveCategory.STATUS)
    ) {
      return false;
    }

    const exceptAttrs = ["MultiHitAttr", "SacrificialAttr", "SacrificialAttrOnHit"];
    if (exceptAttrs.some(attr => this.hasAttr(attr))) {
      return false;
    }

    return true;
  }
}

export class AttackMove extends Move {
  constructor(
    id,
    type,
    category,
    power,
    accuracy,
    pp,
    chance,
    priority,
    generation,
  ) {
    super(id, type, category, MoveTarget.NEAR_OTHER, power, accuracy, pp, chance, priority, generation);

    if (this.type === PokemonType.FIRE) {
      this.addAttr(new HealStatusEffectAttr(false, StatusEffect.FREEZE));
    }
  }

  is(moveKind) {
    return moveKind === "AttackMove";
  }

  getTargetBenefitScore(user, target, move) {}
}

export class StatusMove extends Move {
  constructor(
    id,
    type,
    accuracy,
    pp,
    chance,
    priority,
    generation,
  ) {
    super(id, type, MoveCategory.STATUS, MoveTarget.NEAR_OTHER, -1, accuracy, pp, chance, priority, generation);
  }

  is(moveKind) {
    return moveKind === "StatusMove";
  }
}

export class SelfStatusMove extends Move {
  constructor(
    id,
    type,
    accuracy,
    pp,
    chance,
    priority,
    generation,
  ) {
    super(id, type, MoveCategory.STATUS, MoveTarget.USER, -1, accuracy, pp, chance, priority, generation);
  }

  is(moveKind) {
    return moveKind === "SelfStatusMove";
  }
}

function ChargeMove(Base, _nameAppend) {
  // NB cannot be made into a oneline return
  class Charging extends Base {
    /** The animation to play during the move's charging phase */
    chargeAnim = ChargeAnim[`${MoveId[this.id]}_CHARGING`];
    /** The message to show during the move's charging phase */
    _chargeText;

    /** Move attributes that apply during the move's charging phase */
    chargeAttrs = [];

    isChargingMove() {
      return true;
    }

    /**
     * Sets the text to be displayed during this move's charging phase. \
     * References to the user Pokemon should be written as `"{USER}"`, and
     * references to the target Pokemon should be written as `"{TARGET}"`.
     * @param chargeText the text to set
     * @returns this {@linkcode Move} (for chaining API purposes)
     */
    chargeText(chargeText) {
      this._chargeText = chargeText;
      return this;
    }

    /**
     * Queues the charge text to display to the player
     * @param user the {@linkcode Pokemon} using this move
     * @param target the {@linkcode Pokemon} targeted by this move (optional)
     */
    showChargeText(user, target) {
      globalScene.phaseManager.queueMessage(
        this._chargeText
          .replace("{USER}", getPokemonNameWithAffix(user))
          .replace("{TARGET}", getPokemonNameWithAffix(target)),
      );
    }

    /**
     * Gets all charge attributes of the given attribute type.
     * @param attrType any attribute that extends {@linkcode MoveAttr}
     * @returns Array of attributes that match `attrType`, or an empty array if
     * no matches are found.
     */
    getChargeAttrs(attrType) {
      const targetAttr = MoveAttrs[attrType];
      if (!targetAttr) {
        return [];
      }
      return this.chargeAttrs.filter((attr) => attr instanceof targetAttr);
    }

    /**
     * Checks if this move has an attribute of the given type.
     * @param attrType any attribute that extends {@linkcode MoveAttr}
     * @returns `true` if a matching attribute is found; `false` otherwise
     */
    hasChargeAttr(attrType) {
      const targetAttr = MoveAttrs[attrType];
      if (!targetAttr) {
        return false;
      }
      return this.chargeAttrs.some(attr => attr instanceof targetAttr);
    }

    /**
     * Adds an attribute to this move to be applied during the move's charging phase
     * @param ChargeAttrType the type of {@linkcode MoveAttr} being added
     * @param args the parameters to construct the given {@linkcode MoveAttr} with
     * @returns this {@linkcode Move} (for chaining API purposes)
     */
    chargeAttr(ChargeAttrType, ...args) {
      const chargeAttr = new ChargeAttrType(...args);
      this.chargeAttrs.push(chargeAttr);

      return this;
    }
  }
  return Charging;
}

export class ChargingAttackMove extends ChargeMove(AttackMove, "ChargingAttackMove") {}
export class ChargingSelfStatusMove extends ChargeMove(SelfStatusMove, "ChargingSelfStatusMove") {}

/** Base class defining all {@linkcode Move} Attributes */
export class MoveAttr {
  /** Should this {@linkcode Move} target the user? */
  selfTarget;

  /**
   * Return whether this attribute is of the given type.
   *
   * @remarks
   * Used to avoid requring the caller to have imported the specific attribute type, avoiding circular dependencies.
   * @param attr - The attribute to check against
   * @returns Whether the attribute is an instance of the given type.
   */
  is(attr)  {
    const targetAttr = MoveAttrs[attr];
    if (!targetAttr) {
      return false;
    }
    return this instanceof targetAttr;
  }

  constructor(selfTarget = false) {
    this.selfTarget = selfTarget;
  }

  /**
   * Applies move attributes
   * @see {@linkcode applyMoveAttrsInternal}
   * @virtual
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @param args Set of unique arguments needed by this attribute
   * @returns true if application of the ability succeeds
   */
  apply(_user, _target, _move, _args) {
    return true;
  }

  /**
   * Return this `MoveAttr`'s associated {@linkcode MoveCondition} or {@linkcode MoveConditionFunc}.
   * The specified condition will be added to all {@linkcode Move}s with this attribute,
   * and moves **will fail upon use** if _at least 1_ of their attached conditions returns `false`.
   */
  getCondition() {
    return null;
  }

  /**
   * @virtual
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @returns the string representing failure of this {@linkcode Move}
   */
  getFailedText(_user, _target, _move) {
    return;
  }

  /**
   * Used by the Enemy AI to rank an attack based on a given user
   * @see {@linkcode EnemyPokemon.getNextMove}
   * @virtual
   */
  getUserBenefitScore(_user, _target, _move) {
    return 0;
  }

  /**
   * Used by the Enemy AI to rank an attack based on a given target
   * @see {@linkcode EnemyPokemon.getNextMove}
   * @virtual
   */
  getTargetBenefitScore(_user, _target, _move) {
    return 0;
  }
}

/**
 * Base class defining all Move Effect Attributes
 */
export class MoveEffectAttr extends MoveAttr {
  /**
   * A container for this attribute's optional parameters
   * @see {@linkcode MoveEffectAttrOptions} for supported params.
   */
  options;

  constructor(selfTarget, options) {
    super(selfTarget);
    this.options = options;
  }

  /**
   * Defines when this effect should trigger in the move's effect order.
   * @defaultValue {@linkcode MoveEffectTrigger.POST_APPLY}
   */
  get trigger() {
    return this.options?.trigger ?? MoveEffectTrigger.POST_APPLY;
  }

  /**
   * `true` if this effect should only trigger on the first hit of
   * multi-hit moves.
   * @defaultValue `false`
   */
  get firstHitOnly() {
    return this.options?.firstHitOnly ?? false;
  }

  /**
   * `true` if this effect should only trigger on the last hit of
   * multi-hit moves.
   * @defaultValue `false`
   */
  get lastHitOnly() {
    return this.options?.lastHitOnly ?? false;
  }

  /**
   * `true` if this effect should apply only upon hitting a target
   * for the first time when targeting multiple {@linkcode Pokemon}.
   * @defaultValue `false`
   */
  get firstTargetOnly() {
    return this.options?.firstTargetOnly ?? false;
  }

  /**
   * If defined, overrides the move's base chance for this
   * secondary effect to trigger.
   */
  get effectChanceOverride() {
    return this.options?.effectChanceOverride;
  }

  /**
   * Determine whether this {@linkcode MoveAttr}'s effects are able to {@linkcode apply | be applied} to the target.
   *
   * Will **NOT** cause the move to fail upon returning `false` (unlike {@linkcode getCondition};
   * merely that the effect for this attribute will be nullified.
   * @param user - The {@linkcode Pokemon} using the move
   * @param target - The {@linkcode Pokemon} being targeted by the move, or {@linkcode user} if the move is
   * {@linkcode selfTarget | self-targeting}
   * @param _move - The {@linkcode Move} being used
   * @param _args - Set of unique arguments needed by this attribute
   * @returns `true` if basic application of this `MoveAttr`s effects should be possible
   */
  // TODO: Decouple this check from the `apply` step
  // TODO: Make non-damaging moves fail by default if none of their attributes can apply
  canApply(user, target, _move, _args) {
    return !(this.selfTarget ? user : target).isFainted();
  }

  /** Applies move effects so long as they are able based on {@linkcode canApply} */
  apply(user, target, move, args) {
    return this.canApply(user, target, move, args);
  }

  /**
   * Gets the used move's additional effect chance.
   * Chance is modified by {@linkcode MoveEffectChanceMultiplierAbAttr} and {@linkcode IgnoreMoveEffectsAbAttr}.
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon | Target} of this move
   * @param move {@linkcode Move} being used
   * @param selfEffect `true` if move targets user.
   * @returns Move effect chance value.
   */
  getMoveChance(user, target, move, selfEffect, showAbility) {
    const moveChance = new NumberHolder(this.effectChance?? move.chance);

    applyAbAttrs("MoveEffectChanceMultiplierAbAttr", {
      pokemon: user,
      simulated: !showAbility,
      chance: moveChance,
      move,
    });

    if ((!move.hasAttr("FlinchAttr") || moveChance.value <= move.chance) && !move.hasAttr("SecretPowerAttr")) {
      const userSide = user.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
      globalScene.arena.applyTagsForSide(ArenaTagType.WATER_FIRE_PLEDGE, userSide, moveChance);
    }

    if (!selfEffect) {
      applyAbAttrs("IgnoreMoveEffectsAbAttr", { pokemon: target, move, simulated: !showAbility, chance: moveChance });
    }
    return moveChance.value;
  }
}

/**
 * Base class defining all Move Header attributes.
 * Move Header effects apply at the beginning of a turn before any moves are resolved.
 * They can be used to apply effects to the field (e.g. queueing a message) or to the user
 * (e.g. adding a battler tag).
 */
export class MoveHeaderAttr extends MoveAttr {
  constructor() {
    super(true);
  }
}

/**
 * Header attribute to queue a message at the beginning of a turn.
 */
export class MessageHeaderAttr extends MoveHeaderAttr {
  /** The message to display, or a function producing one. */
  message;

  constructor(message) {
    super();
    this.message = message;
  }

  apply(user, target, move) {
    const message = typeof this.message === "string" ? this.message : this.message(user, target, move);

    if (message) {
      globalScene.phaseManager.queueMessage(message);
      return true;
    }
    return false;
  }
}

/**
 * Header attribute to add a battler tag to the user at the beginning of a turn.
 * @see {@linkcode MoveHeaderAttr}
 */
export class AddBattlerTagHeaderAttr extends MoveHeaderAttr {
  tagType;

  constructor(tagType) {
    super();
    this.tagType = tagType;
  }

  apply(user, _target, _move, _args) {
    user.addTag(this.tagType);
    return true;
  }
}

/**
 * Header attribute to implement the "charge phase" of Beak Blast at the
 * beginning of a turn.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Beak_Blast_(move) | Beak Blast}
 * @see {@linkcode BeakBlastChargingTag}
 */
export class BeakBlastHeaderAttr extends AddBattlerTagHeaderAttr {
  /** Required to initialize Beak Blast's charge animation correctly */
  chargeAnim = ChargeAnim.BEAK_BLAST_CHARGING;

  constructor() {
    super(BattlerTagType.BEAK_BLAST_CHARGING);
  }
}

/**
 * Attribute to display a message before a move is executed.
 */
export class PreMoveMessageAttr extends MoveAttr {
  /** The message to display or a function returning one */
  message;

  /**
   * Create a new {@linkcode PreMoveMessageAttr} to display a message before move execution.
   * @param message - The message to display before move use, either` a literal string or a function producing one.
   * @remarks
   * If {@linkcode message} evaluates to an empty string (`""`), no message will be displayed
   * (though the move will still succeed).
   */
  constructor(message) {
    super();
    this.message = message;
  }

  apply(user, target, move) {
    const message = typeof this.message === "function" ? this.message(user, target, move) : this.message;

    // TODO: Consider changing if/when MoveAttr `apply` return values become significant
    if (message) {
      globalScene.phaseManager.queueMessage(message, 500);
      return true;
    }
    return false;
  }
}

/**
 * Attribute for moves that can be conditionally interrupted to be considered to
 * have failed before their "useMove" message is displayed. Currently used by
 * Focus Punch.
 */
export class PreUseInterruptAttr extends MoveAttr {
  message;
  conditionFunc;

  /**
   * Create a new MoveInterruptedMessageAttr.
   * @param message The message to display when the move is interrupted, or a function that formats the message based on the user, target, and move.
   */
  constructor(message, conditionFunc) {
    super();
    this.message = message;
    this.conditionFunc = conditionFunc;
  }

  /**
   * Cancel the current MovePhase and queue the interrupt message if the condition is met
   * @param user - {@linkcode Pokemon} using the move
   * @param target - {@linkcode Pokemon} target of the move
   * @param move - {@linkcode Move} with this attribute
   */
  apply(user, target, move) {
    const currentPhase = globalScene.phaseManager.getCurrentPhase();
    if (!currentPhase.is("MovePhase") || !this.conditionFunc(user, target, move)) {
      return false;
    }
    currentPhase.cancel();
    globalScene.phaseManager.queueMessage(
      typeof this.message === "string" ? this.message : this.message(user, target, move),
    );
    return true;
  }

  /**
   * Message to display when a move is interrupted.
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   */
  getFailedText(user, target, move) {
    if (this.message && this.conditionFunc(user, target, move)) {
      return typeof this.message === "string" ? this.message : this.message(user, target, move);
    }
  }
}

/**
 * Attribute for Status moves that take attack type effectiveness
 * into consideration (i.e. {@linkcode https://bulbapedia.bulbagarden.net/wiki/Thunder_Wave_(move) | Thunder Wave})
 */
export class RespectAttackTypeImmunityAttr extends MoveAttr {}

export class IgnoreOpponentStatStagesAttr extends MoveAttr {
  apply(_user, _target, _move, args) {
    (args[0]).value = true;

    return true;
  }
}

export class HighCritAttr extends MoveAttr {
  apply(_user, _target, _move, args) {
    (args[0]).value++;

    return true;
  }

  getUserBenefitScore(_user, _target, _move) {
    return 3;
  }
}

export class CritOnlyAttr extends MoveAttr {
  apply(_user, _target, _move, args) {
    (args[0]).value = true;

    return true;
  }

  getUserBenefitScore(_user, _target, _move) {
    return 5;
  }
}

export class FixedDamageAttr extends MoveAttr {
  damage;

  constructor(damage) {
    super();

    this.damage = damage;
  }

  apply(user, target, move, args) {
    (args[0]).value = this.getDamage(user, target, move);

    return true;
  }

  getDamage(_user, _target, _move) {
    return this.damage;
  }
}

export class UserHpDamageAttr extends FixedDamageAttr {
  constructor() {
    super(0);
  }

  apply(user, _target, _move, args) {
    (args[0]).value = user.hp;

    return true;
  }
}

export class TargetHalfHpDamageAttr extends FixedDamageAttr {
  /**
   * The initial amount of hp the target had before the first hit.
   * Used for calculating multi lens damage.
   */
  initialHp;
  constructor() {
    super(0);
  }

  apply(user, target, _move, args) {
    const [dmg] = args;

    // first, determine if the hit is coming from multi lens or not
    const lensCount =
      user
        .getHeldItems()
        .find(i => i instanceof PokemonMultiHitModifier)
        ?.getStackCount() ?? 0;
    if (lensCount <= 0) {
      // no multi lenses; we can just halve the target's hp and call it a day
      dmg.value = toDmgValue(target.hp / 2);
      return true;
    }

    // figure out what hit # we're on
    switch (user.turnData.hitCount - user.turnData.hitsLeft) {
      case lensCount + 1:
        // parental bond added hit; halve target's hp as normal
        dmg.value = toDmgValue(target.hp / 2);
        return true;
      // biome-ignore lint/suspicious/noFallthroughSwitchClause: intentional
      case 0:
        // first hit of move; update initialHp tracker for first hit
        this.initialHp = target.hp;
      default:
        // multi lens added hit; use initialHp tracker to ensure correct damage
        dmg.value = toDmgValue(this.initialHp / 2);
        return true;
    }
  }

  getTargetBenefitScore(_user, target, _move) {
    return target.getHpRatio() > 0.5 ? Math.floor((target.getHpRatio() - 0.5) * -24 + 4) : -20;
  }
}

export class MatchHpAttr extends FixedDamageAttr {
  constructor() {
    super(0);
  }

  apply(user, target, _move, args) {
    (args[0]).value = target.hp - user.hp;

    return true;
  }

  getCondition() {
    return (user, target, _move) => user.hp <= target.hp;
  }

  // TODO
  /*getUserBenefitScore(user, target, move) {
    return 0;
  }*/
}

export class CounterDamageAttr extends FixedDamageAttr {
  /** The damage category of counter attacks to process, or `undefined` for either */
  moveFilter;
  multiplier;

  /**
   * @param multiplier - The damage multiplier to apply to the total damage received
   * @param moveFilter - If set, only damage from moves of this category will be counted, otherwise all damage is counted
   */
  constructor(multiplier, moveFilter) {
    super(0);
    this.multiplier = multiplier;
    this.moveFilter = moveFilter;
  }

  apply(user, _target, _move, args) {
    const damage =
      user.turnData.attacksReceived.find(ar => {
        const category = allMoves[ar.move].category;
        return (
          category !== MoveCategory.STATUS
          && !areAllies(user.getBattlerIndex(), ar.sourceBattlerIndex)
          && (this.moveFilter === undefined || category === this.moveFilter)
        );
      })?.damage ?? 0;
    (args[0]).value = toDmgValue(damage * this.multiplier);
    return true;
  }
}

/**
 * Attribute for counter-like moves to redirect the move to a different target
 */
export class CounterRedirectAttr extends MoveAttr {
  moveFilter;
  constructor(moveFilter) {
    super();
    if (moveFilter !== undefined) {
      this.moveFilter = moveFilter;
    }
  }

  /**
   * Applies the counter redirect attribute to the move
   * @param user - The user of the counter move
   * @param target - The target of the move (unused)
   * @param move - The move being used
   * @param args - args[0] holds the battler index of the target that the move will be redirected to
   */
  apply(user, _target, _move, args) {
    const desiredTarget = getCounterAttackTarget(user, this.moveFilter);
    if (desiredTarget !== null && desiredTarget !== BattlerIndex.ATTACKER) {
      // check if the target is still alive
      if (globalScene.currentBattle.double && !globalScene.getField()[desiredTarget]?.isActive(true)) {
        const targetField =
          desiredTarget >= BattlerIndex.ENEMY ? globalScene.getEnemyField() : globalScene.getPlayerField();
        args[0].value = targetField.find(p => p.hp > 0)?.getBattlerIndex() ?? BattlerIndex.ATTACKER;
      } else {
        args[0].value = desiredTarget;
      }
      return true;
    }
    return false;
  }
}

export class LevelDamageAttr extends FixedDamageAttr {
  constructor() {
    super(0);
  }

  getDamage(user, _target, _move) {
    return user.level;
  }
}

export class RandomLevelDamageAttr extends FixedDamageAttr {
  constructor() {
    super(0);
  }

  getDamage(user, _target, _move) {
    return toDmgValue(user.level * (user.randBattleSeedIntRange(50, 150) * 0.01));
  }
}

export class ModifiedDamageAttr extends MoveAttr {
  apply(user, target, move, args) {
    const initialDamage = args[0];
    initialDamage.value = this.getModifiedDamage(user, target, move, initialDamage.value);

    return true;
  }

  getModifiedDamage(_user, _target, _move, damage) {
    return damage;
  }
}

export class SurviveDamageAttr extends ModifiedDamageAttr {
  getModifiedDamage(_user, target, _move, damage) {
    return Math.min(damage, target.hp - 1);
  }

  getUserBenefitScore(_user, target, _move) {
    return target.hp > 1 ? 0 : -20;
  }
}

/**
 * Move attribute to display arbitrary text during a move's execution.
 */
export class MessageAttr extends MoveEffectAttr {
  /** The message to display, either as a string or a function returning one. */
  message;

  constructor(message, options) {
    // TODO: Do we need to respect `selfTarget` if we're just displaying text?
    super(false, options);
    this.message = message;
  }

  apply(user, target, move) {
    const message = typeof this.message === "function" ? this.message(user, target, move) : this.message;

    // TODO: Consider changing if/when MoveAttr `apply` return values become significant
    if (message) {
      globalScene.phaseManager.queueMessage(message, 500);
      return true;
    }
    return false;
  }
}

export class RecoilAttr extends MoveEffectAttr {
  useHp;
  damageRatio;
  unblockable;

  constructor(useHp = false, damageRatio = 0.25, unblockable = false) {
    super(true, { lastHitOnly: true });

    this.useHp = useHp;
    this.damageRatio = damageRatio;
    this.unblockable = unblockable;
  }

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const cancelled = new BooleanHolder(false);
    if (!this.unblockable) {
      const abAttrParams = { pokemon: user, cancelled };
      applyAbAttrs("BlockRecoilDamageAttr", abAttrParams);
      applyAbAttrs("BlockNonDirectDamageAbAttr", abAttrParams);
    }

    if (cancelled.value) {
      return false;
    }

    // Chloroblast and Struggle should not deal recoil damage if the move was not successful
    if (
      this.useHp
      && [MoveResult.FAIL, MoveResult.MISS].includes(user.getLastXMoves(1)[0]?.result ?? MoveResult.FAIL)
    ) {
      return false;
    }

    const damageValue = (this.useHp ? user.getMaxHp() : user.turnData.totalDamageDealt) * this.damageRatio;
    const minValue = user.turnData.totalDamageDealt ? 1 : 0;
    const recoilDamage = toDmgValue(damageValue, minValue);
    if (!recoilDamage) {
      return false;
    }

    if (cancelled.value) {
      return false;
    }

    user.damageAndUpdate(recoilDamage, { result: HitResult.INDIRECT, ignoreSegments: true });
    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:hitWithRecoil", { pokemonName: getPokemonNameWithAffix(user) }),
    );
    user.turnData.damageTaken += recoilDamage;

    return true;
  }

  getUserBenefitScore(_user, _target, move) {
    return Math.floor(move.power / 5 / -4);
  }
}

/**
 * Attribute used for moves which self KO the user regardless if the move hits a target
 */
export class SacrificialAttr extends MoveEffectAttr {
  constructor() {
    super(true, { trigger: MoveEffectTrigger.POST_TARGET });
  }

  /**
   * Deals damage to the user equal to their current hp
   * @param user {@linkcode Pokemon} that used the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @param args N/A
   * @returns true if the function succeeds
   */
  apply(user, _target, _move, _args) {
    user.damageAndUpdate(user.hp, { result: HitResult.INDIRECT, ignoreSegments: true });
    user.turnData.damageTaken += user.hp;

    return true;
  }

  getUserBenefitScore(user, target, move) {
    if (user.isBoss()) {
      return -20;
    }
    return Math.ceil(
      ((1 - user.getHpRatio()) * 10 - 10) * (target.getAttackTypeEffectiveness(move.type, { source: user }) - 0.5),
    );
  }
}

/**
 * Attribute used for moves which self KO the user but only if the move hits a target
 */
export class SacrificialAttrOnHit extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  /**
   * Deals damage to the user equal to their current hp if the move lands
   * @param user {@linkcode Pokemon} that used the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @param args N/A
   * @returns true if the function succeeds
   */
  apply(user, target, move, args) {
    // If the move fails to hit a target, then the user does not faint and the function returns false
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    user.damageAndUpdate(user.hp, { result: HitResult.INDIRECT, ignoreSegments: true });
    user.turnData.damageTaken += user.hp;

    return true;
  }

  getUserBenefitScore(user, target, move) {
    if (user.isBoss()) {
      return -20;
    }
    return Math.ceil(
      ((1 - user.getHpRatio()) * 10 - 10) * (target.getAttackTypeEffectiveness(move.type, { source: user }) - 0.5),
    );
  }
}

/**
 * Attribute used for moves which cut the user's Max HP in half.
 * Triggers using {@linkcode MoveEffectTrigger.POST_TARGET}.
 */
export class HalfSacrificialAttr extends MoveEffectAttr {
  constructor() {
    super(true, { trigger: MoveEffectTrigger.POST_TARGET });
  }

  /**
   * Cut's the user's Max HP in half and displays the appropriate recoil message
   * @param user {@linkcode Pokemon} that used the move
   * @param target N/A
   * @param move {@linkcode Move} with this attribute
   * @param args N/A
   * @returns true if the function succeeds
   */
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const cancelled = new BooleanHolder(false);
    // Check to see if the Pokemon has an ability that blocks non-direct damage
    applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon: user, cancelled });
    if (!cancelled.value) {
      user.damageAndUpdate(toDmgValue(user.getMaxHp() / 2), { result: HitResult.INDIRECT, ignoreSegments: true });
      globalScene.phaseManager.queueMessage(
        i18next.t("moveTriggers:cutHpPowerUpMove", { pokemonName: getPokemonNameWithAffix(user) }),
      ); // Queue recoil message
    }
    return true;
  }

  getUserBenefitScore(user, target, move) {
    if (user.isBoss()) {
      return -10;
    }
    return Math.ceil(
      ((1 - user.getHpRatio() / 2) * 10 - 10) * (target.getAttackTypeEffectiveness(move.type, { source: user }) - 0.5),
    );
  }
}

/**
 * Attribute to put in a {@link https://bulbapedia.bulbagarden.net/wiki/Substitute_(doll) | Substitute Doll} for the user.
 *
 * Used for {@linkcode MoveId.SUBSTITUTE} and {@linkcode MoveId.SHED_TAIL}.
 */
export class AddSubstituteAttr extends MoveEffectAttr {
  /** The percentage of the user's maximum HP that is required to apply this effect. */
  hpCost;
  /** Whether the damage taken should be rounded up (Shed Tail rounds up). */
  roundUp;

  constructor(hpCost, roundUp) {
    super(true);

    this.hpCost = hpCost;
    this.roundUp = roundUp;
  }

  /**
   * Helper function to compute the amount of HP required to create a substitute.
   * @param user - The {@linkcode Pokemon} using the move
   * @returns The amount of HP that is required to create a substitute.
   */
  getHpCost(user) {
    return (this.roundUp ? Math.ceil : toDmgValue)(user.getMaxHp() * this.hpCost);
  }

  /**
   * Remove a fraction of the user's maximum HP to create a 25% HP substitute doll.
   * @param user - The {@linkcode Pokemon} using the move
   * @param target - n/a
   * @param move - The {@linkcode Move} being used
   * @param args - n/a
   * @returns Whether the attribute successfully applied
   */
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const dmgTaken = this.getHpCost(user);
    user.damageAndUpdate(dmgTaken, { result: HitResult.INDIRECT, ignoreSegments: true, ignoreFaintPhase: true });
    user.addTag(BattlerTagType.SUBSTITUTE, 0, move.id, user.id);
    return true;
  }

  getUserBenefitScore(user, _target, _move) {
    if (user.isBoss()) {
      return -10;
    }
    return 5;
  }

  getCondition() {
    return user => !user.getTag(SubstituteTag) && user.hp > this.getHpCost(user);
  }

  getFailedText(user) {
    if (user.getTag(SubstituteTag)) {
      return i18next.t("moveTriggers:substituteOnOverlap", { pokemonName: getPokemonNameWithAffix(user) });
    }
    if (user.hp <= this.getHpCost(user)) {
      return i18next.t("moveTriggers:substituteNotEnoughHp");
    }
  }
}

/**
 * Heals the user or target by {@linkcode healRatio} depending on the value of {@linkcode selfTarget}
 */
export class HealAttr extends MoveEffectAttr {
  /** The percentage of {@linkcode Stat.HP} to heal. */
  healRatio;
  /** Whether to display a healing animation when healing the target; default `false` */
  showAnim;

  constructor(healRatio, showAnim = false, selfTarget = true) {
    super(selfTarget);

    this.healRatio = healRatio;
    this.showAnim = showAnim;
  }

  apply(user, target, _move, _args) {
    this.addHealPhase(this.selfTarget ? user : target, this.healRatio);
    return true;
  }

  /**
   * Creates a new {@linkcode PokemonHealPhase}.
   * This heals the target and shows the appropriate message.
   */
  addHealPhase(target, healRatio) {
    globalScene.phaseManager.unshiftNew(
      "PokemonHealPhase",
      target.getBattlerIndex(),
      toDmgValue(target.getMaxHp() * healRatio),
      i18next.t("moveTriggers:healHp", { pokemonName: getPokemonNameWithAffix(target) }),
      true,
      !this.showAnim,
    );
  }

  getTargetBenefitScore(user, target, _move) {
    const score = (1 - (this.selfTarget ? user : target).getHpRatio()) * 20 - this.healRatio * 10;
    return Math.round(score / (1 - this.healRatio / 2));
  }

  // TODO: Change to fail move
  canApply(user, target, _move, _args) {
    if (!super.canApply(user, target, _move, _args)) {
      return false;
    }

    const healedPokemon = this.selfTarget ? user : target;
    if (healedPokemon.isFullHp()) {
      // Ensure the fail message isn't displayed when checking the move conditions outside of the move execution
      // TOOD: Fix this in PR#6276
      const phaseManager = globalScene.phaseManager;
      if (phaseManager.getCurrentPhase().is("MovePhase")) {
        phaseManager.queueMessage(
          i18next.t("battle:hpIsFull", {
            pokemonName: getPokemonNameWithAffix(healedPokemon),
          }),
        );
      }
      return false;
    }
    return true;
  }
}

/**
 * Attribute to put the user to sleep for a fixed duration, fully heal them and cure their status.
 * Used for {@linkcode MoveId.REST}.
 */
export class RestAttr extends HealAttr {
  duration;

  constructor(duration) {
    super(1, true);
    this.duration = duration;
  }

  apply(user, target, move, args) {
    const wasSet = user.trySetStatus(
      StatusEffect.SLEEP,
      user,
      this.duration,
      null,
      true,
      true,
      i18next.t("moveTriggers:restBecameHealthy", {
        pokemonName: getPokemonNameWithAffix(user),
      }),
    );
    return wasSet && super.apply(user, target, move, args);
  }

  addHealPhase(user) {
    globalScene.phaseManager.unshiftNew("PokemonHealPhase", user.getBattlerIndex(), user.getMaxHp(), null);
  }

  // TODO: change after HealAttr is changed to fail move
  getCondition() {
    return (user, target, move) =>
      super.canApply(user, target, move, []) // Intentionally suppress messages here as we display generic fail msg // TODO might have order-of-operation jank
      && user.canSetStatus(StatusEffect.SLEEP, true, true, user);
  }
}

/**
 * Cures the user's party of non-volatile status conditions, ie. Heal Bell, Aromatherapy
 */
export class PartyStatusCureAttr extends MoveEffectAttr {
  /** Message to display after using move */
  message;
  /** Skips mons with this ability, ie. Soundproof */
  abilityCondition;

  constructor(message, abilityCondition) {
    super();

    this.message = message;
    this.abilityCondition = abilityCondition;
  }

  //The same as MoveEffectAttr.canApply, except it doesn't check for the target's HP.
  canApply(user, target, move, _args) {
    const isTargetValid =
      (this.selfTarget && user.hp && !user.getTag(BattlerTagType.FRENZY))
      || (!this.selfTarget && (!target.getTag(BattlerTagType.PROTECTED) || move.hasFlag(MoveFlags.IGNORE_PROTECT)));
    return !!isTargetValid;
  }

  apply(user, target, move, args) {
    if (!this.canApply(user, target, move, args)) {
      return false;
    }
    const partyPokemon = user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
    for (const p of partyPokemon) {
      this.cureStatus(p, user.id);
    }

    if (this.message) {
      globalScene.phaseManager.queueMessage(this.message);
    }

    return true;
  }

  /**
   * Tries to cure the status of the given {@linkcode Pokemon}
   * @param pokemon The {@linkcode Pokemon} to cure.
   * @param userId The ID of the (move) {@linkcode Pokemon | user}.
   */
  cureStatus(pokemon, userId) {
    if (!pokemon.isOnField() || pokemon.id === userId) {
      // user always cures its own status, regardless of ability
      pokemon.resetStatus(false);
      pokemon.updateInfo();
    } else if (pokemon.hasAbility(this.abilityCondition)) {
      // TODO: Ability displays should be handled by the ability
      globalScene.phaseManager.queueAbilityDisplay(
        pokemon,
        pokemon.getPassiveAbility()?.id === this.abilityCondition,
        true,
      );
      globalScene.phaseManager.queueAbilityDisplay(
        pokemon,
        pokemon.getPassiveAbility()?.id === this.abilityCondition,
        false,
      );
    } else {
      pokemon.resetStatus();
      pokemon.updateInfo();
    }
  }
}

/**
 * Applies damage to the target's ally equal to 1/16 of that ally's max HP.
 */
export class FlameBurstAttr extends MoveEffectAttr {
  constructor() {
    /**
     * This is self-targeted to bypass immunity to target-facing secondary
     * effects when the target has an active Substitute doll.
     * TODO: Find a more intuitive way to implement Substitute bypassing.
     */
    super(true);
  }
  /**
   * @param user - n/a
   * @param target - The target Pokémon.
   * @param move - n/a
   * @param args - n/a
   * @returns A boolean indicating whether the effect was successfully applied.
   */
  apply(_user, target, _move, _args) {
    const targetAlly = target.getAlly();
    const cancelled = new BooleanHolder(false);

    if (targetAlly != null) {
      applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon: targetAlly, cancelled });
    }

    if (cancelled.value || !targetAlly || targetAlly.switchOutStatus) {
      return false;
    }

    targetAlly.damageAndUpdate(Math.max(1, Math.floor((1 / 16) * targetAlly.getMaxHp())), {
      result: HitResult.INDIRECT,
    });
    return true;
  }

  getTargetBenefitScore(_user, target, _move) {
    return target.getAlly() != null ? -5 : 0;
  }
}

export class SacrificialFullRestoreAttr extends SacrificialAttr {
  restorePP;
  moveMessage;

  constructor(restorePP, moveMessage) {
    super();

    this.restorePP = restorePP;
    this.moveMessage = moveMessage;
  }

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    // Add a tag to the field if it doesn't already exist, then queue a delayed healing effect in the user's current slot.
    globalScene.arena.addTag(ArenaTagType.PENDING_HEAL, 0, move.id, user.id); // Arguments after first go completely unused
    const tag = globalScene.arena.getTag(ArenaTagType.PENDING_HEAL);
    tag.queueHeal(user.getBattlerIndex(), {
      sourceId: user.id,
      moveId: move.id,
      restorePP: this.restorePP,
      healMessage: i18next.t(this.moveMessage, { pokemonName: getPokemonNameWithAffix(user) }),
    });

    return true;
  }

  getUserBenefitScore(_user, _target, _move) {
    return -20;
  }

  getCondition() {
    return (_user, _target, _move) =>
      globalScene.getPlayerParty().filter(p => p.isActive()).length > globalScene.currentBattle.getBattlerCount();
  }
}

/**
 * Attribute used for moves which ignore type-based debuffs from weather, namely Hydro Steam.
 * Called during damage calculation after getting said debuff from getAttackTypeMultiplier in the Pokemon class.
 */
export class IgnoreWeatherTypeDebuffAttr extends MoveAttr {
  /** The {@linkcode WeatherType} this move ignores */
  weather;

  constructor(weather) {
    super();
    this.weather = weather;
  }
  /**
   * Changes the type-based weather modifier if this move's power would be reduced by it
   * @param user {@linkcode Pokemon} that used the move
   * @param target N/A
   * @param move {@linkcode Move} with this attribute
   * @param args [0] {@linkcode NumberHolder} for arenaAttackTypeMultiplier
   * @returns true if the function succeeds
   */
  apply(_user, _target, _move, args) {
    const weatherModifier = args[0];
    //If the type-based attack power modifier due to weather (e.g. Water moves in Sun) is below 1, set it to 1
    if (globalScene.arena.weather?.weatherType === this.weather) {
      weatherModifier.value = Math.max(weatherModifier.value, 1);
    }
    return true;
  }
}

export class WeatherHealAttr extends HealAttr {
  constructor() {
    super(0.5);
  }

  apply(user, _target, _move, _args) {
    let healRatio = 0.5;
    if (!globalScene.arena.weather?.isEffectSuppressed()) {
      const weatherType = globalScene.arena.weather?.weatherType || WeatherType.NONE;
      healRatio = this.getWeatherHealRatio(weatherType);
    }
    this.addHealPhase(user, healRatio);
    return true;
  }
}

export class PlantHealAttr extends WeatherHealAttr {
  getWeatherHealRatio(weatherType) {
    switch (weatherType) {
      case WeatherType.SUNNY:
      case WeatherType.HARSH_SUN:
        return 2 / 3;
      case WeatherType.RAIN:
      case WeatherType.SANDSTORM:
      case WeatherType.HAIL:
      case WeatherType.SNOW:
      case WeatherType.FOG:
      case WeatherType.HEAVY_RAIN:
        return 0.25;
      default:
        return 0.5;
    }
  }
}

export class SandHealAttr extends WeatherHealAttr {
  getWeatherHealRatio(weatherType) {
    switch (weatherType) {
      case WeatherType.SANDSTORM:
        return 2 / 3;
      default:
        return 0.5;
    }
  }
}

/**
 * Heals the target or the user by either {@linkcode normalHealRatio} or {@linkcode boostedHealRatio}
 * depending on the evaluation of {@linkcode condition}
 */
export class BoostHealAttr extends HealAttr {
  /** Healing received when {@linkcode condition} is false */
  normalHealRatio;
  /** Healing received when {@linkcode condition} is true */
  boostedHealRatio;
  /** The lambda expression to check against when boosting the healing value */
  condition;

  constructor(
    normalHealRatio = 0.5,
    boostedHealRatio = 2 / 3,
    showAnim,
    selfTarget,
    condition,
  ) {
    super(normalHealRatio, showAnim, selfTarget);
    this.normalHealRatio = normalHealRatio;
    this.boostedHealRatio = boostedHealRatio;
    this.condition = condition;
  }

  /**
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @param args N/A
   * @returns true if the move was successful
   */
  apply(user, target, move, _args) {
    const healRatio = (this.condition ? this.condition(user, target, move) : false)
      ? this.boostedHealRatio
      : this.normalHealRatio;
    this.addHealPhase(target, healRatio);
    return true;
  }
}

/**
 * Heals the target only if it is the ally
 */
export class HealOnAllyAttr extends HealAttr {
  canApply(user, target, _move, _args) {
    // Don't trigger if not targeting an ally
    return target === user.getAlly() && super.canApply(user, target, _move, _args);
  }

  apply(user, target, _move, _args) {
    if (user.isOpponent(target)) {
      return false;
    }
    return super.apply(user, target, _move, _args);
  }
}

/**
 * Heals user as a side effect of a move that hits a target.
 * Healing is based on {@linkcode healRatio} * the amount of damage dealt or a stat of the target.
 */
// TODO: Make Strength Sap its own attribute that extends off of this one
export class HitHealAttr extends MoveEffectAttr {
  healRatio;
  healStat;

  constructor(healRatio, healStat) {
    super(true);

    this.healRatio = healRatio ?? 0.5;
    this.healStat = healStat ?? null;
  }
  /**
   * Heals the user the determined amount and possibly displays a message about regaining health.
   * If the target has the {@linkcode ReverseDrainAbAttr}, all healing is instead converted
   * to damage to the user.
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @param args N/A
   * @returns true if the function succeeds
   */
  apply(user, target, _move, _args) {
    if (target.hasAbilityWithAttr("ReverseDrainAbAttr")) {
      return false;
    }

    const healAmount = this.getHealAmount(user, target);
    let message = "";
    if (this.healStat !== null) {
      message = i18next.t("battle:drainMessage", { pokemonName: getPokemonNameWithAffix(target) });
    } else {
      message = i18next.t("battle:regainHealth", { pokemonName: getPokemonNameWithAffix(user) });
    }

    globalScene.phaseManager.unshiftNew("PokemonHealPhase", user.getBattlerIndex(), healAmount, message, false, true);
    return true;
  }

  /**
   * Used by the Enemy AI to rank an attack based on a given user
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @returns an integer. Higher means enemy is more likely to use that move.
   */
  getUserBenefitScore(user, target, move) {
    if (this.healStat) {
      const healAmount = target.getEffectiveStat(this.healStat);
      return Math.floor(Math.max(0, Math.min(1, (healAmount + user.hp) / user.getMaxHp() - 0.33)) / user.getHpRatio());
    }
    return Math.floor(Math.max(1 - user.getHpRatio() - 0.33, 0) * (move.power / 4));
  }

  getHealAmount(user, target) {
    return this.healStat
      ? target.getEffectiveStat(this.healStat)
      : toDmgValue(user.turnData.singleHitDamageDealt * this.healRatio);
  }
}

/**
 * Attribute used for moves that change priority in a turn given a condition,
 * e.g. Grassy Glide
 * Called when move order is calculated in {@linkcode TurnStartPhase}.
 */
export class IncrementMovePriorityAttr extends MoveAttr {
  /** The condition for a move's priority being incremented */
  moveIncrementFunc;
  /** The amount to increment priority by, if condition passes. */
  increaseAmount;

  constructor(moveIncrementFunc, increaseAmount = 1) {
    super();

    this.moveIncrementFunc = moveIncrementFunc;
    this.increaseAmount = increaseAmount;
  }

  /**
   * Increments move priority by set amount if condition passes
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @param args [0] {@linkcode NumberHolder} for move priority.
   * @returns true if function succeeds
   */
  apply(user, target, move, args) {
    if (!this.moveIncrementFunc(user, target, move)) {
      return false;
    }

    (args[0]).value += this.increaseAmount;
    return true;
  }
}

/**
 * Attribute used for attack moves that hit multiple times per use, e.g. Bullet Seed.
 *
 * @remarks
 * Applied at the beginning of {@linkcode MoveEffectPhase}.
 */
export class MultiHitAttr extends MoveAttr {
  /** This move's intrinsic multi-hit type. It should never be modified. */
  intrinsicMultiHitType;
  /** This move's current multi-hit type. It may be temporarily modified by abilities (e.g., Battle Bond). */
  multiHitType;

  constructor(multiHitType) {
    super();

    this.intrinsicMultiHitType = multiHitType !== undefined ? multiHitType : MultiHitType.TWO_TO_FIVE;
    this.multiHitType = this.intrinsicMultiHitType;
  }

  // Currently used by `battle_bond.test.ts`
  getMultiHitType() {
    return this.multiHitType;
  }

  /**
   * Set the hit count of an attack based on this attribute instance's {@linkcode MultiHitType}.
   * If the target has an immunity to this attack's types, the hit count will always be 1.
   *
   * @param user {@linkcode Pokemon} that used the attack
   * @param target {@linkcode Pokemon} targeted by the attack
   * @param move {@linkcode Move} being used
   * @param args [0] {@linkcode NumberHolder} storing the hit count of the attack
   * @returns True
   */
  apply(user, target, move, args) {
    const hitType = new NumberHolder(this.intrinsicMultiHitType);
    applyMoveAttrs("ChangeMultiHitTypeAttr", user, target, move, hitType);
    this.multiHitType = hitType.value;

    (args[0]).value = this.getHitCount(user, target);
    return true;
  }

  getTargetBenefitScore(_user, _target, _move) {
    return -5;
  }

  /**
   * Calculate the number of hits that an attack should have given this attribute's
   * {@linkcode MultiHitType}.
   *
   * @param user {@linkcode Pokemon} using the attack
   * @param target {@linkcode Pokemon} targeted by the attack
   * @returns The number of hits this attack should deal
   */
  getHitCount(user, _target) {
    switch (this.multiHitType) {
      case MultiHitType.TWO_TO_FIVE: {
        const rand = user.randBattleSeedInt(20);
        const hitValue = new NumberHolder(rand);
        applyAbAttrs("MaxMultiHitAbAttr", { pokemon: user, hits: hitValue });
        if (hitValue.value >= 13) {
          return 2;
        }
        if (hitValue.value >= 6) {
          return 3;
        }
        if (hitValue.value >= 3) {
          return 4;
        }
        return 5;
      }
      case MultiHitType.TWO:
        return 2;
      case MultiHitType.THREE:
        return 3;
      case MultiHitType.TEN:
        return 10;
      case MultiHitType.BEAT_UP: {
        const party = user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
        // No status means the ally pokemon can contribute to Beat Up
        return party.reduce((total, pokemon) => {
          return (
            total
            + (pokemon.id === user.id ? 1 : pokemon?.status && pokemon.status.effect !== StatusEffect.NONE ? 0 : 1)
          );
        }, 0);
      }
    }
  }

  /**
   * Calculate the expected number of hits given this attribute's {@linkcode MultiHitType},
   * the move's accuracy, and a number of situational parameters.
   *
   * @param move - The move that this attribtue is applied to
   * @param partySize - The size of the user's party, used for {@linkcode MoveId.BEAT_UP | Beat Up} (default: `1`)
   * @param maxMultiHit - Whether the move should always hit the maximum number of times, e.g. due to {@linkcode AbilityId.SKILL_LINK | Skill Link} (default: `false`)
   * @param ignoreAcc - `true` if the move should ignore accuracy checks, e.g. due to  {@linkcode AbilityId.NO_GUARD | No Guard} (default: `false`)
   */
  calculateExpectedHitCount(
    move,
    ignoreAcc = false,
    maxMultiHit = false,
    partySize = 1,
    accMultiplier = 1
  ) {
    let expectedHits;
    switch (this.multiHitType) {
      case MultiHitType.TWO_TO_FIVE:
        expectedHits = maxMultiHit ? 5 : 3.1;
        break;
      case MultiHitType.TWO:
        expectedHits = 2;
        break;
      case MultiHitType.THREE:
        expectedHits = 3;
        break;
      case MultiHitType.TEN:
        expectedHits = 10;
        break;
      case MultiHitType.BEAT_UP:
        // Estimate that half of the party can contribute to beat up.
        expectedHits = Math.max(1, partySize / 2);
        break;
    }
    if (ignoreAcc || move.accuracy === -1) {
      return expectedHits;
    }
    const acc = Math.min((move.accuracy / 100) * accMultiplier, 100);
    if (move.hasFlag(MoveFlags.CHECK_ALL_HITS) && !maxMultiHit) {
      // N.B. No moves should be the _2_TO_5 variant and have the CHECK_ALL_HITS flag.
      return (acc * (1 - Math.pow(acc, expectedHits))) / (1 - acc);
    }
    return (expectedHits *= acc);
  }
}

export class ChangeMultiHitTypeAttr extends MoveAttr {
  apply(_user, _target, _move, _args) {
    //const hitType = args[0] as Utils.NumberHolder;
    return false;
  }
}

export class WaterShurikenMultiHitTypeAttr extends ChangeMultiHitTypeAttr {
  apply(user, _target, _move, args) {
    if (
      user.species.speciesId === SpeciesId.GRENINJA
      && user.hasAbility(AbilityId.BATTLE_BOND)
      && user.formIndex === 2
    ) {
      (args[0]).value = MultiHitType.THREE;
      return true;
    }
    return false;
  }
}

export class StatusEffectAttr extends MoveEffectAttr {
  effect;

  constructor(effect, selfTarget = false) {
    super(selfTarget);

    this.effect = effect;
  }

  apply(user, target, move, _args) {
    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, true);
    const statusCheck = moveChance < 0 || moveChance === 100 || user.randBattleSeedInt(100) < moveChance;
    if (!statusCheck) {
      return false;
    }

    const quiet = move.category !== MoveCategory.STATUS;

    return target.trySetStatus(this.effect, user, undefined, null, false, quiet);
  }

  getTargetBenefitScore(user, target, move) {
    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, false);
    const score = moveChance < 0 ? -10 : Math.floor(moveChance * -0.1);
    const pokemon = this.selfTarget ? user : target;

    return pokemon.canSetStatus(this.effect, true, false, user) ? score : 0;
  }
}

/**
 * Attribute to randomly apply one of several statuses to the target.
 * Used for {@linkcode Moves.TRI_ATTACK} and {@linkcode Moves.DIRE_CLAW}.
 */
export class MultiStatusEffectAttr extends StatusEffectAttr {
  effects;

  constructor(effects, selfTarget) {
    super(effects[0], selfTarget);
    this.effects = effects;
  }

  apply(user, target, move, args) {
    this.effect = randSeedItem(this.effects);
    const result = super.apply(user, target, move, args);
    return result;
  }

  getTargetBenefitScore(user, target, move) {
    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, false);
    const score = moveChance < 0 ? -10 : Math.floor(moveChance * -0.1);
    const pokemon = this.selfTarget ? user : target;

    return !pokemon.status && pokemon.canSetStatus(this.effect, true, false, user) ? score : 0;
  }
}

export class PsychoShiftEffectAttr extends MoveEffectAttr {
  constructor() {
    super(false);
  }

  /**
   * Applies the effect of {@linkcode MoveId.PSYCHO_SHIFT} to its target.
   * Psycho Shift takes the user's status effect and passes it onto the target.
   * The user is then healed after the move has been successfully executed.
   * @param user - The {@linkcode Pokemon} using the move
   * @param target - The {@linkcode Pokemon} targeted by the move.
   * @returns - Whether the effect was successfully applied to the target.
   */
  apply(user, target, _move, _args) {
    const statusToApply =
      user.status?.effect ?? (user.hasAbility(AbilityId.COMATOSE) ? StatusEffect.SLEEP : StatusEffect.NONE);

    // Bang is justified as condition func returns early if no status is found
    if (!target.trySetStatus(statusToApply, user)) {
      return false;
    }

    if (user.status) {
      // Add tag to user to heal its status effect after the move ends (unless we have comatose);
      // occurs after move use to ensure correct Synchronize timing
      user.addTag(BattlerTagType.PSYCHO_SHIFT);
    }

    return true;
  }

  getCondition() {
    return (user, target) => {
      if (target.status?.effect) {
        return false;
      }

      const statusToApply =
        user.status?.effect ?? (user.hasAbility(AbilityId.COMATOSE) ? StatusEffect.SLEEP : StatusEffect.NONE);
      return !!statusToApply && target.canSetStatus(statusToApply, false, false, user);
    };
  }

  getTargetBenefitScore(user, target, _move) {
    const statusToApply =
      user.status?.effect ?? (user.hasAbility(AbilityId.COMATOSE) ? StatusEffect.SLEEP : StatusEffect.NONE);

    // TODO: Give this a positive user benefit score
    return !target.status?.effect && statusToApply && target.canSetStatus(statusToApply, true, false, user) ? -10 : 0;
  }
}

/**
 * Attribute to steal items upon this move's use.
 * Used for {@linkcode MoveId.THIEF} and {@linkcode MoveId.COVET}.
 */
export class StealHeldItemChanceAttr extends MoveEffectAttr {
  chance;

  constructor(chance) {
    super(false);
    this.chance = chance;
  }

  apply(user, target, _move, _args) {
    const rand = randSeedFloat();
    if (rand > this.chance) {
      return false;
    }

    const heldItems = this.getTargetHeldItems(target).filter(i => i.isTransferable);
    if (heldItems.length === 0) {
      return false;
    }

    const poolType = target.isPlayer()
      ? ModifierPoolType.PLAYER
      : target.hasTrainer()
        ? ModifierPoolType.TRAINER
        : ModifierPoolType.WILD;
    const highestItemTier = heldItems
      .map(m => m.type.getOrInferTier(poolType))
      .reduce((highestTier, tier) => Math.max(tier, highestTier), 0); // TODO: is the bang after tier correct?
    const tierHeldItems = heldItems.filter(m => m.type.getOrInferTier(poolType) === highestItemTier);
    const stolenItem = tierHeldItems[user.randBattleSeedInt(tierHeldItems.length)];
    if (!globalScene.tryTransferHeldItemModifier(stolenItem, user, false)) {
      return false;
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:stoleItem", {
        pokemonName: getPokemonNameWithAffix(user),
        targetName: getPokemonNameWithAffix(target),
        itemName: stolenItem.type.name,
      }),
    );
    return true;
  }

  getTargetHeldItems(target) {
    return globalScene.findModifiers(
      m => m instanceof PokemonHeldItemModifier && m.pokemonId === target.id,
      target.isPlayer(),
    );
  }

  getUserBenefitScore(_user, target, _move) {
    const heldItems = this.getTargetHeldItems(target);
    return heldItems.length > 0 ? 5 : 0;
  }

  getTargetBenefitScore(_user, target, _move) {
    const heldItems = this.getTargetHeldItems(target);
    return heldItems.length > 0 ? -5 : 0;
  }
}

/**
 * Removes a random held item (or berry) from target.
 * Used for Incinerate and Knock Off.
 * Not Implemented Cases: (Same applies for Thief)
 * "If the user faints due to the target's Ability (Rough Skin or Iron Barbs) or held Rocky Helmet, it cannot remove the target's held item."
 * "If the Pokémon is knocked out by the attack, Sticky Hold does not protect the held item."
 */
export class RemoveHeldItemAttr extends MoveEffectAttr {
  /** Optional restriction for item pool to berries only; i.e. Incinerate */
  berriesOnly;

  constructor(berriesOnly = false) {
    super(false);
    this.berriesOnly = berriesOnly;
  }

  /**
   * Attempt to permanently remove a held
   * @param user - The {@linkcode Pokemon} that used the move
   * @param target - The {@linkcode Pokemon} targeted by the move
   * @param move - N/A
   * @param args N/A
   * @returns `true` if an item was able to be removed
   */
  apply(user, target, _move, _args) {
    if (!this.berriesOnly && target.isPlayer()) {
      // "Wild Pokemon cannot knock off Player Pokemon's held items" (See Bulbapedia)
      return false;
    }

    // Check for abilities that block item theft
    // TODO should not trigger if the target would faint beforehand
    const cancelled = new BooleanHolder(false);
    applyAbAttrs("BlockItemTheftAbAttr", { pokemon: target, cancelled });

    if (cancelled.value) {
      return false;
    }

    // Considers entire transferrable item pool by default (Knock Off).
    // Otherwise only consider berries (Incinerate).
    let heldItems = this.getTargetHeldItems(target).filter(i => i.isTransferable);

    if (this.berriesOnly) {
      heldItems = heldItems.filter(m => m instanceof BerryModifier && m.pokemonId === target.id, target.isPlayer());
    }

    if (heldItems.length === 0) {
      return false;
    }

    const removedItem = heldItems[user.randBattleSeedInt(heldItems.length)];

    // Decrease item amount and update icon
    target.loseHeldItem(removedItem);
    globalScene.updateModifiers(target.isPlayer());

    if (this.berriesOnly) {
      globalScene.phaseManager.queueMessage(
        i18next.t("moveTriggers:incineratedItem", {
          pokemonName: getPokemonNameWithAffix(user),
          targetName: getPokemonNameWithAffix(target),
          itemName: removedItem.type.name,
        }),
      );
    } else {
      globalScene.phaseManager.queueMessage(
        i18next.t("moveTriggers:knockedOffItem", {
          pokemonName: getPokemonNameWithAffix(user),
          targetName: getPokemonNameWithAffix(target),
          itemName: removedItem.type.name,
        }),
      );
    }

    return true;
  }

  getTargetHeldItems(target) {
    return globalScene.findModifiers(
      m => m instanceof PokemonHeldItemModifier && m.pokemonId === target.id,
      target.isPlayer(),
    );
  }

  getUserBenefitScore(_user, target, _move) {
    const heldItems = this.getTargetHeldItems(target);
    return heldItems.length > 0 ? 5 : 0;
  }

  getTargetBenefitScore(_user, target, _move) {
    const heldItems = this.getTargetHeldItems(target);
    return heldItems.length > 0 ? -5 : 0;
  }
}

/**
 * Attribute that causes targets of the move to eat a berry. Used for Teatime, Stuff Cheeks
 */
export class EatBerryAttr extends MoveEffectAttr {
  chosenBerry;
  // biome-ignore lint/complexity/noUselessConstructor removes the `options` param from the superclass
  constructor(selfTarget) {
    super(selfTarget);
  }

  /**
   * Causes the target to eat a berry.
   * @param user The {@linkcode Pokemon} Pokemon that used the move
   * @param target The {@linkcode Pokemon} Pokemon that will eat the berry
   * @param move The {@linkcode Move} being used
   * @param args Unused
   * @returns `true` if the function succeeds
   */
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const pokemon = this.selfTarget ? user : target;

    const heldBerries = this.getTargetHeldBerries(pokemon);
    if (heldBerries.length <= 0) {
      return false;
    }

    // pick a random berry to gobble and check if we preserve it
    this.chosenBerry = heldBerries[user.randBattleSeedInt(heldBerries.length)];
    const preserve = new BooleanHolder(false);
    // check for berry pouch preservation
    globalScene.applyModifiers(PreserveBerryModifier, pokemon.isPlayer(), pokemon, preserve);
    if (!preserve.value) {
      this.reduceBerryModifier(pokemon);
    }

    // Don't update harvest for berries preserved via Berry pouch (no item dupes lol)
    this.eatBerry(target, undefined, !preserve.value);

    return true;
  }

  getTargetHeldBerries(target) {
    return globalScene.findModifiers(
      m => m instanceof BerryModifier && (m).pokemonId === target.id,
      target.isPlayer(),
    );
  }

  reduceBerryModifier(target) {
    if (this.chosenBerry) {
      target.loseHeldItem(this.chosenBerry);
    }
    globalScene.updateModifiers(target.isPlayer());
  }

  /**
   * Internal function to apply berry effects.
   *
   * @param consumer - The {@linkcode Pokemon} eating the berry; assumed to also be owner if `berryOwner` is omitted
   * @param berryOwner - The {@linkcode Pokemon} whose berry is being eaten; defaults to `consumer` if not specified.
   * @param updateHarvest - Whether to prevent harvest from tracking berries;
   * defaults to whether `consumer` equals `berryOwner` (i.e. consuming own berry).
   */
  eatBerry(consumer, berryOwner = consumer, updateHarvest = consumer === berryOwner) {
    // consumer eats berry, owner triggers unburden and similar effects
    getBerryEffectFunc(this.chosenBerry.berryType)(consumer);
    applyAbAttrs("PostItemLostAbAttr", { pokemon: berryOwner });
    applyAbAttrs("HealFromBerryUseAbAttr", { pokemon: consumer });
    consumer.recordEatenBerry(this.chosenBerry.berryType, updateHarvest);
  }
}

/**
 * Attribute used for moves that steal and eat a random berry from the target.
 * Used for {@linkcode MoveId.PLUCK} & {@linkcode MoveId.BUG_BITE}.
 */
export class StealEatBerryAttr extends EatBerryAttr {
  constructor() {
    super(false);
  }

  /**
   * User steals a random berry from the target and then eats it.
   * @param user - The {@linkcode Pokemon} using the move; will eat the stolen berry
   * @param target - The {@linkcode Pokemon} having its berry stolen
   * @param move - The {@linkcode Move} being used
   * @param args N/A
   * @returns `true` if the function succeeds
   */
  apply(user, target, _move, _args) {
    // check for abilities that block item theft
    const cancelled = new BooleanHolder(false);
    applyAbAttrs("BlockItemTheftAbAttr", { pokemon: target, cancelled });
    if (cancelled.value === true) {
      return false;
    }

    // check if the target even _has_ a berry in the first place
    // TODO: Check on cart if Pluck displays messages when used against sticky hold mons w/o berries
    const heldBerries = this.getTargetHeldBerries(target);
    if (heldBerries.length <= 0) {
      return false;
    }

    // pick a random berry and eat it
    this.chosenBerry = heldBerries[user.randBattleSeedInt(heldBerries.length)];
    applyAbAttrs("PostItemLostAbAttr", { pokemon: target });
    const message = i18next.t("battle:stealEatBerry", {
      pokemonName: user.name,
      targetName: target.name,
      berryName: this.chosenBerry.type.name,
    });
    globalScene.phaseManager.queueMessage(message);
    this.reduceBerryModifier(target);
    this.eatBerry(user, target);

    return true;
  }
}

/**
 * Move attribute that signals that the move should cure a status effect
 */
export class HealStatusEffectAttr extends MoveEffectAttr {
  /** List of Status Effects to cure */
  effects;

  /**
   * @param selfTarget - Whether this move targets the user
   * @param effects - status effect or list of status effects to cure
   */
  constructor(selfTarget, effects) {
    super(selfTarget, { lastHitOnly: true });
    this.effects = coerceArray(effects);
  }

  /**
   * @param user {@linkcode Pokemon} source of the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move the {@linkcode Move} being used
   * @returns true if the status is cured
   */
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const moveTargets = getMoveTargets(user, move.id);

    const pokemon = this.selfTarget ? user : target;
    if (pokemon.status && this.effects.includes(pokemon.status.effect)) {
      globalScene.phaseManager.queueMessage(
        getStatusEffectHealText(pokemon.status.effect, getPokemonNameWithAffix(pokemon)),
      );
      pokemon.resetStatus();
      pokemon.updateInfo();

      return true;
    }

    return false;
  }

  isOfEffect(effect) {
    return this.effects.includes(effect);
  }

  getUserBenefitScore(user, _target, _move) {
    return user.status ? 10 : 0;
  }
}

/**
 * Attribute checked during the `MovePhase`'s {@linkcode MovePhase.checkSleep | checkSleep} failure sequence to allow
 * the move to bypass the sleep condition
 * Used by {@linkcode MoveId.SNORE} and {@linkcode MoveId.SLEEP_TALK}.
 */
// TODO: Give this `userSleptOrComatoseCondition` by default
export class BypassSleepAttr extends MoveAttr {
  apply(_user, _target, _move, args) {
    const bypassSleep = args[0];
    if (bypassSleep.value) {
      return false;
    }
    bypassSleep.value = true;
    return true;
  }

  /**
   * Returns arbitrarily high score when Pokemon is asleep, otherwise shouldn't be used
   * @param user
   * @param target
   * @param move
   */
  getUserBenefitScore(user, _target, _move) {
    return user.status?.effect === StatusEffect.SLEEP ? 200 : -10;
  }
}

/**
 * Attribute used for moves that bypass the burn damage reduction of physical moves, currently only facade
 * Called during damage calculation
 */
export class BypassBurnDamageReductionAttr extends MoveAttr {
  /** Prevents the move's damage from being reduced by burn
   * @param user N/A
   * @param target N/A
   * @param move {@linkcode Move} with this attribute
   * @param args [0] {@linkcode BooleanHolder} for burnDamageReductionCancelled
   * @returns true if the function succeeds
   */
  apply(_user, _target, _move, args) {
    (args[0]).value = true;

    return true;
  }
}

export class WeatherChangeAttr extends MoveEffectAttr {
  weatherType;

  constructor(weatherType) {
    super();

    this.weatherType = weatherType;
  }

  apply(user, _target, _move, _args) {
    return globalScene.arena.trySetWeather(this.weatherType, user);
  }

  getCondition() {
    return (_user, _target, _move) =>
      !globalScene.arena.weather
      || (globalScene.arena.weather.weatherType !== this.weatherType && !globalScene.arena.weather.isImmutable());
  }
}

export class ClearWeatherAttr extends MoveEffectAttr {
  weatherType;

  constructor(weatherType) {
    super();

    this.weatherType = weatherType;
  }

  apply(user, _target, _move, _args) {
    if (globalScene.arena.weather?.weatherType === this.weatherType) {
      return globalScene.arena.trySetWeather(WeatherType.NONE, user);
    }

    return false;
  }
}

export class TerrainChangeAttr extends MoveEffectAttr {
  terrainType;

  constructor(terrainType) {
    super();

    this.terrainType = terrainType;
  }

  apply(user, _target, _move, _args) {
    return globalScene.arena.trySetTerrain(this.terrainType, true, user);
  }

  getCondition() {
    return (_user, _target, _move) =>
      !globalScene.arena.terrain || globalScene.arena.terrain.terrainType !== this.terrainType;
  }

  getUserBenefitScore(_user, _target, _move) {
    // TODO: Expand on this
    return globalScene.arena.terrain ? 0 : 6;
  }
}

export class ClearTerrainAttr extends MoveEffectAttr {
  apply(user, _target, _move, _args) {
    return globalScene.arena.trySetTerrain(TerrainType.NONE, true, user);
  }
}

export class OneHitKOAttr extends MoveAttr {
  apply(_user, target, _move, args) {
    if (target.isBossImmune()) {
      return false;
    }

    (args[0]).value = true;

    return true;
  }

  getCondition() {
    return (user, target, _move) => {
      const cancelled = new BooleanHolder(false);
      applyAbAttrs("BlockOneHitKOAbAttr", { pokemon: target, cancelled });
      return !cancelled.value && user.level >= target.level;
    };
  }
}

/**
 * Attribute that allows charge moves to resolve in 1 turn under a given condition.
 * Should only be used for {@linkcode ChargingMove | ChargingMoves} as a `chargeAttr`.
 */
export class InstantChargeAttr extends MoveAttr {
  /** The condition in which the move with this attribute instantly charges */
  condition;

  constructor(condition) {
    super(true);
    this.condition = condition;
  }

  /**
   * Flags the move with this attribute as instantly charged if this attribute's condition is met.
   * @param user the {@linkcode Pokemon} using the move
   * @param target n/a
   * @param move the {@linkcode Move} associated with this attribute
   * @param args
   *  - `[0]` a {@linkcode BooleanHolder | BooleanHolder} for the "instant charge" flag
   * @returns `true` if the instant charge condition is met; `false` otherwise.
   */
  apply(user, _target, move, args) {
    const instantCharge = args[0];
    if (!(instantCharge instanceof BooleanHolder)) {
      return false;
    }

    if (this.condition(user, move)) {
      instantCharge.value = true;
      return true;
    }
    return false;
  }
}

/**
 * Attribute that allows charge moves to resolve in 1 turn while specific {@linkcode WeatherType | Weather}
 * is active. Should only be used for {@linkcode ChargingMove | ChargingMoves} as a `chargeAttr`.
 */
export class WeatherInstantChargeAttr extends InstantChargeAttr {
  /**
   * The weather types that allow the move to be charged instantly.
   */
  weatherTypes;
  constructor(weatherTypes) {
    super(() => {
      const currentWeather = globalScene.arena.weather;

      if (currentWeather?.weatherType == null) {
        return false;
      }
      return !currentWeather.isEffectSuppressed() && this.weatherTypes.includes(currentWeather.weatherType);
    });

    this.weatherTypes = weatherTypes;
  }
}

/**
 * class used for `MoveAttr`s whose effect application can normal move effect processing.
 */
class OverrideMoveEffectAttr extends MoveAttr {
  /**
   * Apply the move attribute to other effects of this move.
   * @param user - The {@linkcode Pokemon} using the move
   * @param target - The {@linkcode Pokemon} targeted by the move
   * @param move - The {@linkcode Move} being used
   * @param args -
   * `[0]`: A {@linkcode BooleanHolder} containing whether move effects were successfully overridden; should be set to `true` on success \
   * `[1]`: The {@linkcode MoveUseMode} dictating how this move was used.
   * @returns `true` if the move effect was successfully overridden.
   */
  apply(
    _user,
    _target,
    _move,
    _args
  ) {
    return true;
  }
}

/**
 * Attribute to implement delayed attacks, such as {@linkcode MoveId.FUTURE_SIGHT} or {@linkcode MoveId.DOOM_DESIRE}.
 * Delays the attack's effect with a {@linkcode DelayedAttackTag},
 * activating against the given slot after the given turn count has elapsed.
 */
export class DelayedAttackAttr extends OverrideMoveEffectAttr {
  /**
   * The {@linkcode ChargeAnim | charging animation} used for the move's charging phase.
   *
   * Rendered to allow for charge animation code to function
   */
  chargeAnim;
  /**
   * The `i18next` locales key to show when the delayed attack is queued
   * (**not** when it activates)! \
   * In the displayed text, `{{pokemonName}}` will be populated with the user's name.
   */
  chargeKey;

  constructor(chargeAnim, chargeKey) {
    super();

    this.chargeAnim = chargeAnim;
    this.chargeKey = chargeKey;
  }

  apply(
    user,
    target,
    move,
    args
  ) {
    const useMode = args[1];
    if (useMode === MoveUseMode.DELAYED_ATTACK) {
      // don't trigger if already queueing an indirect attack
      // TODO: There should be a cleaner way of doing this...
      return false;
    }

    const overridden = args[0];
    overridden.value = true;

    // Display the move animation to foresee an attack
    globalScene.phaseManager.unshiftNew("MoveAnimPhase", new MoveChargeAnim(this.chargeAnim, move.id, user));
    globalScene.phaseManager.queueMessage(i18next.t(this.chargeKey, { pokemonName: getPokemonNameWithAffix(user) }));

    user.pushMoveHistory({
      move: move.id,
      targets: [target.getBattlerIndex()],
      result: MoveResult.OTHER,
      useMode,
    });
    // Queue up an attack on the given slot
    globalScene.arena.positionalTagManager.addTag({
      tagType: PositionalTagType.DELAYED_ATTACK,
      sourceId: user.id,
      targetIndex: target.getBattlerIndex(),
      sourceMove: move.id,
      turnCount: 3,
    });
    return true;
  }

  getCondition() {
    // Check the arena if another similar attack is active and affecting the same slot
    return (_user, target) =>
      globalScene.arena.positionalTagManager.canAddTag(PositionalTagType.DELAYED_ATTACK, target.getBattlerIndex());
  }
}

/**
 * Attribute to queue a {@linkcode WishTag} to activate in 2 turns.
 * The tag will heal whichever Pokemon remains in the given slot for 50% of the user's
 * maximum HP.
 */
export class WishAttr extends MoveEffectAttr {
  apply(user, target) {
    globalScene.arena.positionalTagManager.addTag({
      tagType: PositionalTagType.WISH,
      healHp: toDmgValue(user.getMaxHp() / 2),
      targetIndex: target.getBattlerIndex(),
      turnCount: 2,
      pokemonName: getPokemonNameWithAffix(user),
    });
    return true;
  }

  getCondition() {
    // Check the arena if another similar move is active and affecting the same slot
    return (_user, target) =>
      globalScene.arena.positionalTagManager.canAddTag(PositionalTagType.WISH, target.getBattlerIndex());
  }
}

/**
 * Attribute that cancels the associated move's effects when set to be combined with the user's ally's
 * subsequent move this turn. Used for Grass Pledge, Water Pledge, and Fire Pledge.
 */
export class AwaitCombinedPledgeAttr extends OverrideMoveEffectAttr {
  constructor() {
    super(true);
  }
  /**
   * If the user's ally is set to use a different move with this attribute,
   * defer this move's effects for a combined move on the ally's turn.
   * @param user the {@linkcode Pokemon} using this move
   * @param target n/a
   * @param move the {@linkcode Move} being used
   * @param args -
   * `[0]`: A {@linkcode BooleanHolder} indicating whether the move's base
   * effects should be overridden this turn.
   * @returns `true` if base move effects were overridden; `false` otherwise
   */
  apply(user, _target, move, args) {
    if (user.turnData.combiningPledge) {
      // "The two moves have become one!\nIt's a combined move!"
      globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:combiningPledge"));
      return false;
    }

    const overridden = args[0];

    const allyMovePhase = globalScene.phaseManager.getMovePhase(phase => phase.pokemon.isPlayer() === user.isPlayer());
    if (allyMovePhase) {
      const allyMove = allyMovePhase.move.getMove();
      if (allyMove !== move && allyMove.hasAttr("AwaitCombinedPledgeAttr")) {
        for (const p of [user, allyMovePhase.pokemon]) {
          p.turnData.combiningPledge = move.id;
        }

        // "{userPokemonName} is waiting for {allyPokemonName}'s move..."
        globalScene.phaseManager.queueMessage(
          i18next.t("moveTriggers:awaitingPledge", {
            userPokemonName: getPokemonNameWithAffix(user),
            allyPokemonName: getPokemonNameWithAffix(allyMovePhase.pokemon),
          }),
        );

        // Move the ally's MovePhase (if needed) so that the ally moves next
        globalScene.phaseManager.forceMoveNext((phase) => phase.pokemon === user.getAlly());

        overridden.value = true;
        return true;
      }
    }
    return false;
  }
}

/**
 * Attribute used for moves that change stat stages
 *
 * @param stats {@linkcode BattleStat} Array of stat(s) to change
 * @param stages How many stages to change the stat(s) by, [-6, 6]
 * @param selfTarget `true` if the move is self-targetting
 * @param options {@linkcode StatStageChangeAttrOptions} Container for any optional parameters for this attribute.
 */
export class StatStageChangeAttr extends MoveEffectAttr {
  stats;
  stages;
  /**
   * Container for optional parameters to this attribute.
   * @see {@linkcode StatStageChangeAttrOptions} for available optional params
   */
  options;

  constructor(stats, stages, selfTarget, options) {
    super(selfTarget, options);
    this.stats = stats;
    this.stages = stages;
    this.options = options;
  }

  /**
   * The condition required for the stat stage change to apply.
   * Defaults to `null` (i.e. no condition required).
   */
  get condition() {
    return this.options?.condition ?? null;
  }

  /**
   * `true` to display a message for the stat change.
   * @defaultValue `true`
   */
  get showMessage() {
    return this.options?.showMessage ?? true;
  }

  /**
   * Attempts to change stats of the user or target (depending on value of selfTarget) if conditions are met
   * @param user {@linkcode Pokemon} the user of the move
   * @param target {@linkcode Pokemon} the target of the move
   * @param move {@linkcode Move} the move
   * @param args unused
   * @returns whether stat stages were changed
   */
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args) || (this.condition && !this.condition(user, target, move))) {
      return false;
    }

    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, true);
    if (moveChance < 0 || moveChance === 100 || user.randBattleSeedInt(100) < moveChance) {
      const stages = this.getLevels(user);
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        (this.selfTarget ? user : target).getBattlerIndex(),
        this.selfTarget,
        this.stats,
        stages,
        this.showMessage,
      );
      return true;
    }

    return false;
  }

  getLevels(_user) {
    return this.stages;
  }
}

/**
 * Attribute used to determine the Biome/Terrain-based secondary effect of Secret Power
 */
export class SecretPowerAttr extends MoveEffectAttr {
  constructor() {
    super(false);
  }

  /**
   * Used to apply the secondary effect to the target Pokemon
   * @returns `true` if a secondary effect is successfully applied
   */
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }
    let secondaryEffect;
    const terrain = globalScene.arena.terrainType;
    if (terrain !== TerrainType.NONE) {
      secondaryEffect = this.determineTerrainEffect(terrain);
    } else {
      const biome = globalScene.arena.biomeId;
      secondaryEffect = this.determineBiomeEffect(biome);
    }
    return secondaryEffect.apply(user, target, move, []);
  }

  /**
   * Determines the secondary effect based on terrain.
   * Takes precedence over biome-based effects.
   * ```
   * Electric Terrain | Paralysis
   * Misty Terrain    | SpAtk -1
   * Grassy Terrain   | Sleep
   * Psychic Terrain  | Speed -1
   * ```
   * @param terrain - {@linkcode TerrainType} The current terrain
   * @returns the chosen secondary effect {@linkcode MoveEffectAttr}
   */
  determineTerrainEffect(terrain) {
    let secondaryEffect;
    switch (terrain) {
      case TerrainType.MISTY:
        secondaryEffect = new StatStageChangeAttr([Stat.SPATK], -1, false);
        break;
      case TerrainType.GRASSY:
        secondaryEffect = new StatusEffectAttr(StatusEffect.SLEEP, false);
        break;
      case TerrainType.PSYCHIC:
        secondaryEffect = new StatStageChangeAttr([Stat.SPD], -1, false);
        break;
      case TerrainType.ELECTRIC:
      default:
        secondaryEffect = new StatusEffectAttr(StatusEffect.PARALYSIS, false);
        break;
    }
    return secondaryEffect;
  }

  /**
   * Determines the secondary effect based on biome
   * ```
   * Town, Metropolis, Slum, Dojo, Laboratory, Power Plant + Default | Paralysis
   * Plains, Grass, Tall Grass, Forest, Jungle, Meadow               | Sleep
   * Swamp, Mountain, Temple, Ruins                                  | Speed -1
   * Ice Cave, Snowy Forest                                          | Freeze
   * Volcano                                                         | Burn
   * Fairy Cave                                                      | SpAtk -1
   * Desert, Construction Site, Beach, Island, Badlands              | Accuracy -1
   * Sea, Lake, Seabed                                               | Atk -1
   * Cave, Wasteland, Graveyard, Abyss, Space                        | Flinch
   * End                                                             | Def -1
   * ```
   * @param biome - The current {@linkcode BiomeId} the battle is set in
   * @returns the chosen secondary effect {@linkcode MoveEffectAttr}
   */
  determineBiomeEffect(biome) {
    let secondaryEffect;
    switch (biome) {
      case BiomeId.PLAINS:
      case BiomeId.GRASS:
      case BiomeId.TALL_GRASS:
      case BiomeId.FOREST:
      case BiomeId.JUNGLE:
      case BiomeId.MEADOW:
        secondaryEffect = new StatusEffectAttr(StatusEffect.SLEEP, false);
        break;
      case BiomeId.SWAMP:
      case BiomeId.MOUNTAIN:
      case BiomeId.TEMPLE:
      case BiomeId.RUINS:
        secondaryEffect = new StatStageChangeAttr([Stat.SPD], -1, false);
        break;
      case BiomeId.ICE_CAVE:
      case BiomeId.SNOWY_FOREST:
        secondaryEffect = new StatusEffectAttr(StatusEffect.FREEZE, false);
        break;
      case BiomeId.VOLCANO:
        secondaryEffect = new StatusEffectAttr(StatusEffect.BURN, false);
        break;
      case BiomeId.FAIRY_CAVE:
        secondaryEffect = new StatStageChangeAttr([Stat.SPATK], -1, false);
        break;
      case BiomeId.DESERT:
      case BiomeId.CONSTRUCTION_SITE:
      case BiomeId.BEACH:
      case BiomeId.ISLAND:
      case BiomeId.BADLANDS:
        secondaryEffect = new StatStageChangeAttr([Stat.ACC], -1, false);
        break;
      case BiomeId.SEA:
      case BiomeId.LAKE:
      case BiomeId.SEABED:
        secondaryEffect = new StatStageChangeAttr([Stat.ATK], -1, false);
        break;
      case BiomeId.CAVE:
      case BiomeId.WASTELAND:
      case BiomeId.GRAVEYARD:
      case BiomeId.ABYSS:
      case BiomeId.SPACE:
        secondaryEffect = new AddBattlerTagAttr(BattlerTagType.FLINCHED, false, true);
        break;
      case BiomeId.END:
        secondaryEffect = new StatStageChangeAttr([Stat.DEF], -1, false);
        break;
      case BiomeId.TOWN:
      case BiomeId.METROPOLIS:
      case BiomeId.SLUM:
      case BiomeId.DOJO:
      case BiomeId.FACTORY:
      case BiomeId.LABORATORY:
      case BiomeId.POWER_PLANT:
      default:
        secondaryEffect = new StatusEffectAttr(StatusEffect.PARALYSIS, false);
        break;
    }
    return secondaryEffect;
  }
}

export class PostVictoryStatStageChangeAttr extends MoveAttr {
  stats;
  stages;
  condition;
  showMessage;

  constructor(
    stats,
    stages,
    _selfTarget,
    condition,
    showMessage = true,
    _firstHitOnly = false,
  ) {
    super();
    this.stats = stats;
    this.stages = stages;
    this.condition = condition;
    this.showMessage = showMessage;
  }
  applyPostVictory(user, target, move) {
    if (this.condition && !this.condition(user, target, move)) {
      return;
    }
    const statChangeAttr = new StatStageChangeAttr(this.stats, this.stages, this.showMessage);
    statChangeAttr.apply(user, target, move);
  }
}

export class AcupressureStatStageChangeAttr extends MoveEffectAttr {
  apply(user, target, _move, _args) {
    const randStats = BATTLE_STATS.filter(s => target.getStatStage(s) < 6);
    if (randStats.length > 0) {
      const boostStat = [randStats[user.randBattleSeedInt(randStats.length)]];
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        target.getBattlerIndex(),
        this.selfTarget,
        boostStat,
        2,
      );
      return true;
    }
    return false;
  }
}

export class GrowthStatStageChangeAttr extends StatStageChangeAttr {
  constructor() {
    super([Stat.ATK, Stat.SPATK], 1, true);
  }

  getLevels(_user) {
    if (!globalScene.arena.weather?.isEffectSuppressed()) {
      const weatherType = globalScene.arena.weather?.weatherType;
      if (weatherType === WeatherType.SUNNY || weatherType === WeatherType.HARSH_SUN) {
        return this.stages + 1;
      }
    }
    return this.stages;
  }
}

export class CutHpStatStageBoostAttr extends StatStageChangeAttr {
  cutRatio;
  messageCallback;

  constructor(
    stat,
    levels,
    cutRatio,
    messageCallback,
  ) {
    super(stat, levels, true);

    this.cutRatio = cutRatio;
    this.messageCallback = messageCallback;
  }
  apply(user, target, move, args) {
    user.damageAndUpdate(toDmgValue(user.getMaxHp() / this.cutRatio), { result: HitResult.INDIRECT });
    user.updateInfo();
    const ret = super.apply(user, target, move, args);
    if (this.messageCallback) {
      this.messageCallback(user);
    }
    return ret;
  }

  getCondition() {
    return user => user.getHpRatio() > 1 / this.cutRatio && this.stats.some(s => user.getStatStage(s) < 6);
  }
}

export class CopyStatsAttr extends MoveEffectAttr {
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    // Copy all stat stages
    for (const s of BATTLE_STATS) {
      user.setStatStage(s, target.getStatStage(s));
    }

    if (target.getTag(BattlerTagType.CRIT_BOOST)) {
      user.addTag(BattlerTagType.CRIT_BOOST, 0, move.id);
    } else {
      user.removeTag(BattlerTagType.CRIT_BOOST);
    }
    target.updateInfo();
    user.updateInfo();
    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:copiedStatChanges", {
        pokemonName: getPokemonNameWithAffix(user),
        targetName: getPokemonNameWithAffix(target),
      }),
    );

    return true;
  }
}

export class InvertStatsAttr extends MoveEffectAttr {
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    for (const s of BATTLE_STATS) {
      target.setStatStage(s, -target.getStatStage(s));
    }

    target.updateInfo();
    user.updateInfo();

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:invertStats", { pokemonName: getPokemonNameWithAffix(target) }),
    );

    return true;
  }
}

export class ResetStatsAttr extends MoveEffectAttr {
  targetAllPokemon;
  constructor(targetAllPokemon) {
    super();
    this.targetAllPokemon = targetAllPokemon;
  }

  apply(_user, target, _move, _args) {
    if (this.targetAllPokemon) {
      // Target all pokemon on the field when Freezy Frost or Haze are used
      const activePokemon = globalScene.getField(true);
      for (const p of activePokemon) {
        this.resetStats(p);
      }
      globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:statEliminated"));
    } else {
      // Affects only the single target when Clear Smog is used
      this.resetStats(target);
      globalScene.phaseManager.queueMessage(
        i18next.t("moveTriggers:resetStats", { pokemonName: getPokemonNameWithAffix(target) }),
      );
    }
    return true;
  }

  resetStats(pokemon) {
    for (const s of BATTLE_STATS) {
      pokemon.setStatStage(s, 0);
    }
    pokemon.updateInfo();
  }
}

/**
 * Attribute used for status moves, specifically Heart, Guard, and Power Swap,
 * that swaps the user's and target's corresponding stat stages.
 */
export class SwapStatStagesAttr extends MoveEffectAttr {
  /** The stat stages to be swapped between the user and the target */
  stats;

  constructor(stats) {
    super();

    this.stats = stats;
  }

  /**
   * For all {@linkcode stats}, swaps the user's and target's corresponding stat
   * stage.
   * @param user the {@linkcode Pokemon} that used the move
   * @param target the {@linkcode Pokemon} that the move was used on
   * @param move N/A
   * @param args N/A
   * @returns true if attribute application succeeds
   */
  apply(user, target, move, args) {
    if (super.apply(user, target, move, args)) {
      for (const s of this.stats) {
        const temp = user.getStatStage(s);
        user.setStatStage(s, target.getStatStage(s));
        target.setStatStage(s, temp);
      }

      target.updateInfo();
      user.updateInfo();

      if (this.stats.length === 7) {
        globalScene.phaseManager.queueMessage(
          i18next.t("moveTriggers:switchedStatChanges", { pokemonName: getPokemonNameWithAffix(user) }),
        );
      } else if (this.stats.length === 2) {
        globalScene.phaseManager.queueMessage(
          i18next.t("moveTriggers:switchedTwoStatChanges", {
            pokemonName: getPokemonNameWithAffix(user),
            firstStat: i18next.t(getStatKey(this.stats[0])),
            secondStat: i18next.t(getStatKey(this.stats[1])),
          }),
        );
      }
      return true;
    }
    return false;
  }
}

export class HpSplitAttr extends MoveEffectAttr {
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const hpValue = Math.floor((target.hp + user.hp) / 2);
    [user, target].forEach(p => {
      if (p.hp < hpValue) {
        const healing = p.heal(hpValue - p.hp);
        if (healing) {
          globalScene.damageNumberHandler.add(p, healing, HitResult.HEAL);
        }
      } else if (p.hp > hpValue) {
        const damage = p.damage(p.hp - hpValue, true);
        if (damage) {
          globalScene.damageNumberHandler.add(p, damage);
        }
      }
      p.updateInfo();
    });

    return true;
  }
}

export class VariablePowerAttr extends MoveAttr {
  apply(_user, _target, _move, _args) {
    //const power = args[0] as Utils.NumberHolder;
    return false;
  }
}

export class LessPPMorePowerAttr extends VariablePowerAttr {
  /**
   * Power up moves when less PP user has
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @param args [0] {@linkcode NumberHolder} of power
   * @returns true if the function succeeds
   */
  apply(user, _target, move, args) {
    const ppMax = move.pp;
    const ppUsed = user.moveset.find(m => m.moveId === move.id)?.ppUsed ?? 0;

    let ppRemains = ppMax - ppUsed;
    /** Reduce to 0 to avoid negative numbers if user has 1PP before attack and target has Ability.PRESSURE */
    if (ppRemains < 0) {
      ppRemains = 0;
    }

    const power = args[0];

    switch (ppRemains) {
      case 0:
        power.value = 200;
        break;
      case 1:
        power.value = 80;
        break;
      case 2:
        power.value = 60;
        break;
      case 3:
        power.value = 50;
        break;
      default:
        power.value = 40;
        break;
    }
    return true;
  }
}

export class MovePowerMultiplierAttr extends VariablePowerAttr {
  powerMultiplierFunc;

  constructor(powerMultiplier) {
    super();

    this.powerMultiplierFunc = powerMultiplier;
  }

  apply(user, target, move, args) {
    const power = args[0];
    power.value *= this.powerMultiplierFunc(user, target, move);

    return true;
  }
}

/**
 * Helper function to calculate the the base power of an ally's hit when using Beat Up.
 * @param user The Pokemon that used Beat Up.
 * @param allyIndex The party position of the ally contributing to Beat Up.
 * @returns The base power of the Beat Up hit.
 */
const beatUpFunc = (user, allyIndex) => {
  const party = user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty();

  for (let i = allyIndex; i < party.length; i++) {
    const pokemon = party[i];

    // The user contributes to Beat Up regardless of status condition.
    // Allies can contribute only if they do not have a non-volatile status condition.
    if (pokemon.id !== user.id && pokemon?.status && pokemon.status.effect !== StatusEffect.NONE) {
      continue;
    }
    return pokemon.species.getBaseStat(Stat.ATK) / 10 + 5;
  }
  return 0;
};

export class BeatUpAttr extends VariablePowerAttr {
  /**
   * Gets the next party member to contribute to a Beat Up hit, and calculates the base power for it.
   * @param user Pokemon that used the move
   * @param _target N/A
   * @param _move Move with this attribute
   * @param args N/A
   * @returns true if the function succeeds
   */
  apply(user, _target, _move, args) {
    const power = args[0];

    const party = user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
    const allyCount = party.filter(pokemon => {
      return pokemon.id === user.id || !pokemon.status?.effect;
    }).length;
    const allyIndex = (user.turnData.hitCount - user.turnData.hitsLeft) % allyCount;
    power.value = beatUpFunc(user, allyIndex);
    return true;
  }
}

/**
 * Message function for {@linkcode MoveId.FICKLE_BEAM} that shows a message before move use if
 * the move's power would be boosted.
 * @todo Find another way to synchronize the RNG calls of Fickle Beam with its message
 * than using a seed offset
 */
function doublePowerChanceMessageFunc(chance) {
  return (user, _target, _move) => {
    let message = "";
    globalScene.executeWithSeedOffset(
      () => {
        const rand = randSeedInt(100);
        if (rand < chance) {
          message = i18next.t("moveTriggers:goingAllOutForAttack", { pokemonName: getPokemonNameWithAffix(user) });
        }
      },
      globalScene.currentBattle.turn << 6,
      globalScene.waveSeed,
    );
    return message;
  };
}

export class DoublePowerChanceAttr extends VariablePowerAttr {
  chance;
  constructor(chance) {
    super(false);
    this.chance = chance;
  }

  apply(_user, _target, _move, args) {
    let rand = 0;
    globalScene.executeWithSeedOffset(
      () => (rand = randSeedInt(100)),
      globalScene.currentBattle.turn << 6,
      globalScene.waveSeed,
    );
    if (rand < this.chance) {
      const power = args[0];
      power.value *= 2;
      return true;
    }

    return false;
  }
}

export class ConsecutiveUsePowerMultiplierAttr extends MovePowerMultiplierAttr {
  constructor(limit, resetOnFail, resetOnLimit, ...comboMoves) {
    super((user, _target, move) => {
      const moveHistory = user.getLastXMoves(limit + 1).slice(1);

      let count = 0;
      let turnMove;

      while (
        ((turnMove = moveHistory.shift())?.move === move.id
          || (comboMoves.length > 0 && comboMoves.includes(turnMove?.move ?? MoveId.NONE)))
        && (!resetOnFail || turnMove?.result === MoveResult.SUCCESS)
      ) {
        if (count < limit - 1) {
          count++;
        } else if (resetOnLimit) {
          count = 0;
        } else {
          break;
        }
      }

      return this.getMultiplier(count);
    });
  }

  getMultiplier(count) {
    console.warn("getMultiplier not implemented for ConsecutiveUsePowerMultiplierAttr ?");
  };
}

export class ConsecutiveUseDoublePowerAttr extends ConsecutiveUsePowerMultiplierAttr {
  getMultiplier(count) {
    return Math.pow(2, count);
  }
}

export class ConsecutiveUseMultiBasePowerAttr extends ConsecutiveUsePowerMultiplierAttr {
  getMultiplier(count) {
    return count + 1;
  }
}

export class WeightPowerAttr extends VariablePowerAttr {
  apply(_user, target, _move, args) {
    const power = args[0];

    const targetWeight = target.getWeight();
    const weightThresholds = [10, 25, 50, 100, 200];

    let w = 0;
    while (targetWeight >= weightThresholds[w]) {
      if (++w === weightThresholds.length) {
        break;
      }
    }

    power.value = (w + 1) * 20;

    return true;
  }
}

/**
 * Attribute used for Electro Ball move.
 */
export class ElectroBallPowerAttr extends VariablePowerAttr {
  /**
   * Move that deals more damage the faster {@linkcode Stat.SPD}
   * the user is compared to the target.
   * @param user Pokemon that used the move
   * @param target The target of the move
   * @param move Move with this attribute
   * @param args N/A
   * @returns true if the function succeeds
   */
  apply(user, target, _move, args) {
    const power = args[0];

    const statRatio = target.getEffectiveStat(Stat.SPD) / user.getEffectiveStat(Stat.SPD);
    const statThresholds = [0.25, 1 / 3, 0.5, 1, -1];
    const statThresholdPowers = [150, 120, 80, 60, 40];

    let w = 0;
    while (w < statThresholds.length - 1 && statRatio > statThresholds[w]) {
      if (++w === statThresholds.length) {
        break;
      }
    }

    power.value = statThresholdPowers[w];
    return true;
  }
}

/**
 * Attribute used for Gyro Ball move.
 */
export class GyroBallPowerAttr extends VariablePowerAttr {
  /**
   * Move that deals more damage the slower {@linkcode Stat.SPD}
   * the user is compared to the target.
   * @param user Pokemon that used the move
   * @param target The target of the move
   * @param move Move with this attribute
   * @param args N/A
   * @returns true if the function succeeds
   */
  apply(user, target, _move, args) {
    const power = args[0];
    const userSpeed = user.getEffectiveStat(Stat.SPD);
    if (userSpeed < 1) {
      // Gen 6+ always have 1 base power
      power.value = 1;
      return true;
    }

    power.value = Math.floor(Math.min(150, (25 * target.getEffectiveStat(Stat.SPD)) / userSpeed + 1));
    return true;
  }
}

export class LowHpPowerAttr extends VariablePowerAttr {
  apply(user, _target, _move, args) {
    const power = args[0];
    const hpRatio = user.getHpRatio();

    switch (true) {
      case hpRatio < 0.0417:
        power.value = 200;
        break;
      case hpRatio < 0.1042:
        power.value = 150;
        break;
      case hpRatio < 0.2083:
        power.value = 100;
        break;
      case hpRatio < 0.3542:
        power.value = 80;
        break;
      case hpRatio < 0.6875:
        power.value = 40;
        break;
      default:
        power.value = 20;
        break;
    }

    return true;
  }
}

export class CompareWeightPowerAttr extends VariablePowerAttr {
  apply(user, target, _move, args) {
    const power = args[0];
    const userWeight = user.getWeight();
    const targetWeight = target.getWeight();

    if (!userWeight || userWeight === 0) {
      return false;
    }

    const relativeWeight = (targetWeight / userWeight) * 100;

    switch (true) {
      case relativeWeight < 20.01:
        power.value = 120;
        break;
      case relativeWeight < 25.01:
        power.value = 100;
        break;
      case relativeWeight < 33.35:
        power.value = 80;
        break;
      case relativeWeight < 50.01:
        power.value = 60;
        break;
      default:
        power.value = 40;
        break;
    }

    return true;
  }
}

export class HpPowerAttr extends VariablePowerAttr {
  apply(user, _target, _move, args) {
    (args[0]).value = toDmgValue(150 * user.getHpRatio());

    return true;
  }
}

/**
 * Attribute used for moves whose base power scales with the opponent's HP
 * Used for Crush Grip, Wring Out, and Hard Press
 * maxBasePower 100 for Hard Press, 120 for others
 */
export class OpponentHighHpPowerAttr extends VariablePowerAttr {
  maxBasePower;

  constructor(maxBasePower) {
    super();
    this.maxBasePower = maxBasePower;
  }

  /**
   * Changes the base power of the move to be the target's HP ratio times the maxBasePower with a min value of 1
   * @param user n/a
   * @param target the Pokemon being attacked
   * @param move n/a
   * @param args holds the base power of the move at args[0]
   * @returns true
   */
  apply(_user, target, _move, args) {
    (args[0]).value = toDmgValue(this.maxBasePower * target.getHpRatio());

    return true;
  }
}

export class TurnDamagedDoublePowerAttr extends VariablePowerAttr {
  apply(user, target, _move, args) {
    if (user.turnData.attacksReceived.find(r => r.damage && r.sourceId === target.id)) {
      (args[0]).value *= 2;
      return true;
    }

    return false;
  }
}

const magnitudeThresholds = [5, 15, 35, 65, 85, 95];

const magnitudeMessageFunc = () => {
  let message;

  globalScene.executeWithSeedOffset(
    () => {
      const rand = randSeedInt(100);

      let m = 0;
      for (; m < magnitudeThresholds.length; m++) {
        if (rand < magnitudeThresholds[m]) {
          break;
        }
      }

      message = i18next.t("moveTriggers:magnitudeMessage", { magnitude: m + 4 });
    },
    globalScene.currentBattle.turn << 6,
    globalScene.waveSeed,
  );

  return message;
};

export class MagnitudePowerAttr extends VariablePowerAttr {
  apply(_user, _target, _move, args) {
    const power = args[0];

    const magnitudePowers = [10, 30, 50, 70, 90, 110, 150];

    globalScene.executeWithSeedOffset(
      () => {
        const rand = randSeedInt(100);

        let m = 0;
        for (; m < magnitudeThresholds.length; m++) {
          if (rand < magnitudeThresholds[m]) {
            break;
          }
        }

        power.value = magnitudePowers[m];
      },
      globalScene.currentBattle.turn << 6,
      globalScene.waveSeed,
    );

    return true;
  }
}

export class AntiSunlightPowerDecreaseAttr extends VariablePowerAttr {
  apply(_user, _target, _move, args) {
    if (!globalScene.arena.weather?.isEffectSuppressed()) {
      const power = args[0];
      const weatherType = globalScene.arena.weather?.weatherType || WeatherType.NONE;
      switch (weatherType) {
        case WeatherType.RAIN:
        case WeatherType.SANDSTORM:
        case WeatherType.HAIL:
        case WeatherType.SNOW:
        case WeatherType.FOG:
        case WeatherType.HEAVY_RAIN:
          power.value *= 0.5;
          return true;
      }
    }

    return false;
  }
}

/**
 * Attribute used by {@link https://bulbapedia.bulbagarden.net/wiki/Frustration_(move) | Frustration},
 * {@link https://bulbapedia.bulbagarden.net/wiki/Return_(move) | Return} and their respective variants.
 *
 * Linearly scales the move's base power from 1 to 102 based on the user's current friendship (or base friendship for wild Pokemon).
 */
export class FriendshipPowerAttr extends VariablePowerAttr {
  /**
   * Whether to invert the power scaling (causing higher friendship values to reduce move power instead of increasing it).
   * @defaultValue `false`
   */
  invert;

  constructor(invert = false) {
    super();

    this.invert = invert;
  }

  apply(user, _target, _move, args) {
    const power = args[0];

    // wild mons use their base friendship
    // TODO: Can't we just... set the enemy's friendship to its base inside enemy generation?
    let friendship = user.isPlayer() || user.hasTrainer() ? user.friendship : user.species.baseFriendship;
    if (!isBetween(friendship, 0, 255)) {
      // TODO: Remove this if or when proper validation is added (or otherwise guaranteed)
      console.warn(
        `Friendship value inside FriendshipPowerAttr power calculation (${friendship}) is out of valid bounds!`,
      );
      friendship = Phaser.Math.Clamp(friendship, 0, 255);
    }
    power.value = toDmgValue((this.invert ? 255 - friendship : friendship) / 2.5);

    return true;
  }
}

/**
 * This Attribute calculates the current power of {@linkcode MoveId.RAGE_FIST}.
 * The counter for power calculation does not reset on every wave but on every new arena encounter.
 * Self-inflicted confusion damage and hits taken by a Subsitute are ignored.
 */
export class RageFistPowerAttr extends VariablePowerAttr {
  apply(user, _target, _move, args) {
    /* Reasons this works correctly:
     * Confusion calls user.damageAndUpdate() directly (no counter increment),
     * Substitute hits call user.damageAndUpdate() with a damage value of 0, also causing
      no counter increment
    */
    const hitCount = user.battleData.hitCount;
    const basePowerHolder = args[0];

    basePower.value = 50 * (1 + Math.min(hitCount, 6));
    return true;
  }
}

/**
 * Tallies the number of positive stages for a given {@linkcode Pokemon}.
 * @param pokemon The {@linkcode Pokemon} that is being used to calculate the count of positive stats
 * @returns the amount of positive stats
 */
const countPositiveStatStages = (pokemon) => {
  return pokemon.getStatStages().reduce((total, stat) => (stat && stat > 0 ? total + stat : total), 0);
};

/**
 * Attribute that increases power based on the amount of positive stat stage increases.
 */
export class PositiveStatStagePowerAttr extends VariablePowerAttr {
  /**
   * @param user The pokemon that is being used to calculate the amount of positive stats
   * @param target N/A
   * @param move N/A
   * @param args The argument for VariablePowerAttr, accumulates and sets the amount of power multiplied by stats
   * @returns Returns true if attribute is applied
   */
  apply(user, _target, _move, args) {
    const positiveStatStages = countPositiveStatStages(user);

    (args[0]).value += positiveStatStages * 20;
    return true;
  }
}

/**
 * Punishment normally has a base power of 60,
 * but gains 20 power for every increased stat stage the target has,
 * up to a maximum of 200 base power in total.
 */
export class PunishmentPowerAttr extends VariablePowerAttr {
  PUNISHMENT_MIN_BASE_POWER = 60;
  PUNISHMENT_MAX_BASE_POWER = 200;

  /**
   * @param user N/A
   * @param target The pokemon that the move is being used against, as well as calculating the stats for the min/max base power
   * @param move N/A
   * @param args The value that is being changed due to VariablePowerAttr
   * @returns Returns true if attribute is applied
   */
  apply(_user, target, _move, args) {
    const positiveStatStages = countPositiveStatStages(target);
    (args[0]).value = Math.min(
      this.PUNISHMENT_MAX_BASE_POWER,
      this.PUNISHMENT_MIN_BASE_POWER + positiveStatStages * 20,
    );
    return true;
  }
}

export class PresentPowerAttr extends VariablePowerAttr {
  apply(user, target, _move, args) {
    /**
     * If this move is multi-hit, and this attribute is applied to any hit
     * other than the first, this move cannot result in a heal.
     */
    const firstHit = user.turnData.hitCount === user.turnData.hitsLeft;

    const powerSeed = randSeedInt(firstHit ? 100 : 80);
    if (powerSeed <= 40) {
      (args[0]).value = 40;
    } else if (40 < powerSeed && powerSeed <= 70) {
      (args[0]).value = 80;
    } else if (70 < powerSeed && powerSeed <= 80) {
      (args[0]).value = 120;
    } else if (80 < powerSeed && powerSeed <= 100) {
      // If this move is multi-hit, disable all other hits
      user.turnData.hitCount = 1;
      user.turnData.hitsLeft = 1;
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        target.getBattlerIndex(),
        toDmgValue(target.getMaxHp() / 4),
        i18next.t("moveTriggers:regainedHealth", { pokemonName: getPokemonNameWithAffix(target) }),
        true,
      );
    }

    return true;
  }
}

export class WaterShurikenPowerAttr extends VariablePowerAttr {
  apply(user, _target, _move, args) {
    if (
      user.species.speciesId === SpeciesId.GRENINJA
      && user.hasAbility(AbilityId.BATTLE_BOND)
      && user.formIndex === 2
    ) {
      (args[0]).value = 20;
      return true;
    }
    return false;
  }
}

/**
 * Attribute used to calculate the power of attacks that scale with Stockpile stacks (i.e. Spit Up).
 */
export class SpitUpPowerAttr extends VariablePowerAttr {
  multiplier;

  constructor(multiplier) {
    super();
    this.multiplier = multiplier;
  }

  apply(user, _target, _move, args) {
    const stockpilingTag = user.getTag(StockpilingTag);

    if (stockpilingTag && stockpilingTag.stockpiledCount > 0) {
      const power = args[0];
      power.value = this.multiplier * stockpilingTag.stockpiledCount;
      return true;
    }

    return false;
  }
}

/**
 * Attribute used to apply Swallow's healing, which scales with Stockpile stacks.
 * Does NOT remove stockpiled stacks.
 */
export class SwallowHealAttr extends HealAttr {
  constructor() {
    super(1);
  }

  apply(user, _target, _move, _args) {
    const stockpilingTag = user.getTag(StockpilingTag);

    if (stockpilingTag && stockpilingTag.stockpiledCount > 0) {
      const stockpiled = stockpilingTag.stockpiledCount;
      let healRatio;

      if (stockpiled === 1) {
        healRatio = 0.25;
      } else if (stockpiled === 2) {
        healRatio = 0.5;
      } else {
        // stockpiled >= 3
        healRatio = 1.0;
      }

      if (healRatio) {
        this.addHealPhase(user, healRatio);
        return true;
      }
    }

    return false;
  }
}

const hasStockpileStacksCondition = user => {
  const hasStockpilingTag = user.getTag(StockpilingTag);
  return !!hasStockpilingTag && hasStockpilingTag.stockpiledCount > 0;
};

/**
 * Attribute used for multi-hit moves that increase power in increments of the
 * move's base power for each hit, namely Triple Kick and Triple Axel.
 */
export class MultiHitPowerIncrementAttr extends VariablePowerAttr {
  /** The max number of base power increments allowed for this move */
  maxHits;

  constructor(maxHits) {
    super();

    this.maxHits = maxHits;
  }

  /**
   * Increases power of move in increments of the base power for the amount of times
   * the move hit. In the case that the move is extended, it will circle back to the
   * original base power of the move after incrementing past the maximum amount of
   * hits.
   * @param user {@linkcode Pokemon} that used the move
   * @param target {@linkcode Pokemon} that the move was used on
   * @param move {@linkcode Move} with this attribute
   * @param args [0] {@linkcode NumberHolder} for final calculated power of move
   * @returns true if attribute application succeeds
   */
  apply(user, _target, move, args) {
    const hitsTotal = user.turnData.hitCount - Math.max(user.turnData.hitsLeft, 0);
    const power = args[0];

    power.value = move.power * (1 + (hitsTotal % this.maxHits));

    return true;
  }
}

/**
 * Attribute used for moves that double in power if the given move immediately
 * preceded the move applying the attribute, namely Fusion Flare and
 * Fusion Bolt.
 */
export class LastMoveDoublePowerAttr extends VariablePowerAttr {
  /** The move that must precede the current move */
  moveId;

  constructor(moveId) {
    super();

    this.move = move;
  }

  /**
   * Doubles power of move if the given move is found to precede the current
   * move with no other moves being executed in between, only ignoring failed
   * moves if any.
   * @param user {@linkcode Pokemon} that used the move
   * @param target N/A
   * @param move N/A
   * @param args [0] {@linkcode NumberHolder} that holds the resulting power of the move
   * @returns true if attribute application succeeds, false otherwise
   */
  apply(_user, _target, _move, args) {
    const power = args[0];
    for (const p of globalScene.phaseManager.dynamicQueueManager.getLastTurnOrder().slice(0, -1).reverse()) {
      const [lastMove] = p.getLastXMoves(1);
      if (lastMove.result !== MoveResult.FAIL) {
        if (lastMove.result === MoveResult.SUCCESS && lastMove.move === this.move) {
          power.value *= 2;
          return true;
        }
        break;
      }
    }

    return false;
  }
}

/**
 * Changes a Pledge move's power to 150 when combined with another unique Pledge
 * move from an ally.
 */
export class CombinedPledgePowerAttr extends VariablePowerAttr {
  apply(user, _target, move, args) {
    const power = args[0];
    if (!(power instanceof NumberHolder)) {
      return false;
    }
    const combinedPledgeMove = user.turnData.combiningPledge;

    if (combinedPledgeMove && combinedPledgeMove !== move.id) {
      power.value *= 150 / 80;
      return true;
    }
    return false;
  }
}

/**
 * Applies STAB to the given Pledge move if the move is part of a combined attack.
 */
export class CombinedPledgeStabBoostAttr extends MoveAttr {
  apply(user, _target, move, args) {
    const stabMultiplier = args[0];
    if (!(stabMultiplier instanceof NumberHolder)) {
      return false;
    }
    const combinedPledgeMove = user.turnData.combiningPledge;

    if (combinedPledgeMove && combinedPledgeMove !== move.id) {
      stabMultiplier.value = 1.5;
      return true;
    }
    return false;
  }
}

/**
 * Variable Power attribute for {@link https://bulbapedia.bulbagarden.net/wiki/Round_(move) | Round}.
 * Doubles power if another Pokemon has previously selected Round this turn.
 */
export class RoundPowerAttr extends VariablePowerAttr {
  apply(user, _target, _move, args) {
    const power = args[0];

    if (user.turnData.joinedRound) {
      power.value *= 2;
      return true;
    }
    return false;
  }
}

/**
 * Attribute for the "combo" effect of {@link https://bulbapedia.bulbagarden.net/wiki/Round_(move) | Round}.
 * Preempts the next move in the turn order with the first instance of any Pokemon
 * using Round. Also marks the Pokemon using the cued Round to double the move's power.
 */
export class CueNextRoundAttr extends MoveEffectAttr {
  constructor() {
    super(true, { lastHitOnly: true });
  }

  apply(_user, _target, _move, _args) {
    const nextRoundPhase = globalScene.phaseManager.getMovePhase(phase => phase.move.moveId === MoveId.ROUND);

    if (!nextRoundPhase) {
      return false;
    }

    globalScene.phaseManager.forceMoveNext(phase => phase.move.moveId === MoveId.ROUND);

    // Mark the corresponding Pokemon as having "joined the Round" (for doubling power later)
    nextRoundPhase.pokemon.turnData.joinedRound = true;
    return true;
  }
}

/**
 * Attribute that changes stat stages before the damage is calculated
 */
export class StatChangeBeforeDmgCalcAttr extends MoveAttr {
  /**
   * Applies Stat Changes before damage is calculated
   *
   * @param user {@linkcode Pokemon} that called {@linkcode move}
   * @param target {@linkcode Pokemon} that is the target of {@linkcode move}
   * @param move {@linkcode Move} called by {@linkcode user}
   * @param args N/A
   *
   * @returns true if stat stages where correctly applied
   */
  apply(_user, _target, _move, _args) {
    return false;
  }
}

/**
 * Steals the postitive Stat stages of the target before damage calculation so stat changes
 * apply to damage calculation (e.g. {@linkcode MoveId.SPECTRAL_THIEF})
 * {@link https://bulbapedia.bulbagarden.net/wiki/Spectral_Thief_(move) | Spectral Thief}
 */
export class SpectralThiefAttr extends StatChangeBeforeDmgCalcAttr {
  /**
   * steals max amount of positive stats of the target while not exceeding the limit of max 6 stat stages
   *
   * @param user {@linkcode Pokemon} that called {@linkcode move}
   * @param target {@linkcode Pokemon} that is the target of {@linkcode move}
   * @param move {@linkcode Move} called by {@linkcode user}
   * @param args N/A
   *
   * @returns true if stat stages where correctly stolen
   */
  apply(user, target, _move, _args) {
    /**
     * Copy all positive stat stages to user and reduce copied stat stages on target.
     */
    for (const s of BATTLE_STATS) {
      const statStageValueTarget = target.getStatStage(s);
      const statStageValueUser = user.getStatStage(s);

      if (statStageValueTarget > 0) {
        /**
         * Only value of up to 6 can be stolen (stat stages don't exceed 6)
         */
        const availableToSteal = Math.min(statStageValueTarget, 6 - statStageValueUser);

        globalScene.phaseManager.unshiftNew(
          "StatStageChangePhase",
          user.getBattlerIndex(),
          this.selfTarget,
          [s],
          availableToSteal,
        );
        target.setStatStage(s, statStageValueTarget - availableToSteal);
      }
    }

    target.updateInfo();
    user.updateInfo();
    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:stealPositiveStats", {
        pokemonName: getPokemonNameWithAffix(user),
        targetName: getPokemonNameWithAffix(target),
      }),
    );

    return true;
  }
}

export class VariableAtkAttr extends MoveAttr {
  apply(_user, _target, _move, _args) {
    //const atk = args[0] as Utils.NumberHolder;
    return false;
  }
}

export class TargetAtkUserAtkAttr extends VariableAtkAttr {
  apply(_user, target, _move, args) {
    (args[0]).value = target.getEffectiveStat(Stat.ATK, target);
    return true;
  }
}

export class DefAtkAttr extends VariableAtkAttr {
  apply(user, target, _move, args) {
    (args[0]).value = user.getEffectiveStat(Stat.DEF, target);
    return true;
  }
}

export class VariableDefAttr extends MoveAttr {
  apply(_user, _target, _move, _args) {
    //const def = args[0] as Utils.NumberHolder;
    return false;
  }
}

export class DefDefAttr extends VariableDefAttr {
  apply(user, target, _move, args) {
    (args[0]).value = target.getEffectiveStat(Stat.DEF, user);
    return true;
  }
}

export class VariableAccuracyAttr extends MoveAttr {
  apply(_user, _target, _move, _args) {
    //const accuracy = args[0] as Utils.NumberHolder;
    return false;
  }
}

/**
 * Attribute used for Thunder and Hurricane that sets accuracy to 50 in sun and never miss in rain
 */
export class ThunderAccuracyAttr extends VariableAccuracyAttr {
  apply(_user, _target, _move, args) {
    if (!globalScene.arena.weather?.isEffectSuppressed()) {
      const accuracy = args[0];
      const weatherType = globalScene.arena.weather?.weatherType || WeatherType.NONE;
      switch (weatherType) {
        case WeatherType.SUNNY:
        case WeatherType.HARSH_SUN:
          accuracy.value = 50;
          return true;
        case WeatherType.RAIN:
        case WeatherType.HEAVY_RAIN:
          accuracy.value = -1;
          return true;
      }
    }

    return false;
  }
}

/**
 * Attribute used for Bleakwind Storm, Wildbolt Storm, and Sandsear Storm that sets accuracy to never
 * miss in rain
 * Springtide Storm does NOT have this property
 */
export class StormAccuracyAttr extends VariableAccuracyAttr {
  apply(_user, _target, _move, args) {
    if (!globalScene.arena.weather?.isEffectSuppressed()) {
      const accuracy = args[0];
      const weatherType = globalScene.arena.weather?.weatherType || WeatherType.NONE;
      switch (weatherType) {
        case WeatherType.RAIN:
        case WeatherType.HEAVY_RAIN:
          accuracy.value = -1;
          return true;
      }
    }

    return false;
  }
}

/**
 * Attribute used for moves which never miss
 * against Pokemon with the {@linkcode BattlerTagType.MINIMIZED}
 */
export class AlwaysHitMinimizeAttr extends VariableAccuracyAttr {
  /**
   * @see {@linkcode apply}
   * @param user N/A
   * @param target {@linkcode Pokemon} target of the move
   * @param move N/A
   * @param args [0] Accuracy of the move to be modified
   * @returns true if the function succeeds
   */
  apply(_user, target, _move, args) {
    if (target.getTag(BattlerTagType.MINIMIZED)) {
      const accuracy = args[0];
      accuracy.value = -1;

      return true;
    }

    return false;
  }
}

export class ToxicAccuracyAttr extends VariableAccuracyAttr {
  apply(user, _target, _move, args) {
    if (user.isOfType(PokemonType.POISON)) {
      const accuracy = args[0];
      accuracy.value = -1;
      return true;
    }

    return false;
  }
}

export class BlizzardAccuracyAttr extends VariableAccuracyAttr {
  apply(_user, _target, _move, args) {
    if (!globalScene.arena.weather?.isEffectSuppressed()) {
      const accuracy = args[0];
      const weatherType = globalScene.arena.weather?.weatherType || WeatherType.NONE;
      if (weatherType === WeatherType.HAIL || weatherType === WeatherType.SNOW) {
        accuracy.value = -1;
        return true;
      }
    }

    return false;
  }
}

export class VariableMoveCategoryAttr extends MoveAttr {
  apply(_user, _target, _move, _args) {
    return false;
  }
}

export class PhotonGeyserCategoryAttr extends VariableMoveCategoryAttr {
  apply(user, target, move, args) {
    const category = args[0];

    if (user.getEffectiveStat(Stat.ATK, target, move) > user.getEffectiveStat(Stat.SPATK, target, move)) {
      category.value = MoveCategory.PHYSICAL;
      return true;
    }

    return false;
  }
}

/**
 * Attribute used for tera moves that change category based on the user's Atk and SpAtk stats
 * Note: Currently, `getEffectiveStat` does not ignore all abilities that affect stats except those
 * with the attribute of `StatMultiplierAbAttr`
 */
// TODO: Remove the `.partial()` tag from Tera Blast and Tera Starstorm when the above issue is resolved
export class TeraMoveCategoryAttr extends VariableMoveCategoryAttr {
  apply(user, target, move, args) {
    const category = args[0];

    if (
      user.isTerastallized
      && user.getEffectiveStat(Stat.ATK, target, move, true, true, false, false, true)
        > user.getEffectiveStat(Stat.SPATK, target, move, true, true, false, false, true)
    ) {
      category.value = MoveCategory.PHYSICAL;
      return true;
    }

    return false;
  }
}

/**
 * Increases the power of Tera Blast if the user is Terastallized into Stellar type
 */
export class TeraBlastPowerAttr extends VariablePowerAttr {
  /**
   * Sets Tera Blast's power to 100 if the user is terastallized with
   * the Stellar tera type.
   * @param user {@linkcode Pokemon} the Pokemon using this move
   * @param target n/a
   * @param move {@linkcode Move} the Move with this attribute (i.e. Tera Blast)
   * @param args
   *   - [0] {@linkcode NumberHolder} the applied move's power, factoring in
   *       previously applied power modifiers.
   * @returns
   */
  apply(user, _target, _move, args) {
    const power = args[0];
    if (user.isTerastallized && user.getTeraType() === PokemonType.STELLAR) {
      power.value = 100;
      return true;
    }

    return false;
  }
}

/**
 * Change the move category to status when used on the ally
 */
export class StatusCategoryOnAllyAttr extends VariableMoveCategoryAttr {
  /**
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @param args [0] {@linkcode NumberHolder} The category of the move
   * @returns true if the function succeeds
   */
  apply(user, target, _move, args) {
    const category = args[0];

    if (user.getAlly() === target) {
      category.value = MoveCategory.STATUS;
      return true;
    }

    return false;
  }
}

export class ShellSideArmCategoryAttr extends VariableMoveCategoryAttr {
  apply(user, target, move, args) {
    const category = args[0];

    const predictedPhysDmg = target.getBaseDamage({
      source: user,
      move,
      moveCategory: MoveCategory.PHYSICAL,
      ignoreAbility: true,
      ignoreSourceAbility: true,
      ignoreAllyAbility: true,
      ignoreSourceAllyAbility: true,
      simulated: true,
    });
    const predictedSpecDmg = target.getBaseDamage({
      source: user,
      move,
      moveCategory: MoveCategory.SPECIAL,
      ignoreAbility: true,
      ignoreSourceAbility: true,
      ignoreAllyAbility: true,
      ignoreSourceAllyAbility: true,
      simulated: true,
    });

    if (predictedPhysDmg > predictedSpecDmg) {
      category.value = MoveCategory.PHYSICAL;
      return true;
    }
    if (predictedPhysDmg === predictedSpecDmg && user.randBattleSeedInt(2) === 0) {
      category.value = MoveCategory.PHYSICAL;
      return true;
    }
    return false;
  }
}

export class VariableMoveTypeAttr extends MoveAttr {
  apply(_user, _target, _move, _args) {
    return false;
  }

  /**
   * Determine the type of the move for the purpose of determining the type-boosting item to spawn
   * @param user - The Pokémon using the move
   * @param move - The move being used
   * @returns An array of types to add to the pool of type-boosting items
   */
  getTypesForItemSpawn(_user, move) {
    return [move.type];
  }

  /**
   * Get the type of the move for the purpose of AI move generation (e.g., Tera Type changes)
   * @param user - The user the move is being generated for
   * @param move - The move in question
   * @param willTera - Whether the user will Terastallize
   * @returns The type the move should be counted as for moveset generation
   */
  // biome-ignore lint/correctness/noUnusedFunctionParameters: params made available for subclasses
  getTypeForMovegen(user, move, willTera) {
    return move.type;
  }
}

export class FormChangeItemTypeAttr extends VariableMoveTypeAttr {
  apply(user, _target, move, args) {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    // TODO needs to be cleaned up
    if (
      [user.species.speciesId, user.fusionSpecies?.speciesId].includes(SpeciesId.ARCEUS)
      || [user.species.speciesId, user.fusionSpecies?.speciesId].includes(SpeciesId.SILVALLY)
    ) {
      const form =
        user.species.speciesId === SpeciesId.ARCEUS || user.species.speciesId === SpeciesId.SILVALLY
          ? user.formIndex
          : user.fusionSpecies.formIndex;
      if (form >= 0 && form <= MAX_POKEMON_TYPE && form !== PokemonType.STELLAR) {
        moveType.value = form;
        return true;
      }
      return true;
    }

    // Force move to have its original typing if it changed
    if (moveType.value === move.type) {
      return false;
    }
    moveType.value = move.type;
    return true;
  }

  getTypesForItemSpawn(user, move) {
    // Get the type
    const typeHolder = new NumberHolder(move.type);
    // Passing user in for target is fine; the parameter is unused anyway
    this.apply(user, user, move, [typeHolder]);
    return [typeHolder.value];
  }

  getTypeForMovegen(user, move) {
    return this.getTypesForItemSpawn(user, move)[0];
  }
}

export class TechnoBlastTypeAttr extends VariableMoveTypeAttr {
  apply(user, _target, _move, args) {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if ([user.species.speciesId, user.fusionSpecies?.speciesId].includes(SpeciesId.GENESECT)) {
      const form = user.species.speciesId === SpeciesId.GENESECT ? user.formIndex : user.fusionSpecies?.formIndex;

      switch (form) {
        case 1: // Shock Drive
          moveType.value = PokemonType.ELECTRIC;
          break;
        case 2: // Burn Drive
          moveType.value = PokemonType.FIRE;
          break;
        case 3: // Chill Drive
          moveType.value = PokemonType.ICE;
          break;
        case 4: // Douse Drive
          moveType.value = PokemonType.WATER;
          break;
        default:
          moveType.value = PokemonType.NORMAL;
          break;
      }
      return true;
    }

    return false;
  }

  getTypesForItemSpawn(user, move) {
    const typeHolder = new NumberHolder(move.type);
    this.apply(user, user, move, [typeHolder]);
    return [typeHolder.value];
  }

  getTypeForMovegen(user, move) {
    return this.getTypesForItemSpawn(user, move)[0];
  }
}

export class AuraWheelTypeAttr extends VariableMoveTypeAttr {
  apply(user, _target, _move, args) {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if ([user.species.speciesId, user.fusionSpecies?.speciesId].includes(SpeciesId.MORPEKO)) {
      const form = user.species.speciesId === SpeciesId.MORPEKO ? user.formIndex : user.fusionSpecies?.formIndex;

      switch (form) {
        case 1: // Hangry Mode
          moveType.value = PokemonType.DARK;
          break;
        default: // Full Belly Mode
          moveType.value = PokemonType.ELECTRIC;
          break;
      }
      return true;
    }

    return false;
  }

  getTypesForItemSpawn(user, move) {
    // On Morpeko only, allow this to count for both blackglasses and magnet
    if (this.apply(user, user, move, [new NumberHolder(move.type)])) {
      return [PokemonType.DARK, PokemonType.ELECTRIC];
    }

    return [move.type];
  }
}

export class RagingBullTypeAttr extends VariableMoveTypeAttr {
  apply(user, _target, _move, args) {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if ([user.species.speciesId, user.fusionSpecies?.speciesId].includes(SpeciesId.PALDEA_TAUROS)) {
      const form = user.species.speciesId === SpeciesId.PALDEA_TAUROS ? user.formIndex : user.fusionSpecies?.formIndex;

      switch (form) {
        case 1: // Blaze breed
          moveType.value = PokemonType.FIRE;
          break;
        case 2: // Aqua breed
          moveType.value = PokemonType.WATER;
          break;
        default:
          moveType.value = PokemonType.FIGHTING;
          break;
      }
      return true;
    }

    return false;
  }

  getTypesForItemSpawn(user, move) {
    const typeHolder = new NumberHolder(move.type);
    this.apply(user, user, move, [typeHolder]);
    return [typeHolder.value];
  }

  getTypeForMovegen(user, move) {
    return this.getTypesForItemSpawn(user, move)[0];
  }
}

export class IvyCudgelTypeAttr extends VariableMoveTypeAttr {
  apply(user, _target, _move, args) {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if ([user.species.speciesId, user.fusionSpecies?.speciesId].includes(SpeciesId.OGERPON)) {
      const form = user.species.speciesId === SpeciesId.OGERPON ? user.formIndex : user.fusionSpecies?.formIndex;

      switch (form) {
        case 1: // Wellspring Mask
        case 5: // Wellspring Mask Tera
          moveType.value = PokemonType.WATER;
          break;
        case 2: // Hearthflame Mask
        case 6: // Hearthflame Mask Tera
          moveType.value = PokemonType.FIRE;
          break;
        case 3: // Cornerstone Mask
        case 7: // Cornerstone Mask Tera
          moveType.value = PokemonType.ROCK;
          break;
        case 4: // Teal Mask Tera
        default:
          moveType.value = PokemonType.GRASS;
          break;
      }
      return true;
    }

    return false;
  }

  getTypesForItemSpawn(user, move) {
    const typeHolder = new NumberHolder(move.type);
    this.apply(user, user, move, [typeHolder]);
    return [typeHolder.value];
  }

  getTypeForMovegen(user, move) {
    return this.getTypesForItemSpawn(user, move)[0];
  }
}

export class WeatherBallTypeAttr extends VariableMoveTypeAttr {
  apply(_user, _target, move, args) {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if (!globalScene.arena.weather?.isEffectSuppressed()) {
      switch (globalScene.arena.weather?.weatherType) {
        case WeatherType.SUNNY:
        case WeatherType.HARSH_SUN:
          moveType.value = PokemonType.FIRE;
          break;
        case WeatherType.RAIN:
        case WeatherType.HEAVY_RAIN:
          moveType.value = PokemonType.WATER;
          break;
        case WeatherType.SANDSTORM:
          moveType.value = PokemonType.ROCK;
          break;
        case WeatherType.HAIL:
        case WeatherType.SNOW:
          moveType.value = PokemonType.ICE;
          break;
        default:
          if (moveType.value === move.type) {
            return false;
          }
          moveType.value = move.type;
          break;
      }
      return true;
    }

    return false;
  }

  getTypeForMovegen(user, move) {
    const userAbilityAttrs = user.getAbilityAttrs("PostSummonWeatherChangeAbAttr");
    switch (userAbilityAttrs.at(-1)?.weatherType) {
      case WeatherType.SUNNY:
      case WeatherType.HARSH_SUN:
        return PokemonType.FIRE;
      case WeatherType.RAIN:
      case WeatherType.HEAVY_RAIN:
        return PokemonType.WATER;
      case WeatherType.SANDSTORM:
        return PokemonType.ROCK;
      case WeatherType.HAIL:
      case WeatherType.SNOW:
        return PokemonType.ICE;
      default:
        return move.type;
    }
  }
}

/**
 * Changes the move's type to match the current terrain.
 * Has no effect if the user is not grounded.
 */
export class TerrainPulseTypeAttr extends VariableMoveTypeAttr {
  /**
   * @param user {@linkcode Pokemon} using this move
   * @param target N/A
   * @param move N/A
   * @param args [0] {@linkcode NumberHolder} The move's type to be modified
   * @returns true if the function succeeds
   */
  apply(user, _target, move, args) {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if (!user.isGrounded()) {
      return false;
    }

    const currentTerrain = globalScene.arena.terrainType;
    switch (currentTerrain) {
      case TerrainType.MISTY:
        moveType.value = PokemonType.FAIRY;
        break;
      case TerrainType.ELECTRIC:
        moveType.value = PokemonType.ELECTRIC;
        break;
      case TerrainType.GRASSY:
        moveType.value = PokemonType.GRASS;
        break;
      case TerrainType.PSYCHIC:
        moveType.value = PokemonType.PSYCHIC;
        break;
      default:
        if (moveType.value === move.type) {
          return false;
        }
        // force move to have its original typing if it was changed
        moveType.value = move.type;
        break;
    }
    return true;
  }
}

/**
 * Changes type based on the user's IVs
 */
export class HiddenPowerTypeAttr extends VariableMoveTypeAttr {
  apply(user, _target, _move, args) {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    const iv_val = Math.floor(
      (((user.ivs[Stat.HP] & 1)
        + (user.ivs[Stat.ATK] & 1) * 2
        + (user.ivs[Stat.DEF] & 1) * 4
        + (user.ivs[Stat.SPD] & 1) * 8
        + (user.ivs[Stat.SPATK] & 1) * 16
        + (user.ivs[Stat.SPDEF] & 1) * 32)
        * 15)
        / 63,
    );

    moveType.value = [
      PokemonType.FIGHTING,
      PokemonType.FLYING,
      PokemonType.POISON,
      PokemonType.GROUND,
      PokemonType.ROCK,
      PokemonType.BUG,
      PokemonType.GHOST,
      PokemonType.STEEL,
      PokemonType.FIRE,
      PokemonType.WATER,
      PokemonType.GRASS,
      PokemonType.ELECTRIC,
      PokemonType.PSYCHIC,
      PokemonType.ICE,
      PokemonType.DRAGON,
      PokemonType.DARK,
    ][iv_val];

    return true;
  }

  getTypesForItemSpawn(user, move) {
    const typeHolder = new NumberHolder(move.type);
    this.apply(user, user, move, [typeHolder]);
    return [typeHolder.value];
  }

  getTypeForMovegen(user, move) {
    return this.getTypesForItemSpawn(user, move)[0];
  }
}

/**
 * Changes the type of Tera Blast to match the user's tera type
 */
export class TeraBlastTypeAttr extends VariableMoveTypeAttr {
  /**
   * @param user {@linkcode Pokemon} the user of the move
   * @param target {@linkcode Pokemon} N/A
   * @param move {@linkcode Move} the move with this attribute
   * @param args `[0]` the move's type to be modified
   * @returns `true` if the move's type was modified; `false` otherwise
   */
  apply(user, _target, _move, args) {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if (user.isTerastallized) {
      moveType.value = user.getTeraType(); // changes move type to tera type
      return true;
    }

    return false;
  }

  getTypesForItemSpawn(user, move) {
    const coreType = move.type;
    const teraType = user.getTeraType();
    /** Whether the user is allowed to tera. In the case of an enemy Pokémon, whether it *will* tera. */
    const hasTeraAccess = user.isPlayer() ? canSpeciesTera(user) : willTerastallize(user);
    if (
      // tera type matches the move's type; no change
      !hasTeraAccess
      || teraType === coreType
      || teraType === PokemonType.STELLAR
      || teraType === PokemonType.UNKNOWN
    ) {
      return [coreType];
    }
    return [coreType, teraType];
  }

  getTypeForMovegen(user, move, willTera) {
    if (willTera) {
      return user.getTeraType();
    }
    return move.type;
  }
}

/**
 * Attribute used for Tera Starstorm that changes the move type to Stellar
 */
export class TeraStarstormTypeAttr extends VariableMoveTypeAttr {
  /**
   *
   * @param user the {@linkcode Pokemon} using the move
   * @param target n/a
   * @param move n/a
   * @param args[0] {@linkcode NumberHolder} the move type
   * @returns `true` if the move type is changed to {@linkcode PokemonType.STELLAR}, `false` otherwise
   */
  apply(user, _target, _move, args) {
    if (user.isTerastallized && user.hasSpecies(SpeciesId.TERAPAGOS)) {
      const moveType = args[0];

      moveType.value = PokemonType.STELLAR;
      return true;
    }
    return false;
  }

  getTypeForMovegen(user, move, willTera) {
    if (willTera && user.hasSpecies(SpeciesId.TERAPAGOS)) {
      return PokemonType.STELLAR;
    }
    return move.type;
  }
}

export class MatchUserTypeAttr extends VariableMoveTypeAttr {
  apply(user, _target, _move, args) {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }
    const userTypes = user.getTypes(true);

    if (userTypes.includes(PokemonType.STELLAR)) {
      // will not change to stellar type
      const nonTeraTypes = user.getTypes();
      moveType.value = nonTeraTypes[0];
      return true;
    }
    if (userTypes.length > 0) {
      moveType.value = userTypes[0];
      return true;
    }
    return false;
  }

  getTypesForItemSpawn(user, move) {
    // Instead of calling apply, just return the user's primary type
    // this avoids inconsistencies when the user's type is temporarily changed
    // from tera
    return [user.getTypes(false, true, true, false)[0] ?? move.type];
  }

  getTypeForMovegen(user, move, willTera) {
    const defaultType = user.getTypes(false, true, true, false)[0] ?? move.type;
    if (willTera) {
      const type = user.getTeraType();
      if (type !== PokemonType.STELLAR) {
        return type;
      }
    }

    return defaultType;
  }
}

/**
 * Changes the type of a Pledge move based on the Pledge move combined with it.
 */
export class CombinedPledgeTypeAttr extends VariableMoveTypeAttr {
  apply(user, _target, move, args) {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    const combinedPledgeMove = user?.turnData?.combiningPledge;
    if (!combinedPledgeMove) {
      return false;
    }

    switch (move.id) {
      case MoveId.FIRE_PLEDGE:
        if (combinedPledgeMove === MoveId.WATER_PLEDGE) {
          moveType.value = PokemonType.WATER;
          return true;
        }
        return false;
      case MoveId.WATER_PLEDGE:
        if (combinedPledgeMove === MoveId.GRASS_PLEDGE) {
          moveType.value = PokemonType.GRASS;
          return true;
        }
        return false;
      case MoveId.GRASS_PLEDGE:
        if (combinedPledgeMove === MoveId.FIRE_PLEDGE) {
          moveType.value = PokemonType.FIRE;
          return true;
        }
        return false;
      default:
        return false;
    }
  }
}

/**
 * Attribute for moves which have a custom type chart interaction.
 */
class MoveTypeChartOverrideAttr extends MoveAttr {
  /**
   * Apply the attribute to change the move's type effectiveness multiplier.
   * @param user - The {@linkcode Pokemon} using the move
   * @param target - The {@linkcode Pokemon} targeted by the move
   * @param move - The {@linkcode Move} with this attribute
   * @param args -
   * - `[0]`: A {@linkcode NumberHolder} holding the current type effectiveness
   * - `[1]`: The target's current typing
   * - `[2]`: The current {@linkcode PokemonType} of the move
   * @returns Whether application of the attribute succeeds
   */
  apply(user, target, move, args) {
    console.log("Implement effects")
  }
}


/**
 * Attribute to implement {@link https://bulbapedia.bulbagarden.net/wiki/Freeze-Dry_(move) | Freeze Dry}'s
 * guaranteed Water-type super effectiveness.
 */
export class FreezeDryAttr extends MoveTypeChartOverrideAttr {
  apply(
    _user,
    _target,
    _move,
    args,
  ) {
    const [multiplier, types, moveType] = args;
    if (!types.includes(PokemonType.WATER)) {
      return false;
    }

    // Replace whatever the prior "normal" water effectiveness was with a guaranteed 2x multi
    const normalEff = getTypeDamageMultiplier(moveType, PokemonType.WATER);
    multiplier.value *= 2 / normalEff;
    return true;
  }
}

/**
 * Attribute used by {@link https://bulbapedia.bulbagarden.net/wiki/Thousand_Arrows_(move) | Thousand Arrows}
 * to cause it to deal a fixed 1x damage against all ungrounded flying types.
 */
// TODO: Add mention in #5950 about this disabling groundedness-based immunities (once implemented)
export class NeutralDamageAgainstFlyingTypeAttr extends MoveTypeChartOverrideAttr {
  apply(
    _user,
    target,
    _move,
    args,
  ) {
    const [multiplier, types] = args;
    if (target.isGrounded() || !types.includes(PokemonType.FLYING)) {
      return false;
    }
    multiplier.value = 1;
    return true;
  }
}

/**
 * Attribute implementing the effect of {@link https://bulbapedia.bulbagarden.net/wiki/Synchronoise_(move) | Synchronoise},
 * rendering the move ineffective against all targets that do not share at least 1 type with the user.
 */
export class HitsSameTypeAttr extends MoveTypeChartOverrideAttr {
  apply(
    user,
    _target,
    _move,
    args,
  ) {
    const [multiplier, oppTypes] = args;
    const userTypes = user.getTypes(true);
    // Synchronoise is never effective if the user is typeless
    if (userTypes.includes(PokemonType.UNKNOWN)) {
      multiplier.value = 0;
      return true;
    }

    const sharesType = userTypes.some(type => oppTypes.includes(type));
    if (sharesType) {
      return false;
    }

    multiplier.value = 0;
    return true;
  }
}

/**
 * Attribute used by {@link https://bulbapedia.bulbagarden.net/wiki/Flying_Press_(move) | Flying Press}
 * to add the Flying type to its type effectiveness multiplier.
 */
export class FlyingTypeMultiplierAttr extends MoveTypeChartOverrideAttr {
  apply(
    user,
    target,
    _move,
    args,
  ) {
    const [multiplier] = args;
    // Intentionally exclude `move` to not re-trigger the effects of this attribute again
    // (thus leading to an infinite loop)
    // TODO: We may need to propagate `useIllusion` here for correct AI interactions
    multiplier.value *= target.getAttackTypeEffectiveness(PokemonType.FLYING, { source: user });
    return true;
  }
}

/**
 * Attribute used by {@link https://bulbapedia.bulbagarden.net/wiki/Sheer_Cold_(move) | Sheer Cold}
 * to implement its Gen VII+ ice ineffectiveness.
 */
export class IceNoEffectTypeAttr extends MoveTypeChartOverrideAttr {
  apply(
    _user,
    _target,
    _move,
    args,
  ) {
    const [multiplier, types] = args;
    if (types.includes(PokemonType.ICE)) {
      multiplier.value = 0;
      return true;
    }
    return false;
  }
}

export class OneHitKOAccuracyAttr extends VariableAccuracyAttr {
  apply(user, target, _move, args) {
    const accuracy = args[0];
    if (user.level < target.level) {
      accuracy.value = 0;
    } else {
      accuracy.value = Math.min(Math.max(30 + 100 * (1 - target.level / user.level), 0), 100);
    }
    return true;
  }
}

export class SheerColdAccuracyAttr extends OneHitKOAccuracyAttr {
  /**
   * Changes the normal One Hit KO Accuracy Attr to implement the Gen VII changes,
   * where if the user is Ice-Type, it has more accuracy.
   * @param user Pokemon that is using the move; checks the Pokemon's level.
   * @param target Pokemon that is receiving the move; checks the Pokemon's level.
   * @param move N/A
   * @param args Uses the accuracy argument, allowing to change it from either 0 if it doesn't pass
   * the first if/else, or 30/20 depending on the type of the user Pokemon.
   * @returns Returns true if move is successful, false if misses.
   */
  apply(user, target, _move, args) {
    const accuracy = args[0];
    if (user.level < target.level) {
      accuracy.value = 0;
    } else {
      const baseAccuracy = user.isOfType(PokemonType.ICE) ? 30 : 20;
      accuracy.value = Math.min(Math.max(baseAccuracy + 100 * (1 - target.level / user.level), 0), 100);
    }
    return true;
  }
}

export class MissEffectAttr extends MoveAttr {
  missEffectFunc;

  constructor(missEffectFunc) {
    super();

    this.missEffectFunc = missEffectFunc;
  }

  apply(user, _target, move, _args) {
    this.missEffectFunc(user, move);
    return true;
  }
}

export class NoEffectAttr extends MoveAttr {
  noEffectFunc;

  constructor(noEffectFunc) {
    super();

    this.noEffectFunc = noEffectFunc;
  }

  apply(user, _target, move, _args) {
    this.noEffectFunc(user, move);
    return true;
  }
}

/**
 * Function to deal Crash Damage (1/2 max hp) to the user on apply.
 */
const crashDamageFunc = (user, _move) => {
  const cancelled = new BooleanHolder(false);
  applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon: user, cancelled });
  if (cancelled.value) {
    return false;
  }

  user.damageAndUpdate(toDmgValue(user.getMaxHp() / 2), { result: HitResult.INDIRECT });
  globalScene.phaseManager.queueMessage(
    i18next.t("moveTriggers:keptGoingAndCrashed", { pokemonName: getPokemonNameWithAffix(user) }),
  );
  user.turnData.damageTaken += toDmgValue(user.getMaxHp() / 2);

  return true;
};

export class TypelessAttr extends MoveAttr {}
/**
 * Attribute used for moves which ignore redirection effects, and always target their original target, i.e. Snipe Shot
 * Bypasses Storm Drain, Follow Me, Ally Switch, and the like.
 */
export class BypassRedirectAttr extends MoveAttr {
  /** `true` if this move only bypasses redirection from Abilities */
  abilitiesOnly;

  constructor(abilitiesOnly = false) {
    super();
    this.abilitiesOnly = abilitiesOnly;
  }
}

export class FrenzyAttr extends MoveEffectAttr {
  constructor() {
    super(true, { lastHitOnly: true });
  }

  canApply(user, target, _move, _args) {
    return !(this.selfTarget ? user : target).isFainted();
  }

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    // TODO: Disable if used via dancer
    // TODO: Add support for moves that don't add the frenzy tag (Uproar, Rollout, etc.)

    // If frenzy is not active, add a tag and push 1-2 extra turns of attacks to the user's move queue.
    // Otherwise, tick down the existing tag.
    if (!user.getTag(BattlerTagType.FRENZY) && user.getMoveQueue().length === 0) {
      const turnCount = user.randBattleSeedIntRange(1, 2); // excludes initial use
      for (let i = 0; i < turnCount; i++) {
        user.pushMoveQueue({ move: move.id, targets: [target.getBattlerIndex()], useMode: MoveUseMode.IGNORE_PP });
      }
      user.addTag(BattlerTagType.FRENZY, turnCount, move.id, user.id);
    } else {
      applyMoveAttrs("AddBattlerTagAttr", user, target, move, args);
      user.lapseTag(BattlerTagType.FRENZY);
    }

    return true;
  }
}

/**
 * Attribute that grants {@link https://bulbapedia.bulbagarden.net/wiki/Semi-invulnerable_turn | semi-invulnerability} to the user during
 * the associated move's charging phase. Should only be used for {@linkcode ChargingMove | ChargingMoves} as a `chargeAttr`.
 */
export class SemiInvulnerableAttr extends MoveEffectAttr {
  /** The type of {@linkcode SemiInvulnerableTag} to grant to the user */
  tagType;

  constructor(tagType) {
    super(true);
    this.tagType = tagType;
  }

  /**
   * Grants a {@linkcode SemiInvulnerableTag} to the associated move's user.
   * @param user the {@linkcode Pokemon} using the move
   * @param target n/a
   * @param move the {@linkcode Move} being used
   * @param args n/a
   * @returns `true` if semi-invulnerability was successfully granted; `false` otherwise.
   */
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    return user.addTag(this.tagType, 1, move.id, user.id);
  }
}

export class AddBattlerTagAttr extends MoveEffectAttr {
  tagType;
  turnCountMin;
  turnCountMax;
  failOnOverlap;

  constructor(
    tagType,
    selfTarget = false,
    failOnOverlap = false,
    turnCountMin = 0,
    turnCountMax = turnCountMin,
    lastHitOnly = false,
  ) {
    super(selfTarget, { lastHitOnly });

    this.tagType = tagType;
    this.turnCountMin = turnCountMin;
    this.turnCountMax = turnCountMax;
    this.failOnOverlap = failOnOverlap;
  }

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    // TODO: Do any moves actually use chance-based battler tag adding?
    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, true);
    if (moveChance < 0 || moveChance === 100 || user.randBattleSeedInt(100) < moveChance) {
      return (this.selfTarget ? user : target).addTag(
        this.tagType,
        user.randBattleSeedIntRange(this.turnCountMin, this.turnCountMax),
        move.id,
        user.id,
      );
    }

    return false;
  }

  getCondition() {
    return this.failOnOverlap ? (user, target, _move) => !(this.selfTarget ? user : target).getTag(this.tagType) : null;
  }

  getTagTargetBenefitScore() {
    switch (this.tagType) {
      case BattlerTagType.RECHARGING:
      case BattlerTagType.PERISH_SONG:
        return -16;
      case BattlerTagType.FLINCHED:
      case BattlerTagType.CONFUSED:
      case BattlerTagType.INFATUATED:
      case BattlerTagType.NIGHTMARE:
      case BattlerTagType.DROWSY:
      case BattlerTagType.DISABLED:
      case BattlerTagType.HEAL_BLOCK:
      case BattlerTagType.RECEIVE_DOUBLE_DAMAGE:
        return -5;
      case BattlerTagType.SEEDED:
      case BattlerTagType.SALT_CURED:
      case BattlerTagType.CURSED:
      case BattlerTagType.FRENZY:
      case BattlerTagType.TRAPPED:
      case BattlerTagType.BIND:
      case BattlerTagType.WRAP:
      case BattlerTagType.FIRE_SPIN:
      case BattlerTagType.WHIRLPOOL:
      case BattlerTagType.CLAMP:
      case BattlerTagType.SAND_TOMB:
      case BattlerTagType.MAGMA_STORM:
      case BattlerTagType.SNAP_TRAP:
      case BattlerTagType.THUNDER_CAGE:
      case BattlerTagType.INFESTATION:
        return -3;
      case BattlerTagType.ENCORE:
        return -2;
      case BattlerTagType.MINIMIZED:
      case BattlerTagType.ALWAYS_GET_HIT:
        return 0;
      case BattlerTagType.INGRAIN:
      case BattlerTagType.IGNORE_ACCURACY:
      case BattlerTagType.AQUA_RING:
      case BattlerTagType.MAGIC_COAT:
        return 3;
      case BattlerTagType.PROTECTED:
      case BattlerTagType.FLYING:
      case BattlerTagType.CRIT_BOOST:
      case BattlerTagType.ALWAYS_CRIT:
        return 5;
      default:
        console.warn(`BattlerTag ${BattlerTagType[this.tagType]} is missing a score!`);
        return 0;
    }
  }

  getTargetBenefitScore(user, target, move) {
    let moveChance = this.getMoveChance(user, target, move, this.selfTarget, false);
    if (moveChance < 0) {
      moveChance = 100;
    }
    return Math.floor(this.getTagTargetBenefitScore() * (moveChance / 100));
  }
}

/**
 * Adds a {@link https://bulbapedia.bulbagarden.net/wiki/Seeding | Seeding} effect to the target
 * as seen with Leech Seed and Sappy Seed.
 */
export class LeechSeedAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.SEEDED);
  }
}

/**
 * Adds the appropriate battler tag for Smack Down and Thousand arrows
 */
export class FallDownAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.IGNORE_FLYING, false, false, 1, 1, true);
  }

  /**
   * Adds Grounded Tag to the target and checks if fallDown message should be displayed
   * @param user the {@linkcode Pokemon} using the move
   * @param target the {@linkcode Pokemon} targeted by the move
   * @param move the {@linkcode Move} invoking this effect
   * @param args n/a
   * @returns `true` if the effect successfully applies; `false` otherwise
   */
  apply(user, target, move, args) {
    if (!target.isGrounded()) {
      globalScene.phaseManager.queueMessage(
        i18next.t("moveTriggers:fallDown", { targetPokemonName: getPokemonNameWithAffix(target) }),
      );
    }
    return super.apply(user, target, move, args);
  }
}

/**
 * Adds the appropriate battler tag for Gulp Missile when Surf or Dive is used.
 */
export class GulpMissileTagAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  /**
   * Adds BattlerTagType from GulpMissileTag based on the Pokemon's HP ratio.
   * @param user The Pokemon using the move.
   * @param _target N/A
   * @param move The move being used.
   * @param _args N/A
   * @returns Whether the BattlerTag is applied.
   */
  apply(user, _target, move, _args) {
    if (!super.apply(user, _target, move, _args)) {
      return false;
    }

    if (user.hasAbility(AbilityId.GULP_MISSILE) && user.species.speciesId === SpeciesId.CRAMORANT) {
      if (user.getHpRatio() >= 0.5) {
        user.addTag(BattlerTagType.GULP_MISSILE_ARROKUDA, 0, move.id);
      } else {
        user.addTag(BattlerTagType.GULP_MISSILE_PIKACHU, 0, move.id);
      }
      return true;
    }

    return false;
  }

  getUserBenefitScore(user, _target, _move) {
    const isCramorant = user.hasAbility(AbilityId.GULP_MISSILE) && user.species.speciesId === SpeciesId.CRAMORANT;
    return isCramorant && !user.getTag(GulpMissileTag) ? 10 : 0;
  }
}

/**
 * Attribute to implement Jaw Lock's linked trapping effect between the user and target
 */
export class JawLockAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.TRAPPED);
  }

  apply(user, target, move, args) {
    if (!super.canApply(user, target, move, args)) {
      return false;
    }

    // If either the user or the target already has the tag, do not apply
    if (user.getTag(TrappedTag) || target.getTag(TrappedTag)) {
      return false;
    }

    const moveChance = this.getMoveChance(user, target, move, this.selfTarget);
    if (moveChance < 0 || moveChance === 100 || user.randBattleSeedInt(100) < moveChance) {
      /**
       * Add the tag to both the user and the target.
       * The target's tag source is considered to be the user and vice versa
       */
      return (
        target.addTag(BattlerTagType.TRAPPED, 1, move.id, user.id)
        && user.addTag(BattlerTagType.TRAPPED, 1, move.id, target.id)
      );
    }

    return false;
  }
}

export class CurseAttr extends MoveEffectAttr {
  apply(user, target, move, _args) {
    if (user.getTypes(true).includes(PokemonType.GHOST)) {
      if (target.getTag(BattlerTagType.CURSED)) {
        globalScene.phaseManager.queueMessage(i18next.t("battle:attackFailed"));
        return false;
      }
      const curseRecoilDamage = Math.max(1, Math.floor(user.getMaxHp() / 2));
      user.damageAndUpdate(curseRecoilDamage, { result: HitResult.INDIRECT, ignoreSegments: true });
      globalScene.phaseManager.queueMessage(
        i18next.t("battlerTags:cursedOnAdd", {
          pokemonNameWithAffix: getPokemonNameWithAffix(user),
          pokemonName: getPokemonNameWithAffix(target),
        }),
      );

      target.addTag(BattlerTagType.CURSED, 0, move.id, user.id);
      return true;
    }
    globalScene.phaseManager.unshiftNew("StatStageChangePhase", user.getBattlerIndex(), true, [Stat.ATK, Stat.DEF], 1);
    globalScene.phaseManager.unshiftNew("StatStageChangePhase", user.getBattlerIndex(), true, [Stat.SPD], -1);
    return true;
  }
}

/**
 * Attribute to remove all {@linkcode BattlerTag}s matching one or more tag types.
 */
export class RemoveBattlerTagAttr extends MoveEffectAttr {
  /** An array of {@linkcode BattlerTagType}s to clear. */
  tagTypes;

  constructor(tagTypes, selfTarget = false) {
    super(selfTarget);

    this.tagTypes = tagTypes;
  }

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    (this.selfTarget ? user : target).findAndRemoveTags(t => this.tagTypes.includes(t.tagType));

    return true;
  }
}

export class FlinchAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.FLINCHED, false);
  }
}

export class ConfuseAttr extends AddBattlerTagAttr {
  constructor(selfTarget) {
    super(BattlerTagType.CONFUSED, selfTarget, false, 2, 5);
  }

  apply(user, target, move, args) {
    if (!this.selfTarget && target.isSafeguarded(user)) {
      if (move.category === MoveCategory.STATUS) {
        globalScene.phaseManager.queueMessage(
          i18next.t("moveTriggers:safeguard", { targetName: getPokemonNameWithAffix(target) }),
        );
      }
      return false;
    }

    return super.apply(user, target, move, args);
  }
}

export class RechargeAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.RECHARGING, true, false, 1, 1, true);
  }
}

export class TrapAttr extends AddBattlerTagAttr {
  constructor(tagType) {
    super(tagType, false, false, 4, 5);
  }
}

export class ProtectAttr extends AddBattlerTagAttr {
  constructor(tagType = BattlerTagType.PROTECTED) {
    super(tagType, true);
  }

  getCondition() {
    return (user, _target, _move) => {
      let timesUsed = 0;

      for (const turnMove of user.getLastXMoves(-1)) {
        if (
          // Quick & Wide guard increment the Protect counter without using it for fail chance
          !(
            allMoves[turnMove.move].hasAttr("ProtectAttr")
            || [MoveId.QUICK_GUARD, MoveId.WIDE_GUARD].includes(turnMove.move)
          )
          || turnMove.result !== MoveResult.SUCCESS
        ) {
          break;
        }

        timesUsed++;
      }

      return timesUsed === 0 || user.randBattleSeedInt(Math.pow(3, timesUsed)) === 0;
    };
  }
}

/**
 * Attribute to remove all Substitutes from the field.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Tidy_Up_(move) | Tidy Up}
 * @see {@linkcode SubstituteTag}
 */
export class RemoveAllSubstitutesAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  /**
   * Remove's the Substitute Doll effect from all active Pokemon on the field
   * @param user {@linkcode Pokemon} the Pokemon using this move
   * @param target n/a
   * @param move {@linkcode Move} the move applying this effect
   * @param args n/a
   * @returns `true` if the effect successfully applies
   */
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    for (const pokemon of inSpeedOrder(ArenaTagSide.BOTH)) {
      pokemon.findAndRemoveTags(tag => tag.tagType === BattlerTagType.SUBSTITUTE);
    }

    return true;
  }
}

/**
 * Attribute used when a move can deal damage to {@linkcode BattlerTagType}
 * Moves that always hit but do not deal double damage: Thunder, Fissure, Sky Uppercut,
 * Smack Down, Hurricane, Thousand Arrows
 */
export class HitsTagAttr extends MoveAttr {
  /** The {@linkcode BattlerTagType} this move hits */
  tagType;
  /** Should this move deal double damage against {@linkcode tagType}? */
  doubleDamage = false;

  constructor(tagType) {
    super();

    this.tagType = tagType;
  }

  getTargetBenefitScore(_user, target, _move) {
    return target.getTag(this.tagType) ? (this.doubleDamage ? 10 : 5) : 0;
  }
}

/**
 * Used for moves that will always hit for a given tag but also doubles damage.
 * Moves include: Gust, Stomp, Body Slam, Surf, Earthquake, Magnitude, Twister,
 * Whirlpool, Dragon Rush, Heat Crash, Steam Roller, Flying Press
 */
export class HitsTagForDoubleDamageAttr extends HitsTagAttr {
  constructor(tagType) {
    super(tagType);
    this.doubleDamage = true;
  }
}

export class AddArenaTagAttr extends MoveEffectAttr {
  tagType;
  turnCount;
  failOnOverlap;
  selfSideTarget;

  constructor(tagType, turnCount = 0, failOnOverlap = false, selfSideTarget = false) {
    super(true);

    this.tagType = tagType;
    this.turnCount = turnCount;
    this.failOnOverlap = failOnOverlap;
    this.selfSideTarget = selfSideTarget;
  }

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    // TODO: Why does this check effect chance if nothing uses it?
    if (
      (move.chance < 0 || move.chance === 100 || user.randBattleSeedInt(100) < move.chance)
      && user.getLastXMoves(1)[0]?.result === MoveResult.SUCCESS
    ) {
      const side =
        (this.selfSideTarget ? user : target).isPlayer() !== (move.hasAttr("AddArenaTrapTagAttr") && target === user)
          ? ArenaTagSide.PLAYER
          : ArenaTagSide.ENEMY;
      globalScene.arena.addTag(this.tagType, this.turnCount, move.id, user.id, side);
      return true;
    }

    return false;
  }

  getCondition() {
    return this.failOnOverlap
      ? (_user, target, _move) =>
          !globalScene.arena.getTagOnSide(this.tagType, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY)
      : null;
  }
}

/**
 * Attribute to remove one or more arena tags from the field.
 */
export class RemoveArenaTagsAttr extends MoveEffectAttr {
  /** An array containing the tags to be removed. */
  tagTypes;
  /** A function which gets the side to remove `ArenaTag`s from */
  getTagSideFunc;

  constructor(
    tagTypes,
    getTagSideFunc,
    options,
  ) {
    super(true, options);

    this.tagTypes = tagTypes;
    this.getTagSideFunc = getTagSideFunc;
  }

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    globalScene.arena.removeTagsOnSide(this.tagTypes, this.getTagSideFunc(user, target));

    return true;
  }
}

export class AddArenaTrapTagAttr extends AddArenaTagAttr {
  getCondition() {
    return (user, _target, _move) => {
      const side = this.selfSideTarget !== user.isPlayer() ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER;
      const tag = globalScene.arena.getTagOnSide(this.tagType, side);
      if (!tag) {
        return true;
      }
      return tag.canAdd();
    };
  }
}

/**
 * Attribute used for Stone Axe and Ceaseless Edge.
 * Applies the given ArenaTrapTag when move is used.
 */
// TODO has exactly 1 line of code difference from the base attribute wrt. effect chances...
export class AddArenaTrapTagHitAttr extends AddArenaTagAttr {
  /**
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   */
  apply(user, target, move, _args) {
    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, true);
    const side = (this.selfSideTarget ? user : target).isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
    const tag = globalScene.arena.getTagOnSide(this.tagType, side);
    if (
      (moveChance < 0 || moveChance === 100 || user.randBattleSeedInt(100) < moveChance)
      && user.getLastXMoves(1)[0]?.result === MoveResult.SUCCESS
    ) {
      globalScene.arena.addTag(this.tagType, 0, move.id, user.id, side);
      if (!tag) {
        return true;
      }
      return tag.canAdd();
    }
    return false;
  }
}

// TODO: Review if we can remove these attributes
const arenaTrapTags = [
  ArenaTagType.SPIKES,
  ArenaTagType.TOXIC_SPIKES,
  ArenaTagType.STEALTH_ROCK,
  ArenaTagType.STICKY_WEB,
];

export class RemoveArenaTrapAttr extends RemoveArenaTagsAttr {
  constructor(getTagSideFunc) {
    // TODO triggers at a different time than `RemoveArenaTagsAbAttr`...
    super(arenaTrapTags, getTagSideFunc, { trigger: MoveEffectTrigger.PRE_APPLY });
  }
}

const screenTags = [ArenaTagType.REFLECT, ArenaTagType.LIGHT_SCREEN, ArenaTagType.AURORA_VEIL];

export class RemoveScreensAttr extends RemoveArenaTagsAttr {
  constructor(getTagSideFunc) {
    // TODO triggers at a different time than {@linkcode RemoveArenaTagsAbAttr}...
    super(screenTags, getTagSideFunc, { trigger: MoveEffectTrigger.PRE_APPLY });
  }
}

/**
 * Attribute to swap all valid {@linkcode ArenaTag}s between the player and enemy side of the field.
 * Ones affecting both sides are unaffected.
 */
export class SwapArenaTagsAttr extends MoveEffectAttr {
  validTags;

  constructor(validTags) {
    super(true);
    this.validTags = validTags;
  }

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const tagPlayerTemp = globalScene.arena.findTagsOnSide(
      t => this.validTags.includes(t.tagType),
      ArenaTagSide.PLAYER,
    );
    const tagEnemyTemp = globalScene.arena.findTagsOnSide(t => this.validTags.includes(t.tagType), ArenaTagSide.ENEMY);

    for (const playerTag of tagPlayerTemp) {
      globalScene.arena.removeTagOnSide(playerTag.tagType, ArenaTagSide.PLAYER, true);
      globalScene.arena.addTag(
        playerTag.tagType,
        playerTag.turnCount,
        playerTag.sourceMove,
        playerTag.sourceId,
        ArenaTagSide.ENEMY,
        true,
      ); // TODO: is the bang correct?
    }
    for (const enemyTag of tagEnemyTemp) {
      globalScene.arena.removeTagOnSide(enemyTag.tagType, ArenaTagSide.ENEMY, true);
      globalScene.arena.addTag(
        enemyTag.tagType,
        enemyTag.turnCount,
        enemyTag.sourceMove,
        enemyTag.sourceId,
        ArenaTagSide.PLAYER,
        true,
      ); // TODO: is the bang correct?
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:swapArenaTags", { pokemonName: getPokemonNameWithAffix(user) }),
    );
    return true;
  }
}

/**
 * Attribute that adds a secondary effect to the field when two unique Pledge moves
 * are combined. The effect added varies based on the two Pledge moves combined.
 */
export class AddPledgeEffectAttr extends AddArenaTagAttr {
  requiredPledge;

  constructor(tagType, requiredPledge, selfSideTarget = false) {
    super(tagType, 4, false, selfSideTarget);

    this.requiredPledge = requiredPledge;
  }

  apply(user, target, move, args) {
    // TODO: add support for `HIT` effect triggering in AddArenaTagAttr to remove the need for this check
    if (user.getLastXMoves(1)[0]?.result !== MoveResult.SUCCESS) {
      return false;
    }

    if (user.turnData.combiningPledge === this.requiredPledge) {
      return super.apply(user, target, move, args);
    }
    return false;
  }
}

/**
 * Attribute used for Revival Blessing.
 */
export class RevivalBlessingAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  /**
   *
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @param args N/A
   * @returns `true` if function succeeds.
   */
  apply(user, _target, _move, _args) {
    // If user is player, checks if the user has fainted pokemon
    if (user.isPlayer()) {
      globalScene.phaseManager.unshiftNew("RevivalBlessingPhase", user);
      return true;
    }
    if (
      user.isEnemy()
      && user.hasTrainer()
      && globalScene.getEnemyParty().findIndex(p => p.isFainted() && !p.isBoss()) > -1
    ) {
      // If used by an enemy trainer with at least one fainted non-boss Pokemon, this
      // revives one of said Pokemon selected at random.
      const faintedPokemon = globalScene.getEnemyParty().filter(p => p.isFainted() && !p.isBoss());
      const pokemon = faintedPokemon[user.randBattleSeedInt(faintedPokemon.length)];
      const slotIndex = globalScene.getEnemyParty().findIndex(p => pokemon.id === p.id);
      pokemon.resetStatus(true, false, false, true);
      pokemon.heal(Math.min(toDmgValue(0.5 * pokemon.getMaxHp()), pokemon.getMaxHp()));
      globalScene.phaseManager.queueMessage(
        i18next.t("moveTriggers:revivalBlessing", { pokemonName: getPokemonNameWithAffix(pokemon) }),
        0,
        true,
      );
      const allyPokemon = user.getAlly();
      if (
        globalScene.currentBattle.double
        && globalScene.getEnemyParty().length > 1
        && allyPokemon != null // Handle cases where revived pokemon needs to get switched in on same turn
        && (allyPokemon.isFainted() || allyPokemon === pokemon)
      ) {
        // Enemy switch phase should be removed and replaced with the revived pkmn switching in
        globalScene.phaseManager.tryRemovePhase("SwitchSummonPhase", phase => phase.getFieldIndex() === slotIndex);
        // If the pokemon being revived was alive earlier in the turn, cancel its move
        // TODO: check if revived pokemon shouldn't be able to move in the same turn they're brought back
        // TODO: might make sense to move this to `FaintPhase` after checking for Rev Seed (rather than handling it in the move)
        globalScene.phaseManager.getMovePhase((phase) => phase.pokemon === pokemon)?.cancel();
        if (user.fieldPosition === FieldPosition.CENTER) {
          user.setFieldPosition(FieldPosition.LEFT);
        }
        globalScene.phaseManager.unshiftNew(
          "SwitchSummonPhase",
          SwitchType.SWITCH,
          allyPokemon.getFieldIndex(),
          slotIndex,
          false,
          false,
        );
      }
      return true;
    }
    return false;
  }

  getCondition() {
    return (user, _target, _move) =>
      user.hasTrainer()
      && (user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty()).some(
        (p) => p.isFainted() && !p.isBoss(),
      );
  }

  getUserBenefitScore(user, _target, _move) {
    if (user.hasTrainer() && globalScene.getEnemyParty().some(p => p.isFainted() && !p.isBoss())) {
      return 20;
    }

    return -20;
  }
}

export class ForceSwitchOutAttr extends MoveEffectAttr {
  selfSwitch;
  switchType;

  constructor(selfSwitch = false, switchType = SwitchType.SWITCH) {
    super(false, { lastHitOnly: true });

    this.selfSwitch = selfSwitch;
    this.switchType = switchType;
  }

  isBatonPass() {
    return this.switchType === SwitchType.BATON_PASS;
  }

  apply(user, target, move, _args) {
    // Check if the move category is not STATUS or if the switch out condition is not met
    if (!this.getSwitchOutCondition()(user, target, move)) {
      return false;
    }

    /** The {@linkcode Pokemon} to be switched out with this effect */
    const switchOutTarget = this.selfSwitch ? user : target;

    // If the switch-out target is a Dondozo with a Tatsugiri in its mouth
    // (e.g. when it uses Flip Turn), make it spit out the Tatsugiri before switching out.
    switchOutTarget.lapseTag(BattlerTagType.COMMANDED);

    if (switchOutTarget.isPlayer()) {
      /**
       * Check if Wimp Out/Emergency Exit activates due to being hit by U-turn or Volt Switch
       * If it did, the user of U-turn or Volt Switch will not be switched out.
       */
      if (
        target.getAbility().hasAttr("PostDamageForceSwitchAbAttr")
        && [MoveId.U_TURN, MoveId.VOLT_SWITCH, MoveId.FLIP_TURN].includes(move.id)
        && this.hpDroppedBelowHalf(target)
      ) {
        return false;
      }

      // Find indices of off-field Pokemon that are eligible to be switched into
      const eligibleNewIndices= [];
      globalScene.getPlayerParty().forEach((pokemon, index) => {
        if (pokemon.isAllowedInBattle() && !pokemon.isOnField()) {
          eligibleNewIndices.push(index);
        }
      });

      if (eligibleNewIndices.length === 0) {
        return false;
      }

      if (switchOutTarget.hp > 0) {
        if (this.switchType === SwitchType.FORCE_SWITCH) {
          const slotIndex = eligibleNewIndices[user.randBattleSeedInt(eligibleNewIndices.length)];
          globalScene.phaseManager.queueDeferred(
            "SwitchSummonPhase",
            this.switchType,
            switchOutTarget.getFieldIndex(),
            slotIndex,
            false,
            true,
          );
        } else {
          switchOutTarget.leaveField(this.switchType === SwitchType.SWITCH);
          globalScene.phaseManager.queueDeferred(
            "SwitchPhase",
            this.switchType,
            switchOutTarget.getFieldIndex(),
            true,
            true,
          );
          return true;
        }
      }
      return false;
    }
    if (globalScene.currentBattle.battleType !== BattleType.WILD) {
      // Switch out logic for enemy trainers
      // Find indices of off-field Pokemon that are eligible to be switched into
      const isPartnerTrainer = globalScene.currentBattle.trainer?.isPartner();
      const eligibleNewIndices = [];
      globalScene.getEnemyParty().forEach((pokemon, index) => {
        if (
          pokemon.isAllowedInBattle()
          && !pokemon.isOnField()
          && (!isPartnerTrainer || pokemon.trainerSlot === (switchOutTarget).trainerSlot)
        ) {
          eligibleNewIndices.push(index);
        }
      });

      if (eligibleNewIndices.length === 0) {
        return false;
      }

      if (switchOutTarget.hp > 0) {
        if (this.switchType === SwitchType.FORCE_SWITCH) {
          const slotIndex = eligibleNewIndices[user.randBattleSeedInt(eligibleNewIndices.length)];
          globalScene.phaseManager.queueDeferred(
            "SwitchSummonPhase",
            this.switchType,
            switchOutTarget.getFieldIndex(),
            slotIndex,
            false,
            false,
          );
        } else {
          globalScene.phaseManager.queueDeferred(
            "SwitchSummonPhase",
            this.switchType,
            switchOutTarget.getFieldIndex(),
            globalScene.currentBattle.trainer
              ? globalScene.currentBattle.trainer.getNextSummonIndex((switchOutTarget).trainerSlot)
              : 0,
            false,
            false,
          );
        }
      }
    } else {
      // Switch out logic for wild pokemon
      /**
       * Check if Wimp Out/Emergency Exit activates due to being hit by U-turn or Volt Switch
       * If it did, the user of U-turn or Volt Switch will not be switched out.
       */
      if (
        target.getAbility().hasAttr("PostDamageForceSwitchAbAttr")
        && [MoveId.U_TURN, MoveId.VOLT_SWITCH, MoveId.FLIP_TURN].includes(move.id)
        && this.hpDroppedBelowHalf(target)
      ) {
        return false;
      }

      const allyPokemon = switchOutTarget.getAlly();

      if (switchOutTarget.hp > 0) {
        switchOutTarget.leaveField(false);
        globalScene.phaseManager.queueMessage(
          i18next.t("moveTriggers:fled", { pokemonName: getPokemonNameWithAffix(switchOutTarget) }),
          null,
          true,
          500,
        );

        // in double battles redirect potential moves off fled pokemon
        if (globalScene.currentBattle.double && allyPokemon != null) {
          globalScene.redirectPokemonMoves(switchOutTarget, allyPokemon);
        }
      }

      // clear out enemy held item modifiers of the switch out target
      globalScene.clearEnemyHeldItemModifiers(switchOutTarget);

      if (!allyPokemon?.isActive(true) && switchOutTarget.hp) {
        globalScene.phaseManager.pushNew("BattleEndPhase", false);

        if (globalScene.gameMode.hasRandomBiomes || globalScene.isNewBiome()) {
          globalScene.phaseManager.pushNew("SelectBiomePhase");
        }

        globalScene.phaseManager.pushNew("NewBattlePhase");
      }
    }

    return true;
  }

  getCondition() {
    return (user, target, move) =>
      move.category !== MoveCategory.STATUS || this.getSwitchOutCondition()(user, target, move);
  }

  getFailedText(_user, target, _move) {
    const cancelled = new BooleanHolder(false);
    applyAbAttrs("ForceSwitchOutImmunityAbAttr", { pokemon: target, cancelled });
    if (cancelled.value) {
      return i18next.t("moveTriggers:cannotBeSwitchedOut", { pokemonName: getPokemonNameWithAffix(target) });
    }
  }

  getSwitchOutCondition() {
    return (user, target, move) => {
      const switchOutTarget = this.selfSwitch ? user : target;
      const player = switchOutTarget.isPlayer();
      const forceSwitchAttr = move
        .getAttrs("ForceSwitchOutAttr")
        .find(attr => attr.switchType === SwitchType.FORCE_SWITCH);

      if (!this.selfSwitch) {
        if (move.hitsSubstitute(user, target)) {
          return false;
        }

        // Check if the move is Roar or Whirlwind and if there is a trainer with only Pokémon left.
        if (forceSwitchAttr && globalScene.currentBattle.trainer) {
          const enemyParty = globalScene.getEnemyParty();
          // Filter out any Pokémon that are not allowed in battle (e.g. fainted ones)
          const remainingPokemon = enemyParty.filter(p => p.hp > 0 && p.isAllowedInBattle());
          if (remainingPokemon.length <= 1) {
            return false;
          }
        }

        // Dondozo with an allied Tatsugiri in its mouth cannot be forced out
        const commandedTag = switchOutTarget.getTag(BattlerTagType.COMMANDED);
        if (commandedTag?.getSourcePokemon()?.isActive(true)) {
          return false;
        }

        const blockedByAbility = new BooleanHolder(false);
        applyAbAttrs("ForceSwitchOutImmunityAbAttr", { pokemon: target, cancelled: blockedByAbility });
        if (blockedByAbility.value) {
          return false;
        }
      }

      if (!player && globalScene.currentBattle.battleType === BattleType.WILD) {
        // wild pokemon cannot switch out with baton pass.
        return (
          !this.isBatonPass()
          && globalScene.currentBattle.waveIndex % 10 !== 0 // Don't allow wild mons to flee with U-turn et al.
          && !(this.selfSwitch && MoveCategory.STATUS !== move.category)
        );
      }

      const party = player ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
      return (
        party.filter(
          p =>
            p.isAllowedInBattle()
            && !p.isOnField()
            && (player || (p).trainerSlot === (switchOutTarget).trainerSlot),
        ).length > 0
      );
    };
  }

  getUserBenefitScore(user, target, move) {
    if (!globalScene.getEnemyParty().find(p => p.isActive() && !p.isOnField())) {
      return -20;
    }
    let ret = this.selfSwitch
      ? Math.floor((1 - user.getHpRatio()) * 20)
      : super.getUserBenefitScore(user, target, move);
    if (this.selfSwitch && this.isBatonPass()) {
      const statStageTotal = user.getStatStages().reduce((s, total) => (total += s), 0);
      ret =
        ret / 2
        + Phaser.Tweens.Builders.GetEaseFunction("Sine.easeOut")(Math.min(Math.abs(statStageTotal), 10) / 10)
          * (statStageTotal >= 0 ? 10 : -10);
    }
    return ret;
  }

  /**
   * Helper function to check if the Pokémon's health is below half after taking damage.
   * Used for an edge case interaction with Wimp Out/Emergency Exit.
   * If the Ability activates due to being hit by U-turn or Volt Switch, the user of that move will not be switched out.
   */
  hpDroppedBelowHalf(target) {
    const pokemonHealth = target.hp;
    const maxPokemonHealth = target.getMaxHp();
    const damageTaken = target.turnData.damageTaken;
    const initialHealth = pokemonHealth + damageTaken;

    // Check if the Pokémon's health has dropped below half after the damage
    return initialHealth >= maxPokemonHealth / 2 && pokemonHealth < maxPokemonHealth / 2;
  }
}

export class ChillyReceptionAttr extends ForceSwitchOutAttr {
  apply(user, target, move, args) {
    globalScene.arena.trySetWeather(WeatherType.SNOW, user);
    return super.apply(user, target, move, args);
  }

  getCondition() {
    // chilly reception move will go through if the weather is change-able to snow, or the user can switch out, else move will fail
    return (user, target, move) =>
      globalScene.arena.weather?.weatherType !== WeatherType.SNOW || super.getSwitchOutCondition()(user, target, move);
  }
}

export class RemoveTypeAttr extends MoveEffectAttr {
  // TODO: Remove the message callback
  removedType;
  messageCallback;

  constructor(removedType, messageCallback) {
    super(true, { trigger: MoveEffectTrigger.POST_TARGET });
    this.removedType = removedType;
    this.messageCallback = messageCallback;
  }

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const userTypes = user.getTypes(true);
    const modifiedTypes = userTypes.filter(type => type !== this.removedType);
    if (modifiedTypes.length === 0) {
      modifiedTypes.push(PokemonType.UNKNOWN);
    }
    user.summonData.types = modifiedTypes;
    user.updateInfo();

    if (this.messageCallback) {
      this.messageCallback(user);
    }

    return true;
  }
}

export class CopyTypeAttr extends MoveEffectAttr {
  constructor() {
    super(false);
  }

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const targetTypes = target.getTypes(true);
    if (targetTypes.includes(PokemonType.UNKNOWN) && targetTypes.indexOf(PokemonType.UNKNOWN) > -1) {
      targetTypes[targetTypes.indexOf(PokemonType.UNKNOWN)] = PokemonType.NORMAL;
    }
    user.summonData.types = targetTypes;
    user.updateInfo();

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:copyType", {
        pokemonName: getPokemonNameWithAffix(user),
        targetPokemonName: getPokemonNameWithAffix(target),
      }),
    );

    return true;
  }

  getCondition() {
    return (_user, target, _move) =>
      target.getTypes()[0] !== PokemonType.UNKNOWN || target.summonData.addedType !== null;
  }
}

export class CopyBiomeTypeAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const terrainType = globalScene.arena.terrainType;
    let typeChange;
    if (terrainType !== TerrainType.NONE) {
      typeChange = this.getTypeForTerrain(globalScene.arena.terrainType);
    } else {
      typeChange = this.getTypeForBiome(globalScene.arena.biomeId);
    }

    user.summonData.types = [typeChange];
    user.updateInfo();

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:transformedIntoType", {
        pokemonName: getPokemonNameWithAffix(user),
        typeName: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[typeChange])}`),
      }),
    );

    return true;
  }

  /**
   * Retrieves a type from the current terrain
   * @param terrainType {@linkcode TerrainType}
   * @returns
   */
  getTypeForTerrain(terrainType) {
    switch (terrainType) {
      case TerrainType.ELECTRIC:
        return PokemonType.ELECTRIC;
      case TerrainType.MISTY:
        return PokemonType.FAIRY;
      case TerrainType.GRASSY:
        return PokemonType.GRASS;
      case TerrainType.PSYCHIC:
        return PokemonType.PSYCHIC;
      case TerrainType.NONE:
      default:
        return PokemonType.UNKNOWN;
    }
  }

  /**
   * Retrieves a type from the current biome
   * @param biomeType {@linkcode BiomeId}
   * @returns
   */
  getTypeForBiome(biomeType) {
    switch (biomeType) {
      case BiomeId.TOWN:
      case BiomeId.PLAINS:
      case BiomeId.METROPOLIS:
        return PokemonType.NORMAL;
      case BiomeId.GRASS:
      case BiomeId.TALL_GRASS:
        return PokemonType.GRASS;
      case BiomeId.FOREST:
      case BiomeId.JUNGLE:
        return PokemonType.BUG;
      case BiomeId.SLUM:
      case BiomeId.SWAMP:
        return PokemonType.POISON;
      case BiomeId.SEA:
      case BiomeId.BEACH:
      case BiomeId.LAKE:
      case BiomeId.SEABED:
        return PokemonType.WATER;
      case BiomeId.MOUNTAIN:
        return PokemonType.FLYING;
      case BiomeId.BADLANDS:
        return PokemonType.GROUND;
      case BiomeId.CAVE:
      case BiomeId.DESERT:
        return PokemonType.ROCK;
      case BiomeId.ICE_CAVE:
      case BiomeId.SNOWY_FOREST:
        return PokemonType.ICE;
      case BiomeId.MEADOW:
      case BiomeId.FAIRY_CAVE:
      case BiomeId.ISLAND:
        return PokemonType.FAIRY;
      case BiomeId.POWER_PLANT:
        return PokemonType.ELECTRIC;
      case BiomeId.VOLCANO:
        return PokemonType.FIRE;
      case BiomeId.GRAVEYARD:
      case BiomeId.TEMPLE:
        return PokemonType.GHOST;
      case BiomeId.DOJO:
      case BiomeId.CONSTRUCTION_SITE:
        return PokemonType.FIGHTING;
      case BiomeId.FACTORY:
      case BiomeId.LABORATORY:
        return PokemonType.STEEL;
      case BiomeId.RUINS:
      case BiomeId.SPACE:
        return PokemonType.PSYCHIC;
      case BiomeId.WASTELAND:
      case BiomeId.END:
        return PokemonType.DRAGON;
      case BiomeId.ABYSS:
        return PokemonType.DARK;
      default:
        return PokemonType.UNKNOWN;
    }
  }
}

/**
 * Attribute to the target's current types to the given type.
 * Used by {@linkcode MoveId.SOAK} and {@linkcode MoveId.MAGIC_POWDER}.
 */
export class ChangeTypeAttr extends MoveEffectAttr {
  type;

  constructor(type) {
    super(false);
    this.type = type;
  }

  apply(_user, target, _move, _args) {
    target.summonData.types = [this.type];
    target.updateInfo();

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:transformedIntoType", {
        pokemonName: getPokemonNameWithAffix(target),
        typeName: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.type])}`),
      }),
    );

    return true;
  }

  getCondition() {
    return (_user, target, _move) =>
      !target.isTerastallized
      && !target.hasAbility(AbilityId.MULTITYPE)
      && !target.hasAbility(AbilityId.RKS_SYSTEM)
      && !(target.getTypes().length === 1 && target.getTypes()[0] === this.type);
  }
}

export class AddTypeAttr extends MoveEffectAttr {
  type;

  constructor(type) {
    super(false);

    this.type = type;
  }

  apply(_user, target, _move, _args) {
    target.summonData.addedType = this.type;
    target.updateInfo();

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:addType", {
        typeName: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.type])}`),
        pokemonName: getPokemonNameWithAffix(target),
      }),
    );

    return true;
  }

  getCondition() {
    return (_user, target, _move) => !target.isTerastallized && !target.getTypes().includes(this.type);
  }
}

export class FirstMoveTypeAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const firstMoveType = target.getMoveset()[0].getMove().type;
    user.summonData.types = [firstMoveType];
    globalScene.phaseManager.queueMessage(
      i18next.t("battle:transformedIntoType", {
        pokemonName: getPokemonNameWithAffix(user),
        type: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[firstMoveType])}`),
      }),
    );

    return true;
  }
}

/**
 * Attribute used to call a move.
 * Used by other move attributes: {@linkcode RandomMoveAttr}, {@linkcode RandomMovesetMoveAttr}, {@linkcode CopyMoveAttr}
 */
class CallMoveAttr extends OverrideMoveEffectAttr {
  invalidMoves;
  hasTarget;

  apply(user, target, move, _args) {
    // Get eligible targets for move, failing if we can't target anything
    const replaceMoveTarget = move.moveTarget === MoveTarget.NEAR_OTHER ? MoveTarget.NEAR_ENEMY : undefined;
    const moveTargets = getMoveTargets(user, move.id, replaceMoveTarget);
    if (moveTargets.targets.length === 0) {
      globalScene.phaseManager.queueMessage(i18next.t("battle:attackFailed"));
      return false;
    }

    // Spread moves and ones with only 1 valid target will use their normal targeting.
    // If not, target the Mirror Move recipient or else a random enemy in our target list
    const targets =
      moveTargets.multiple || moveTargets.targets.length === 1
        ? moveTargets.targets
        : [
            this.hasTarget
              ? target.getBattlerIndex()
              : moveTargets.targets[user.randBattleSeedInt(moveTargets.targets.length)],
          ];

    globalScene.phaseManager.unshiftNew("LoadMoveAnimPhase", move.id);
    globalScene.phaseManager.unshiftNew(
      "MovePhase",
      user,
      targets,
      new PokemonMove(move.id),
      MoveUseMode.FOLLOW_UP,
      MovePhaseTimingModifier.FIRST,
    );
    return true;
  }
}

/**
 * Attribute used to call a random move.
 * Used for {@linkcode MoveId.METRONOME}
 */
export class RandomMoveAttr extends CallMoveAttr {
  constructor(invalidMoves) {
    super();
    this.invalidMoves = invalidMoves;
  }

  /**
   * This function exists solely to allow tests to the randomly selected move by mocking this function.
   */
  getMoveOverride() {
    return null;
  }

  /**
   * User calls a random moveId.
   *
   * Invalid moves are indicated by what is passed in to invalidMoves: {@linkcode invalidMetronomeMoves}
   * @param user Pokemon that used the move and will call a random move
   * @param target Pokemon that will be targeted by the random move (if single target)
   * @param move Move being used
   * @param args Unused
   */
  apply(user, target, _move, args) {
    // TODO: Move this into the constructor to avoid constructing this every call
    const moveIds = getEnumValues(MoveId).map(m =>
      !this.invalidMoves.has(m) && !allMoves[m].name.endsWith(" (N)") ? m : MoveId.NONE,
    );
    let moveId = MoveId.NONE;
    const moveStatus = new BooleanHolder(true);
    do {
      moveId = this.getMoveOverride() ?? moveIds[user.randBattleSeedInt(moveIds.length)];
      moveStatus.value = moveId !== MoveId.NONE;
      if (user.isPlayer()) {
        applyChallenges(ChallengeType.POKEMON_MOVE, moveId, moveStatus);
      }
    } while (!moveStatus.value);
    return super.apply(user, target, allMoves[moveId], args);
  }
}

/**
 * Attribute used to call a random move in the user or party's moveset.
 * Used for {@linkcode MoveId.ASSIST} and {@linkcode MoveId.SLEEP_TALK}
 *
 * Fails if the user has no callable moves.
 *
 * Invalid moves are indicated by what is passed in to invalidMoves: {@linkcode invalidAssistMoves} or {@linkcode invalidSleepTalkMoves}
 */
export class RandomMovesetMoveAttr extends CallMoveAttr {
  includeParty;
  moveId;
  constructor(invalidMoves, includeParty = false) {
    super();
    this.includeParty = includeParty;
    this.invalidMoves = invalidMoves;
  }

  /**
   * User calls a random moveId selected in {@linkcode getCondition}
   * @param user Pokemon that used the move and will call a random move
   * @param target Pokemon that will be targeted by the random move (if single target)
   * @param move Move being used
   * @param args Unused
   */
  apply(user, target, _move, args) {
    return super.apply(user, target, allMoves[this.moveId], args);
  }

  getCondition() {
    return (user, _target, _move) => {
      // includeParty will be true for Assist, false for Sleep Talk
      let allies;
      if (this.includeParty) {
        allies = (user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty()).filter(p => p !== user);
      } else {
        allies = [user];
      }
      const partyMoveset = allies.flatMap(p => p.moveset);
      const moves = partyMoveset.filter(m => !this.invalidMoves.has(m.moveId) && !m.getMove().name.endsWith(" (N)"));
      if (moves.length === 0) {
        return false;
      }

      this.moveId = moves[user.randBattleSeedInt(moves.length)].moveId;
      return true;
    };
  }
}

// TODO: extend CallMoveAttr
export class NaturePowerAttr extends OverrideMoveEffectAttr {
  apply(user, target, _move, _args) {
    let moveId = MoveId.NONE;
    switch (globalScene.arena.terrainType) {
      // this allows terrains to 'override' the biome move
      case TerrainType.NONE:
        switch (globalScene.arena.biomeId) {
          case BiomeId.TOWN:
            moveId = MoveId.ROUND;
            break;
          case BiomeId.METROPOLIS:
            moveId = MoveId.TRI_ATTACK;
            break;
          case BiomeId.SLUM:
            moveId = MoveId.SLUDGE_BOMB;
            break;
          case BiomeId.PLAINS:
            moveId = MoveId.SILVER_WIND;
            break;
          case BiomeId.GRASS:
            moveId = MoveId.GRASS_KNOT;
            break;
          case BiomeId.TALL_GRASS:
            moveId = MoveId.POLLEN_PUFF;
            break;
          case BiomeId.MEADOW:
            moveId = MoveId.GIGA_DRAIN;
            break;
          case BiomeId.FOREST:
            moveId = MoveId.BUG_BUZZ;
            break;
          case BiomeId.JUNGLE:
            moveId = MoveId.LEAF_STORM;
            break;
          case BiomeId.SEA:
            moveId = MoveId.HYDRO_PUMP;
            break;
          case BiomeId.SWAMP:
            moveId = MoveId.MUD_BOMB;
            break;
          case BiomeId.BEACH:
            moveId = MoveId.SCALD;
            break;
          case BiomeId.LAKE:
            moveId = MoveId.BUBBLE_BEAM;
            break;
          case BiomeId.SEABED:
            moveId = MoveId.BRINE;
            break;
          case BiomeId.ISLAND:
            moveId = MoveId.LEAF_TORNADO;
            break;
          case BiomeId.MOUNTAIN:
            moveId = MoveId.AIR_SLASH;
            break;
          case BiomeId.BADLANDS:
            moveId = MoveId.EARTH_POWER;
            break;
          case BiomeId.DESERT:
            moveId = MoveId.SCORCHING_SANDS;
            break;
          case BiomeId.WASTELAND:
            moveId = MoveId.DRAGON_PULSE;
            break;
          case BiomeId.CONSTRUCTION_SITE:
            moveId = MoveId.STEEL_BEAM;
            break;
          case BiomeId.CAVE:
            moveId = MoveId.POWER_GEM;
            break;
          case BiomeId.ICE_CAVE:
            moveId = MoveId.ICE_BEAM;
            break;
          case BiomeId.SNOWY_FOREST:
            moveId = MoveId.FROST_BREATH;
            break;
          case BiomeId.VOLCANO:
            moveId = MoveId.LAVA_PLUME;
            break;
          case BiomeId.GRAVEYARD:
            moveId = MoveId.SHADOW_BALL;
            break;
          case BiomeId.RUINS:
            moveId = MoveId.ANCIENT_POWER;
            break;
          case BiomeId.TEMPLE:
            moveId = MoveId.EXTRASENSORY;
            break;
          case BiomeId.DOJO:
            moveId = MoveId.FOCUS_BLAST;
            break;
          case BiomeId.FAIRY_CAVE:
            moveId = MoveId.ALLURING_VOICE;
            break;
          case BiomeId.ABYSS:
            moveId = MoveId.OMINOUS_WIND;
            break;
          case BiomeId.SPACE:
            moveId = MoveId.DRACO_METEOR;
            break;
          case BiomeId.FACTORY:
            moveId = MoveId.FLASH_CANNON;
            break;
          case BiomeId.LABORATORY:
            moveId = MoveId.ZAP_CANNON;
            break;
          case BiomeId.POWER_PLANT:
            moveId = MoveId.CHARGE_BEAM;
            break;
          case BiomeId.END:
            moveId = MoveId.ETERNABEAM;
            break;
        }
        break;
      case TerrainType.MISTY:
        moveId = MoveId.MOONBLAST;
        break;
      case TerrainType.ELECTRIC:
        moveId = MoveId.THUNDERBOLT;
        break;
      case TerrainType.GRASSY:
        moveId = MoveId.ENERGY_BALL;
        break;
      case TerrainType.PSYCHIC:
        moveId = MoveId.PSYCHIC;
        break;
      default:
        // Just in case there's no match
        moveId = MoveId.TRI_ATTACK;
        break;
    }

    // Load the move's animation if we didn't already and unshift a new usage phase
    globalScene.phaseManager.unshiftNew("LoadMoveAnimPhase", moveId);
    globalScene.phaseManager.unshiftNew(
      "MovePhase",
      user,
      [target.getBattlerIndex()],
      new PokemonMove(moveId),
      MoveUseMode.FOLLOW_UP,
      MovePhaseTimingModifier.FIRST,
    );
    return true;
  }
}

/**
 * Attribute used to copy a previously-used move.
 * Used for {@linkcode MoveId.COPYCAT} and {@linkcode MoveId.MIRROR_MOVE}
 */
export class CopyMoveAttr extends CallMoveAttr {
  mirrorMove;
  constructor(mirrorMove, invalidMoves = new Set()) {
    super();
    this.mirrorMove = mirrorMove;
    this.invalidMoves = invalidMoves;
  }

  apply(user, target, _move, args) {
    this.hasTarget = this.mirrorMove;
    // bang is correct as condition func returns `false` and fails move if no last move exists
    const lastMove = this.mirrorMove
      ? target.getLastNonVirtualMove(false, false).move
      : globalScene.currentBattle.lastMove;
    return super.apply(user, target, allMoves[lastMove], args);
  }

  getCondition() {
    return (_user, target, _move) => {
      const lastMove = this.mirrorMove
        ? target.getLastNonVirtualMove(false, false)?.move
        : globalScene.currentBattle.lastMove;
      return lastMove != null && !this.invalidMoves.has(lastMove);
    };
  }
}

/**
 * Attribute used for moves that cause the target to repeat their last used move.
 *
 * Used by {@linkcode MoveId.INSTRUCT | Instruct}.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Instruct_(move) | Instruct on Bulbapedia}
 */
export class RepeatMoveAttr extends MoveEffectAttr {
  movesetMove;
  constructor() {
    super(false, { trigger: MoveEffectTrigger.POST_APPLY }); // needed to ensure correct protect interaction
  }

  /**
   * Forces the target to re-use their last used move again.
   * @param user - The {@linkcode Pokemon} using the attack
   * @param target - The {@linkcode Pokemon} being targeted by the attack
   * @returns `true` if the move succeeds
   */
  apply(user, target) {
    // get the last move used (excluding status based failures) as well as the corresponding moveset slot
    // bangs are justified as Instruct fails if no prior move or moveset move exists
    // TODO: How does instruct work when copying a move called via Copycat that the user itself knows?
    const lastMove = target.getLastNonVirtualMove();

    // If the last move used can hit more than one target or has variable targets,
    // re-compute the targets for the attack (mainly for alternating double/single battles)
    // Rampaging moves (e.g. Outrage) are not included due to being incompatible with Instruct,
    // nor is Dragon Darts (due to its smart targeting bypassing normal target selection)
    let moveTargets = this.movesetMove.getMove().isMultiTarget()
      ? getMoveTargets(target, this.movesetMove.moveId).targets
      : lastMove.targets;

    // In the event the instructed move's only target is a fainted opponent, redirect it to an alive ally if possible.
    // Normally, all yet-unexecuted move phases would swap targets after any foe faints or flees (see `redirectPokemonMoves` in `battle-scene.ts`),
    // but since Instruct adds a new move phase _after_ all that occurs, we need to handle this interaction manually.
    const firstTarget = globalScene.getField()[moveTargets[0]];
    if (
      globalScene.currentBattle.double
      && moveTargets.length === 1
      && firstTarget.isFainted()
      && firstTarget !== target.getAlly()
    ) {
      const ally = firstTarget.getAlly();
      if (ally?.isActive()) {
        moveTargets = [ally.getBattlerIndex()];
      }
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:instructingMove", {
        userPokemonName: getPokemonNameWithAffix(user),
        targetPokemonName: getPokemonNameWithAffix(target),
      }),
    );
    globalScene.phaseManager.unshiftNew(
      "MovePhase",
      target,
      moveTargets,
      this.movesetMove,
      MoveUseMode.NORMAL,
      MovePhaseTimingModifier.FIRST,
    );
    return true;
  }

  getCondition() {
    return (_user, target, _move) => {
      // TODO: Check instruct behavior with struggle - ignore, fail or success
      // TODO: How does instruct work when copying a move called via Copycat that the user itself knows?
      const lastMove = target.getLastNonVirtualMove();
      const movesetMove = target.getMoveset().find(m => m.moveId === lastMove?.move);

      if (!lastMove?.move || !movesetMove || movesetMove.isOutOfPp() || invalidInstructMoves.has(lastMove.move)) {
        return false;
      }

      this.movesetMove = movesetMove;
      return true;
    };
  }

  getTargetBenefitScore(_user, _target, _move) {
    // TODO: Make the AI actually use instruct
    /* Ideally, the AI would score instruct based on the scorings of the on-field pokemons'
     * last used moves at the time of using Instruct (by the time the instructor gets to act)
     * with respect to the user's side.
     * In 99.9% of cases, this would be the pokemon's ally (unless the target had last
     * used a move like Decorate on the user or its ally)
     */
    return 2;
  }
}

/**
 *  Attribute used for moves that reduce PP of the target's last used move.
 *  Used for Spite.
 */
export class ReducePpMoveAttr extends MoveEffectAttr {
  reduction;
  constructor(reduction) {
    super();
    this.reduction = reduction;
  }

  /**
   * Reduces the PP of the target's last-used move by an amount based on this attribute instance's {@linkcode reduction}.
   *
   * @param user - N/A
   * @param target - The {@linkcode Pokemon} targeted by the attack
   * @param move - N/A
   * @param args - N/A
   * @returns always `true`
   */
  apply(_user, target, _move, _args) {
    /** The last move the target themselves used */
    const lastMove = target.getLastNonVirtualMove();
    const movesetMove = target.getMoveset().find(m => m.moveId === lastMove?.move); // bang is correct as condition prevents this from being nullish
    const lastPpUsed = movesetMove.ppUsed;
    movesetMove.ppUsed = Math.min(lastPpUsed + this.reduction, movesetMove.getMovePp());

    globalScene.eventTarget.dispatchEvent(new MoveUsedEvent(target.id, movesetMove.getMove(), movesetMove.ppUsed));
    globalScene.phaseManager.queueMessage(
      i18next.t("battle:ppReduced", {
        targetName: getPokemonNameWithAffix(target),
        moveName: movesetMove.getName(),
        reduction: movesetMove.ppUsed - lastPpUsed,
      }),
    );

    return true;
  }

  getCondition() {
    return (_user, target, _move) => {
      const lastMove = target.getLastNonVirtualMove();
      const movesetMove = target.getMoveset().find(m => m.moveId === lastMove?.move);
      return !!movesetMove?.getPpRatio();
    };
  }

  getTargetBenefitScore(_user, target, _move) {
    const lastMove = target.getLastNonVirtualMove();
    const movesetMove = target.getMoveset().find(m => m.moveId === lastMove?.move);
    if (!movesetMove) {
      return 0;
    }

    const maxPp = movesetMove.getMovePp();
    const ppLeft = maxPp - movesetMove.ppUsed;
    const value = -(8 - Math.ceil(Math.min(maxPp, 30) / 5));
    if (ppLeft < 4) {
      return (value / 4) * ppLeft;
    }
    return value;
  }
}

/**
 *  Attribute used for moves that damage target, and then reduce PP of the target's last used move.
 *  Used for Eerie Spell.
 */
export class AttackReducePpMoveAttr extends ReducePpMoveAttr {
  /**
   * Checks if the target has used a move prior to the attack. PP-reduction is applied through the super class if so.
   *
   * @param user - The {@linkcode Pokemon} using the move
   * @param target -The {@linkcode Pokemon} targeted by the attack
   * @param move - The {@linkcode Move} being used
   * @param args - N/A
   * @returns - always `true`
   */
  apply(user, target, move, args) {
    const lastMove = target.getLastNonVirtualMove();
    const movesetMove = target.getMoveset().find(m => m.moveId === lastMove?.move);
    if (movesetMove?.getPpRatio()) {
      super.apply(user, target, move, args);
    }

    return true;
  }

  /**
   * condition function to always perform damage.
   * Instead, perform pp-reduction condition check in {@linkcode apply}.
   * (A failed condition will prevent damage which is not what we want here)
   * @returns always `true`
   */
  getCondition() {
    return () => true;
  }
}

const targetMoveCopiableCondition = (_user, target, _move) => {
  const copiableMove = target.getLastNonVirtualMove();
  if (!copiableMove?.move) {
    return false;
  }

  if (allMoves[copiableMove.move].isChargingMove() && copiableMove.result === MoveResult.OTHER) {
    return false;
  }

  // TODO: Add last turn of Bide

  return true;
};

/**
 * Attribute to temporarily copy the last move in the target's moveset.
 * Used by {@linkcode MoveId.MIMIC}.
 */
export class MovesetCopyMoveAttr extends OverrideMoveEffectAttr {
  apply(user, target, move, _args) {
    const lastMove = target.getLastNonVirtualMove();
    if (!lastMove?.move) {
      return false;
    }

    const copiedMove = allMoves[lastMove.move];

    const thisMoveIndex = user.getMoveset().findIndex(m => m.moveId === move.id);

    if (thisMoveIndex === -1) {
      return false;
    }

    // Populate summon data with a copy of the current moveset, replacing the copying move with the copied move
    user.summonData.moveset = user.getMoveset().slice(0);
    user.summonData.moveset[thisMoveIndex] = new PokemonMove(copiedMove.id);

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:copiedMove", { pokemonName: getPokemonNameWithAffix(user), moveName: copiedMove.name }),
    );

    return true;
  }

  getCondition() {
    return targetMoveCopiableCondition;
  }
}

/**
 * Attribute for {@linkcode MoveId.SKETCH} that causes the user to copy the opponent's last used move
 * This move copies the last used non-virtual move
 *  e.g. if Metronome is used, it copies Metronome itself, not the virtual move called by Metronome
 * Fails if the opponent has not yet used a move.
 * Fails if used on an uncopiable move, listed in unsketchableMoves in getCondition
 * Fails if the move is already in the user's moveset
 */
export class SketchAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }
  /**
   * User copies the opponent's last used move, if possible
   * @param user Pokemon that used the move and will replace Sketch with the copied move
   * @param target Pokemon that the user wants to copy a move from
   * @param move Move being used
   * @param args Unused
   * @returns true if the function succeeds, otherwise false
   */

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const targetMove = target.getLastNonVirtualMove();
    if (!targetMove) {
      return false;
    }

    const sketchedMove = allMoves[targetMove.move];
    const sketchIndex = user.getMoveset().findIndex(m => m.moveId === move.id);
    if (sketchIndex === -1) {
      return false;
    }

    user.setMove(sketchIndex, sketchedMove.id);

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:sketchedMove", {
        pokemonName: getPokemonNameWithAffix(user),
        moveName: sketchedMove.name,
      }),
    );

    return true;
  }

  getCondition() {
    return (user, target, move) => {
      if (!targetMoveCopiableCondition(user, target, move)) {
        return false;
      }

      const targetMove = target.getLastNonVirtualMove();
      return (
        targetMove != null
        && !invalidSketchMoves.has(targetMove.move)
        && user.getMoveset().every(m => m.moveId !== targetMove.move)
      );
    };
  }
}

export class AbilityChangeAttr extends MoveEffectAttr {
  ability;

  constructor(ability, selfTarget) {
    super(selfTarget);

    this.ability = ability;
  }

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const moveTarget = this.selfTarget ? user : target;

    globalScene.triggerPokemonFormChange(moveTarget, SpeciesFormChangeRevertWeatherFormTrigger);
    if (moveTarget.breakIllusion()) {
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:illusionBreak", { pokemonName: getPokemonNameWithAffix(moveTarget) }),
      );
    }
    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:acquiredAbility", {
        pokemonName: getPokemonNameWithAffix(moveTarget),
        abilityName: allAbilities[this.ability].name,
      }),
    );
    moveTarget.setTempAbility(allAbilities[this.ability]);
    globalScene.triggerPokemonFormChange(moveTarget, SpeciesFormChangeRevertWeatherFormTrigger);
    return true;
  }

  getCondition() {
    return (user, target, _move) =>
      (this.selfTarget ? user : target).getAbility().replaceable
      && (this.selfTarget ? user : target).getAbility().id !== this.ability;
  }
}

export class AbilityCopyAttr extends MoveEffectAttr {
  copyToPartner;

  constructor(copyToPartner = false) {
    super(false);

    this.copyToPartner = copyToPartner;
  }

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:copiedTargetAbility", {
        pokemonName: getPokemonNameWithAffix(user),
        targetName: getPokemonNameWithAffix(target),
        abilityName: allAbilities[target.getAbility().id].name,
      }),
    );

    user.setTempAbility(target.getAbility());
    const ally = user.getAlly();

    if (this.copyToPartner && globalScene.currentBattle?.double && ally != null && ally.hp) {
      // TODO is this the best way to check that the ally is active?
      globalScene.phaseManager.queueMessage(
        i18next.t("moveTriggers:copiedTargetAbility", {
          pokemonName: getPokemonNameWithAffix(ally),
          targetName: getPokemonNameWithAffix(target),
          abilityName: allAbilities[target.getAbility().id].name,
        }),
      );
      ally.setTempAbility(target.getAbility());
    }

    return true;
  }

  getCondition() {
    return (user, target, _move) => {
      const ally = user.getAlly();
      let ret = target.getAbility().copiable && user.getAbility().replaceable;
      if (this.copyToPartner && globalScene.currentBattle?.double) {
        ret = ret && (!ally?.hp || ally?.getAbility().replaceable);
      } else {
        ret = ret && user.getAbility().id !== target.getAbility().id;
      }
      return ret;
    };
  }
}

export class AbilityGiveAttr extends MoveEffectAttr {
  copyToPartner;

  constructor() {
    super(false);
  }

  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:acquiredAbility", {
        pokemonName: getPokemonNameWithAffix(target),
        abilityName: allAbilities[user.getAbility().id].name,
      }),
    );

    target.setTempAbility(user.getAbility());

    return true;
  }

  getCondition() {
    return (user, target, _move) =>
      user.getAbility().copiable && target.getAbility().replaceable && user.getAbility().id !== target.getAbility().id;
  }
}

export class SwitchAbilitiesAttr extends MoveEffectAttr {
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const tempAbility = user.getAbility();

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:swappedAbilitiesWithTarget", { pokemonName: getPokemonNameWithAffix(user) }),
    );

    user.setTempAbility(target.getAbility());
    target.setTempAbility(tempAbility);
    // Swaps Forecast/Flower Gift from Castform/Cherrim
    globalScene.arena.triggerWeatherBasedFormChangesToNormal();

    return true;
  }

  getCondition() {
    return (user, target, _move) => [user, target].every(pkmn => pkmn.getAbility().swappable);
  }
}

/**
 * Attribute used for moves that suppress abilities like {@linkcode MoveId.GASTRO_ACID}.
 * A suppressed ability cannot be activated.
 */
export class SuppressAbilitiesAttr extends MoveEffectAttr {
  /** Sets ability suppression for the target pokemon and displays a message. */
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:suppressAbilities", { pokemonName: getPokemonNameWithAffix(target) }),
    );

    target.suppressAbility();

    globalScene.arena.triggerWeatherBasedFormChangesToNormal();

    return true;
  }

  /** Causes the effect to fail when the target's ability is unsupressable or already suppressed. */
  getCondition() {
    return (_user, target, _move) =>
      !target.summonData.abilitySuppressed
      && (target.getAbility().suppressable || (target.hasPassive() && target.getPassiveAbility().suppressable));
  }
}

/**
 * Applies the effects of {@linkcode SuppressAbilitiesAttr} if the target has already moved this turn.
 * @see {@linkcode MoveId.CORE_ENFORCER}
 */
export class SuppressAbilitiesIfActedAttr extends MoveEffectAttr {
  /**
   * If the target has already acted this turn, apply a {@linkcode SuppressAbilitiesAttr} effect unless the
   * abillity cannot be suppressed. This is a secondary effect and has no bearing on the success or failure of the move.
   *
   * @returns True if the move occurred, otherwise false. Note that true will be returned even if the target has not
   * yet moved or if the suppression failed to apply.
   */
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    if (target.turnData.acted) {
      const suppressAttr = new SuppressAbilitiesAttr();
      if (suppressAttr.getCondition()(user, target, move)) {
        suppressAttr.apply(user, target, move, args);
      }
    }

    return true;
  }
}

/**
 * Attribute used to transform into the target on move use.
 *
 * Used for {@linkcode MoveId.TRANSFORM}.
 */
export class TransformAttr extends MoveEffectAttr {
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    globalScene.phaseManager.unshiftNew("PokemonTransformPhase", user.getBattlerIndex(), target.getBattlerIndex());
    return true;
  }

  getCondition() {
    return (user, target) => user.canTransformInto(target);
  }
}

/**
 * Attribute used for status moves, namely Speed Swap,
 * that swaps the user's and target's corresponding stats.
 */
export class SwapStatAttr extends MoveEffectAttr {
  /** The stat to be swapped between the user and the target */
  stat;

  constructor(stat) {
    super();

    this.stat = stat;
  }

  /**
   * Swaps the user's and target's corresponding current
   * {@linkcode EffectiveStat | stat} values
   * @param user the {@linkcode Pokemon} that used the move
   * @param target the {@linkcode Pokemon} that the move was used on
   * @param move N/A
   * @param args N/A
   * @returns true if attribute application succeeds
   */
  apply(user, target, move, args) {
    if (super.apply(user, target, move, args)) {
      const temp = user.getStat(this.stat, false);
      user.setStat(this.stat, target.getStat(this.stat, false), false);
      target.setStat(this.stat, temp, false);

      globalScene.phaseManager.queueMessage(
        i18next.t("moveTriggers:switchedStat", {
          pokemonName: getPokemonNameWithAffix(user),
          stat: i18next.t(getStatKey(this.stat)),
        }),
      );

      return true;
    }
    return false;
  }
}

/**
 * Attribute used to switch the user's own stats.
 * Used by Power Shift.
 */
export class ShiftStatAttr extends MoveEffectAttr {
  statToSwitch;
  statToSwitchWith;

  constructor(statToSwitch, statToSwitchWith) {
    super();

    this.statToSwitch = statToSwitch;
    this.statToSwitchWith = statToSwitchWith;
  }

  /**
   * Switches the user's stats based on the {@linkcode statToSwitch} and {@linkcode statToSwitchWith} attributes.
   * @param user the {@linkcode Pokemon} that used the move
   * @param target n/a
   * @param move n/a
   * @param args n/a
   * @returns whether the effect was applied
   */
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const firstStat = user.getStat(this.statToSwitch, false);
    const secondStat = user.getStat(this.statToSwitchWith, false);

    user.setStat(this.statToSwitch, secondStat, false);
    user.setStat(this.statToSwitchWith, firstStat, false);

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:shiftedStats", {
        pokemonName: getPokemonNameWithAffix(user),
        statToSwitch: i18next.t(getStatKey(this.statToSwitch)),
        statToSwitchWith: i18next.t(getStatKey(this.statToSwitchWith)),
      }),
    );

    return true;
  }

  /**
   * Encourages the user to use the move if the stat to switch with is greater than the stat to switch.
   * @param user the {@linkcode Pokemon} that used the move
   * @param target n/a
   * @param move n/a
   * @returns number of points to add to the user's benefit score
   */
  getUserBenefitScore(user, _target, _move) {
    return user.getStat(this.statToSwitchWith, false) > user.getStat(this.statToSwitch, false) ? 10 : 0;
  }
}

/**
 * Attribute used for status moves, namely Power Split and Guard Split,
 * that take the average of a user's and target's corresponding
 * stats and assign that average back to each corresponding stat.
 */
export class AverageStatsAttr extends MoveEffectAttr {
  /** The stats to be averaged individually between the user and the target */
  stats;
  msgKey;

  constructor(stats, msgKey) {
    super();

    this.stats = stats;
    this.msgKey = msgKey;
  }

  /**
   * Takes the average of the user's and target's corresponding {@linkcode stat}
   * values and sets those stats to the corresponding average for both
   * temporarily.
   * @param user the {@linkcode Pokemon} that used the move
   * @param target the {@linkcode Pokemon} that the move was used on
   * @param move N/A
   * @param args N/A
   * @returns true if attribute application succeeds
   */
  apply(user, target, move, args) {
    if (super.apply(user, target, move, args)) {
      for (const s of this.stats) {
        const avg = Math.floor((user.getStat(s, false) + target.getStat(s, false)) / 2);

        user.setStat(s, avg, false);
        target.setStat(s, avg, false);
      }

      globalScene.phaseManager.queueMessage(i18next.t(this.msgKey, { pokemonName: getPokemonNameWithAffix(user) }));

      return true;
    }
    return false;
  }
}

export class MoneyAttr extends MoveEffectAttr {
  constructor() {
    super(true, { firstHitOnly: true });
  }

  apply(_user, _target, _move) {
    globalScene.currentBattle.moneyScattered += globalScene.getWaveMoneyAmount(0.2);
    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:coinsScatteredEverywhere"));
    return true;
  }
}

/** Applies {@linkcode BattlerTagType.DESTINY_BOND} to the user */
export class DestinyBondAttr extends MoveEffectAttr {
  constructor() {
    super(true, { trigger: MoveEffectTrigger.PRE_APPLY });
  }

  /**
   * Applies {@linkcode BattlerTagType.DESTINY_BOND} to the user.
   * @param user {@linkcode Pokemon} that is having the tag applied to.
   * @param target {@linkcode Pokemon} N/A
   * @param move {@linkcode Move} {@linkcode Move.DESTINY_BOND}
   * @param args N/A
   * @returns true
   */
  apply(user, _target, move, _args) {
    globalScene.phaseManager.queueMessage(
      `${i18next.t("moveTriggers:tryingToTakeFoeDown", { pokemonName: getPokemonNameWithAffix(user) })}`,
    );
    user.addTag(BattlerTagType.DESTINY_BOND, undefined, move.id, user.id);
    return true;
  }
}

/** Attribute to apply a battler tag to the target if they have had their stats boosted this turn */
export class AddBattlerTagIfBoostedAttr extends AddBattlerTagAttr {
  constructor(tag) {
    super(tag, false, false, 2, 5);
  }

  /**
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @param args N/A
   * @returns true
   */
  apply(user, target, move, args) {
    if (target.turnData.statStagesIncreased) {
      super.apply(user, target, move, args);
    }
    return true;
  }
}

/**
 * Attribute to apply a status effect to the target if they have had their stats boosted this turn.
 */
export class StatusIfBoostedAttr extends MoveEffectAttr {
  effect;

  constructor(effect) {
    super(true);
    this.effect = effect;
  }

  /**
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} N/A
   * @param args N/A
   * @returns true
   */
  apply(user, target, _move, _args) {
    if (target.turnData.statStagesIncreased) {
      target.trySetStatus(this.effect, user);
    }
    return true;
  }
}

export class VariableTargetAttr extends MoveAttr {
  targetChangeFunc;

  constructor(targetChange) {
    super();

    this.targetChangeFunc = targetChange;
  }

  apply(user, target, move, args) {
    const targetVal = args[0];
    targetVal.value = this.targetChangeFunc(user, target, move);
    return true;
  }
}

/**
 * Attribute to cause the target to move immediately after the user.
 *
 * Used by {@linkcode MoveId.AFTER_YOU}.
 */
export class AfterYouAttr extends MoveEffectAttr {
  /**
   * Cause the target of this move to act right after the user.
   * @param user - Unused
   * @param target - The {@linkcode Pokemon} targeted by this move
   * @param _move - Unused
   * @param _args - Unused
   * @returns `true`
   */
  apply(_user, target, _move, _args) {
    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:afterYou", { targetName: getPokemonNameWithAffix(target) }),
    );
    globalScene.phaseManager.forceMoveNext((phase) => phase.pokemon === target);

    return true;
  }
}

/**
 * Move effect to force the target to move last, ignoring priority.
 * If applied to multiple targets, they move in speed order after all other moves.
 */
export class ForceLastAttr extends MoveEffectAttr {
  /**
   * Forces the target of this move to move last.
   *
   * @param user {@linkcode Pokemon} that is using the move.
   * @param target {@linkcode Pokemon} that will be forced to move last.
   * @param move {@linkcode Move} {@linkcode MoveId.QUASH}
   * @param _args N/A
   * @returns true
   */
  apply(_user, target, _move, _args) {
    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:forceLast", { targetPokemonName: getPokemonNameWithAffix(target) }),
    );

    globalScene.phaseManager.forceMoveLast((phase) => phase.pokemon === target);
    return true;
  }
}

const failOnBossCondition = (_user, target, _move) => !target.isBossImmune();

const failIfLastCondition = () => globalScene.phaseManager.hasPhaseOfType("MovePhase");

const failIfLastInPartyCondition = (user, _target, _move) => {
  const party = user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
  return party.some(pokemon => pokemon.isActive() && !pokemon.isOnField());
};

const failIfGhostTypeCondition = (_user, target, _move) =>
  !target.isOfType(PokemonType.GHOST);

const failIfNoTargetHeldItemsCondition = (_user, target, _move) =>
  target.getHeldItems().filter(i => i.isTransferable)?.length > 0;

const attackedByItemMessageFunc = (_user, target, _move) => {
  if (target == null) {
    // Fix bug when used against targets that have both fainted
    return "";
  }
  const heldItems = target.getHeldItems().filter(i => i.isTransferable);
  if (heldItems.length === 0) {
    return "";
  }
  const itemName = heldItems[0]?.type?.name ?? "item";
  const message = i18next.t("moveTriggers:attackedByItem", {
    pokemonName: getPokemonNameWithAffix(target),
    itemName,
  });
  return message;
};

/**
 * Attribute used for Conversion 2, to convert the user's type to a random type that resists the target's last used move.
 */
// TODO: If a move has its type changed (e.g. Hidden Power), it should check the new type.
// TODO: Does not fail when it should
export class ResistLastMoveTypeAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  /**
   * User changes its type to a random type that resists the target's last used move
   * @param user Pokemon that used the move and will change types
   * @param target Opposing pokemon that recently used a move
   * @param move Move being used
   * @param args Unused
   * @returns true if the function succeeds
   */
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    // TODO: Confirm how this interacts with status-induced failures and called moves
    const targetMove = target.getLastXMoves(1)[0]; // target's most recent move
    if (!targetMove) {
      return false;
    }

    const moveData = allMoves[targetMove.move];
    if (moveData.type === PokemonType.STELLAR || moveData.type === PokemonType.UNKNOWN) {
      return false;
    }
    const validTypes = this.getTypeResistances(user, moveData.type);
    if (validTypes.length === 0) {
      return false;
    }
    const type = validTypes[user.randBattleSeedInt(validTypes.length)];
    user.summonData.types = [type];
    globalScene.phaseManager.queueMessage(
      i18next.t("battle:transformedIntoType", {
        pokemonName: getPokemonNameWithAffix(user),
        type: toTitleCase(PokemonType[type]),
      }),
    );
    user.updateInfo();

    return true;
  }

  /**
   * Retrieve the types resisting a given type. Used by Conversion 2
   * @param moveType - The type of the move having been used
   * @returns An array containing all types that resist the given move's type
   * and are not currently shared by the user
   */
  getTypeResistances(user, moveType) {
    const resistances = [];
    const userTypes = user.getTypes(true, true);

    for (const type of getEnumValues(PokemonType)) {
      if (userTypes.includes(type)) {
        continue;
      }
      const multiplier = getTypeDamageMultiplier(moveType, type);
      if (multiplier < 1) {
        resistances.push(type);
      }
    }

    return resistances;
  }

  getCondition() {
    // TODO: Does this count dancer?
    return (_user, target, _move) => {
      return target.getLastXMoves(-1).some(tm => tm.move !== MoveId.NONE);
    };
  }
}

/**
 * Drops the target's immunity to types it is immune to
 * and makes its evasiveness be ignored during accuracy
 * checks. Used by: {@linkcode MoveId.ODOR_SLEUTH | Odor Sleuth}, {@linkcode MoveId.MIRACLE_EYE | Miracle Eye} and {@linkcode MoveId.FORESIGHT | Foresight}
 */
export class ExposedMoveAttr extends AddBattlerTagAttr {
  constructor(tagType) {
    super(tagType, false, true);
  }

  /**
   * Applies {@linkcode ExposedTag} to the target.
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @param args N/A
   * @returns `true` if the function succeeds
   */
  apply(user, target, move, args) {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:exposedMove", {
        pokemonName: getPokemonNameWithAffix(user),
        targetPokemonName: getPokemonNameWithAffix(target),
      }),
    );

    return true;
  }
}

/**
 * Map of Move attributes to their respective classes. Used for instanceof checks.
 */
const MoveAttrs = Object.freeze({
  MoveEffectAttr,
  MoveHeaderAttr,
  MessageHeaderAttr,
  AddBattlerTagAttr,
  AddBattlerTagHeaderAttr,
  BeakBlastHeaderAttr,
  PreMoveMessageAttr,
  PreUseInterruptAttr,
  RespectAttackTypeImmunityAttr,
  IgnoreOpponentStatStagesAttr,
  HighCritAttr,
  CritOnlyAttr,
  FixedDamageAttr,
  UserHpDamageAttr,
  TargetHalfHpDamageAttr,
  MatchHpAttr,
  CounterDamageAttr,
  CounterRedirectAttr,
  LevelDamageAttr,
  RandomLevelDamageAttr,
  ModifiedDamageAttr,
  SurviveDamageAttr,
  RecoilAttr,
  SacrificialAttr,
  SacrificialAttrOnHit,
  HalfSacrificialAttr,
  AddSubstituteAttr,
  HealAttr,
  PartyStatusCureAttr,
  FlameBurstAttr,
  SacrificialFullRestoreAttr,
  IgnoreWeatherTypeDebuffAttr,
  WeatherHealAttr,
  PlantHealAttr,
  SandHealAttr,
  BoostHealAttr,
  HealOnAllyAttr,
  HitHealAttr,
  IncrementMovePriorityAttr,
  MultiHitAttr,
  ChangeMultiHitTypeAttr,
  WaterShurikenMultiHitTypeAttr,
  StatusEffectAttr,
  MultiStatusEffectAttr,
  PsychoShiftEffectAttr,
  StealHeldItemChanceAttr,
  RemoveHeldItemAttr,
  EatBerryAttr,
  StealEatBerryAttr,
  HealStatusEffectAttr,
  BypassSleepAttr,
  BypassBurnDamageReductionAttr,
  WeatherChangeAttr,
  ClearWeatherAttr,
  TerrainChangeAttr,
  ClearTerrainAttr,
  OneHitKOAttr,
  InstantChargeAttr,
  WeatherInstantChargeAttr,
  OverrideMoveEffectAttr,
  DelayedAttackAttr,
  AwaitCombinedPledgeAttr,
  StatStageChangeAttr,
  SecretPowerAttr,
  PostVictoryStatStageChangeAttr,
  AcupressureStatStageChangeAttr,
  GrowthStatStageChangeAttr,
  CutHpStatStageBoostAttr,
  CopyStatsAttr,
  InvertStatsAttr,
  ResetStatsAttr,
  SwapStatStagesAttr,
  HpSplitAttr,
  VariablePowerAttr,
  LessPPMorePowerAttr,
  MovePowerMultiplierAttr,
  BeatUpAttr,
  DoublePowerChanceAttr,
  ConsecutiveUsePowerMultiplierAttr,
  ConsecutiveUseDoublePowerAttr,
  ConsecutiveUseMultiBasePowerAttr,
  WeightPowerAttr,
  ElectroBallPowerAttr,
  GyroBallPowerAttr,
  LowHpPowerAttr,
  CompareWeightPowerAttr,
  HpPowerAttr,
  OpponentHighHpPowerAttr,
  TurnDamagedDoublePowerAttr,
  MagnitudePowerAttr,
  AntiSunlightPowerDecreaseAttr,
  FriendshipPowerAttr,
  RageFistPowerAttr,
  PositiveStatStagePowerAttr,
  PunishmentPowerAttr,
  PresentPowerAttr,
  WaterShurikenPowerAttr,
  SpitUpPowerAttr,
  SwallowHealAttr,
  MultiHitPowerIncrementAttr,
  LastMoveDoublePowerAttr,
  CombinedPledgePowerAttr,
  CombinedPledgeStabBoostAttr,
  RoundPowerAttr,
  CueNextRoundAttr,
  StatChangeBeforeDmgCalcAttr,
  SpectralThiefAttr,
  VariableAtkAttr,
  TargetAtkUserAtkAttr,
  DefAtkAttr,
  VariableDefAttr,
  DefDefAttr,
  VariableAccuracyAttr,
  ThunderAccuracyAttr,
  StormAccuracyAttr,
  AlwaysHitMinimizeAttr,
  ToxicAccuracyAttr,
  BlizzardAccuracyAttr,
  VariableMoveCategoryAttr,
  PhotonGeyserCategoryAttr,
  TeraMoveCategoryAttr,
  TeraBlastPowerAttr,
  StatusCategoryOnAllyAttr,
  ShellSideArmCategoryAttr,
  VariableMoveTypeAttr,
  FormChangeItemTypeAttr,
  TechnoBlastTypeAttr,
  AuraWheelTypeAttr,
  RagingBullTypeAttr,
  IvyCudgelTypeAttr,
  WeatherBallTypeAttr,
  TerrainPulseTypeAttr,
  HiddenPowerTypeAttr,
  TeraBlastTypeAttr,
  TeraStarstormTypeAttr,
  MatchUserTypeAttr,
  CombinedPledgeTypeAttr,
  NeutralDamageAgainstFlyingTypeAttr,
  IceNoEffectTypeAttr,
  FlyingTypeMultiplierAttr,
  MoveTypeChartOverrideAttr,
  FreezeDryAttr,
  OneHitKOAccuracyAttr,
  HitsSameTypeAttr,
  SheerColdAccuracyAttr,
  MissEffectAttr,
  NoEffectAttr,
  TypelessAttr,
  BypassRedirectAttr,
  FrenzyAttr,
  SemiInvulnerableAttr,
  LeechSeedAttr,
  FallDownAttr,
  GulpMissileTagAttr,
  JawLockAttr,
  CurseAttr,
  RemoveBattlerTagAttr,
  FlinchAttr,
  ConfuseAttr,
  RechargeAttr,
  TrapAttr,
  ProtectAttr,
  MessageAttr,
  RemoveAllSubstitutesAttr,
  HitsTagAttr,
  HitsTagForDoubleDamageAttr,
  AddArenaTagAttr,
  RemoveArenaTagsAttr,
  AddArenaTrapTagAttr,
  AddArenaTrapTagHitAttr,
  RemoveArenaTrapAttr,
  RemoveScreensAttr,
  SwapArenaTagsAttr,
  AddPledgeEffectAttr,
  RevivalBlessingAttr,
  ForceSwitchOutAttr,
  ChillyReceptionAttr,
  RemoveTypeAttr,
  CopyTypeAttr,
  CopyBiomeTypeAttr,
  ChangeTypeAttr,
  AddTypeAttr,
  FirstMoveTypeAttr,
  CallMoveAttr,
  RandomMoveAttr,
  RandomMovesetMoveAttr,
  NaturePowerAttr,
  CopyMoveAttr,
  RepeatMoveAttr,
  ReducePpMoveAttr,
  AttackReducePpMoveAttr,
  MovesetCopyMoveAttr,
  SketchAttr,
  AbilityChangeAttr,
  AbilityCopyAttr,
  AbilityGiveAttr,
  SwitchAbilitiesAttr,
  SuppressAbilitiesAttr,
  TransformAttr,
  SwapStatAttr,
  ShiftStatAttr,
  AverageStatsAttr,
  MoneyAttr,
  DestinyBondAttr,
  AddBattlerTagIfBoostedAttr,
  StatusIfBoostedAttr,
  VariableTargetAttr,
  AfterYouAttr,
  ForceLastAttr,
  ResistLastMoveTypeAttr,
  ExposedMoveAttr,
});
export function initMoves() {
  allMoves.push(
    new SelfStatusMove(MoveId.NONE, PokemonType.NORMAL, MoveCategory.STATUS, -1, -1, 0, 1),
    new AttackMove(MoveId.POUND, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, -1, 0, 1),
    new AttackMove(MoveId.KARATE_CHOP, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 50, 100, 25, -1, 0, 1) //
      .attr(HighCritAttr),
    new AttackMove(MoveId.DOUBLE_SLAP, PokemonType.NORMAL, MoveCategory.PHYSICAL, 15, 85, 10, -1, 0, 1) //
      .attr(MultiHitAttr),
    new AttackMove(MoveId.COMET_PUNCH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 18, 85, 15, -1, 0, 1)
      .attr(MultiHitAttr)
      .punchingMove(),
    new AttackMove(MoveId.MEGA_PUNCH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 80, 85, 20, -1, 0, 1) //
      .punchingMove(),
    new AttackMove(MoveId.PAY_DAY, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 20, -1, 0, 1)
      .attr(MoneyAttr)
      .makesContact(false),
    new AttackMove(MoveId.FIRE_PUNCH, PokemonType.FIRE, MoveCategory.PHYSICAL, 75, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .punchingMove(),
    new AttackMove(MoveId.ICE_PUNCH, PokemonType.ICE, MoveCategory.PHYSICAL, 75, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .punchingMove(),
    new AttackMove(MoveId.THUNDER_PUNCH, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 75, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .punchingMove(),
    new AttackMove(MoveId.SCRATCH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, -1, 0, 1),
    new AttackMove(MoveId.VISE_GRIP, PokemonType.NORMAL, MoveCategory.PHYSICAL, 55, 100, 30, -1, 0, 1),
    new AttackMove(MoveId.GUILLOTINE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 250, 30, 5, -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr),
    new ChargingAttackMove(MoveId.RAZOR_WIND, PokemonType.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 1)
      .chargeText(i18next.t("moveTriggers:whippedUpAWhirlwind", { pokemonName: "{USER}" }))
      .attr(HighCritAttr)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(MoveId.SWORDS_DANCE, PokemonType.NORMAL, -1, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [Stat.ATK], 2, true)
      .danceMove(),
    new AttackMove(MoveId.CUT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 50, 95, 30, -1, 0, 1) //
      .slicingMove(),
    new AttackMove(MoveId.GUST, PokemonType.FLYING, MoveCategory.SPECIAL, 40, 100, 35, -1, 0, 1)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.FLYING)
      .windMove(),
    new AttackMove(MoveId.WING_ATTACK, PokemonType.FLYING, MoveCategory.PHYSICAL, 60, 100, 35, -1, 0, 1),
    new StatusMove(MoveId.WHIRLWIND, PokemonType.NORMAL, -1, 20, -1, -6, 1)
      .attr(ForceSwitchOutAttr, false, SwitchType.FORCE_SWITCH)
      .ignoresSubstitute()
      .hidesTarget()
      .windMove()
      .reflectable(),
    new ChargingAttackMove(MoveId.FLY, PokemonType.FLYING, MoveCategory.PHYSICAL, 90, 95, 15, -1, 0, 1)
      .chargeText(i18next.t("moveTriggers:flewUpHigh", { pokemonName: "{USER}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.FLYING)
      .affectedByGravity(),
    new AttackMove(MoveId.BIND, PokemonType.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, -1, 0, 1) //
      .attr(TrapAttr, BattlerTagType.BIND),
    new AttackMove(MoveId.SLAM, PokemonType.NORMAL, MoveCategory.PHYSICAL, 80, 75, 20, -1, 0, 1),
    new AttackMove(MoveId.VINE_WHIP, PokemonType.GRASS, MoveCategory.PHYSICAL, 45, 100, 25, -1, 0, 1),
    new AttackMove(MoveId.STOMP, PokemonType.NORMAL, MoveCategory.PHYSICAL, 65, 100, 20, 30, 0, 1)
      .attr(AlwaysHitMinimizeAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED)
      .attr(FlinchAttr),
    new AttackMove(MoveId.DOUBLE_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 30, 100, 30, -1, 0, 1) //
      .attr(MultiHitAttr, MultiHitType.TWO),
    new AttackMove(MoveId.MEGA_KICK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 120, 75, 5, -1, 0, 1),
    new AttackMove(MoveId.JUMP_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 95, 10, -1, 0, 1)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .affectedByGravity()
      .recklessMove(),
    new AttackMove(MoveId.ROLLING_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 60, 85, 15, 30, 0, 1) //
      .attr(FlinchAttr),
    new StatusMove(MoveId.SAND_ATTACK, PokemonType.GROUND, 100, 15, -1, 0, 1)
      .attr(StatStageChangeAttr, [Stat.ACC], -1)
      .reflectable(),
    new AttackMove(MoveId.HEADBUTT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 15, 30, 0, 1) //
      .attr(FlinchAttr),
    new AttackMove(MoveId.HORN_ATTACK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 65, 100, 25, -1, 0, 1),
    new AttackMove(MoveId.FURY_ATTACK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, -1, 0, 1) //
      .attr(MultiHitAttr),
    new AttackMove(MoveId.HORN_DRILL, PokemonType.NORMAL, MoveCategory.PHYSICAL, 250, 30, 5, -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr),
    new AttackMove(MoveId.TACKLE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, -1, 0, 1),
    new AttackMove(MoveId.BODY_SLAM, PokemonType.NORMAL, MoveCategory.PHYSICAL, 85, 100, 15, 30, 0, 1)
      .attr(AlwaysHitMinimizeAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(MoveId.WRAP, PokemonType.NORMAL, MoveCategory.PHYSICAL, 15, 90, 20, -1, 0, 1) //
      .attr(TrapAttr, BattlerTagType.WRAP),
    new AttackMove(MoveId.TAKE_DOWN, PokemonType.NORMAL, MoveCategory.PHYSICAL, 90, 85, 20, -1, 0, 1)
      .attr(RecoilAttr)
      .recklessMove(),
    new AttackMove(MoveId.THRASH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 1)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(NoEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new AttackMove(MoveId.DOUBLE_EDGE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 1)
      .attr(RecoilAttr, false, 0.33)
      .recklessMove(),
    new StatusMove(MoveId.TAIL_WHIP, PokemonType.NORMAL, 100, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [Stat.DEF], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(MoveId.POISON_STING, PokemonType.POISON, MoveCategory.PHYSICAL, 15, 100, 35, 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(MoveId.TWINEEDLE, PokemonType.BUG, MoveCategory.PHYSICAL, 25, 100, 20, 20, 0, 1)
      .attr(MultiHitAttr, MultiHitType.TWO)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(MoveId.PIN_MISSILE, PokemonType.BUG, MoveCategory.PHYSICAL, 25, 95, 20, -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false),
    new StatusMove(MoveId.LEER, PokemonType.NORMAL, 100, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [Stat.DEF], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(MoveId.BITE, PokemonType.DARK, MoveCategory.PHYSICAL, 60, 100, 25, 30, 0, 1)
      .attr(FlinchAttr)
      .bitingMove(),
    new StatusMove(MoveId.GROWL, PokemonType.NORMAL, 100, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [Stat.ATK], -1)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new StatusMove(MoveId.ROAR, PokemonType.NORMAL, -1, 20, -1, -6, 1)
      .attr(ForceSwitchOutAttr, false, SwitchType.FORCE_SWITCH)
      .soundBased()
      .hidesTarget()
      .reflectable(),
    new StatusMove(MoveId.SING, PokemonType.NORMAL, 55, 15, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased()
      .reflectable(),
    new StatusMove(MoveId.SUPERSONIC, PokemonType.NORMAL, 55, 20, -1, 0, 1)
      .attr(ConfuseAttr)
      .soundBased()
      .reflectable(),
    new AttackMove(MoveId.SONIC_BOOM, PokemonType.NORMAL, MoveCategory.SPECIAL, -1, 90, 20, -1, 0, 1) //
      .attr(FixedDamageAttr, 20),
    new StatusMove(MoveId.DISABLE, PokemonType.NORMAL, 100, 20, -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.DISABLED, false, true)
      .condition((_user, target, _move) => {
        const lastNonVirtualMove = target.getLastNonVirtualMove();
        return lastNonVirtualMove != null && lastNonVirtualMove.move !== MoveId.STRUGGLE;
      })
      .ignoresSubstitute()
      .reflectable(),
    new AttackMove(MoveId.ACID, PokemonType.POISON, MoveCategory.SPECIAL, 40, 100, 30, 10, 0, 1)
      .attr(StatStageChangeAttr, [Stat.SPDEF], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.EMBER, PokemonType.FIRE, MoveCategory.SPECIAL, 40, 100, 25, 10, 0, 1) //
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(MoveId.FLAMETHROWER, PokemonType.FIRE, MoveCategory.SPECIAL, 90, 100, 15, 10, 0, 1) //
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(MoveId.MIST, PokemonType.ICE, -1, 30, -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.MIST, 5, true)
      .target(MoveTarget.USER_SIDE),
    new AttackMove(MoveId.WATER_GUN, PokemonType.WATER, MoveCategory.SPECIAL, 40, 100, 25, -1, 0, 1),
    new AttackMove(MoveId.HYDRO_PUMP, PokemonType.WATER, MoveCategory.SPECIAL, 110, 80, 5, -1, 0, 1),
    new AttackMove(MoveId.SURF, PokemonType.WATER, MoveCategory.SPECIAL, 90, 100, 15, -1, 0, 1)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.UNDERWATER)
      .attr(GulpMissileTagAttr),
    new AttackMove(MoveId.ICE_BEAM, PokemonType.ICE, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 1) //
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(MoveId.BLIZZARD, PokemonType.ICE, MoveCategory.SPECIAL, 110, 70, 5, 10, 0, 1)
      .attr(BlizzardAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.PSYBEAM, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 65, 100, 20, 10, 0, 1) //
      .attr(ConfuseAttr),
    new AttackMove(MoveId.BUBBLE_BEAM, PokemonType.WATER, MoveCategory.SPECIAL, 65, 100, 20, 10, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.SPD], -1),
    new AttackMove(MoveId.AURORA_BEAM, PokemonType.ICE, MoveCategory.SPECIAL, 65, 100, 20, 10, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.ATK], -1),
    new AttackMove(MoveId.HYPER_BEAM, PokemonType.NORMAL, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 1) //
      .attr(RechargeAttr),
    new AttackMove(MoveId.PECK, PokemonType.FLYING, MoveCategory.PHYSICAL, 35, 100, 35, -1, 0, 1),
    new AttackMove(MoveId.DRILL_PECK, PokemonType.FLYING, MoveCategory.PHYSICAL, 80, 100, 20, -1, 0, 1),
    new AttackMove(MoveId.SUBMISSION, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 80, 80, 20, -1, 0, 1)
      .attr(RecoilAttr)
      .recklessMove(),
    new AttackMove(MoveId.LOW_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 1) //
      .attr(WeightPowerAttr),
    new AttackMove(MoveId.COUNTER, PokemonType.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, -1, -5, 1)
      .attr(CounterDamageAttr, 2, MoveCategory.PHYSICAL)
      .attr(CounterRedirectAttr, MoveCategory.PHYSICAL)
      .condition(counterAttackConditionPhysical, 3)
      .target(MoveTarget.ATTACKER),
    new AttackMove(MoveId.SEISMIC_TOSS, PokemonType.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 1) //
      .attr(LevelDamageAttr),
    new AttackMove(MoveId.STRENGTH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 1),
    new AttackMove(MoveId.ABSORB, PokemonType.GRASS, MoveCategory.SPECIAL, 20, 100, 25, -1, 0, 1)
      .attr(HitHealAttr)
      .triageMove(),
    new AttackMove(MoveId.MEGA_DRAIN, PokemonType.GRASS, MoveCategory.SPECIAL, 40, 100, 15, -1, 0, 1)
      .attr(HitHealAttr)
      .triageMove(),
    new StatusMove(MoveId.LEECH_SEED, PokemonType.GRASS, 90, 10, -1, 0, 1)
      .attr(LeechSeedAttr)
      .condition((_user, target, _move) => !target.getTag(BattlerTagType.SEEDED) && !target.isOfType(PokemonType.GRASS))
      .reflectable(),
    new SelfStatusMove(MoveId.GROWTH, PokemonType.NORMAL, -1, 20, -1, 0, 1) //
      .attr(GrowthStatStageChangeAttr),
    new AttackMove(MoveId.RAZOR_LEAF, PokemonType.GRASS, MoveCategory.PHYSICAL, 55, 95, 25, -1, 0, 1)
      .attr(HighCritAttr)
      .makesContact(false)
      .slicingMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new ChargingAttackMove(MoveId.SOLAR_BEAM, PokemonType.GRASS, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 1)
      .chargeText(i18next.t("moveTriggers:tookInSunlight", { pokemonName: "{USER}" }))
      .chargeAttr(WeatherInstantChargeAttr, [WeatherType.SUNNY, WeatherType.HARSH_SUN])
      .attr(AntiSunlightPowerDecreaseAttr),
    new StatusMove(MoveId.POISON_POWDER, PokemonType.POISON, 75, 35, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .powderMove()
      .reflectable(),
    new StatusMove(MoveId.STUN_SPORE, PokemonType.GRASS, 75, 30, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .powderMove()
      .reflectable(),
    new StatusMove(MoveId.SLEEP_POWDER, PokemonType.GRASS, 75, 15, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .powderMove()
      .reflectable(),
    new AttackMove(MoveId.PETAL_DANCE, PokemonType.GRASS, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 1)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(NoEffectAttr, frenzyMissFunc)
      .makesContact()
      .danceMove()
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(MoveId.STRING_SHOT, PokemonType.BUG, 95, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [Stat.SPD], -2)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(MoveId.DRAGON_RAGE, PokemonType.DRAGON, MoveCategory.SPECIAL, -1, 100, 10, -1, 0, 1) //
      .attr(FixedDamageAttr, 40),
    new AttackMove(MoveId.FIRE_SPIN, PokemonType.FIRE, MoveCategory.SPECIAL, 35, 85, 15, -1, 0, 1) //
      .attr(TrapAttr, BattlerTagType.FIRE_SPIN),
    new AttackMove(MoveId.THUNDER_SHOCK, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 40, 100, 30, 10, 0, 1) //
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(MoveId.THUNDERBOLT, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 90, 100, 15, 10, 0, 1) //
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new StatusMove(MoveId.THUNDER_WAVE, PokemonType.ELECTRIC, 90, 20, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(RespectAttackTypeImmunityAttr)
      .reflectable(),
    new AttackMove(MoveId.THUNDER, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 110, 70, 10, 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(ThunderAccuracyAttr)
      .attr(HitsTagAttr, BattlerTagType.FLYING),
    new AttackMove(MoveId.ROCK_THROW, PokemonType.ROCK, MoveCategory.PHYSICAL, 50, 90, 15, -1, 0, 1) //
      .makesContact(false),
    new AttackMove(MoveId.EARTHQUAKE, PokemonType.GROUND, MoveCategory.PHYSICAL, 100, 100, 10, -1, 0, 1)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.UNDERGROUND)
      .attr(MovePowerMultiplierAttr, (_user, target, _move) =>
        globalScene.arena.terrainType === TerrainType.GRASSY && target.isGrounded() ? 0.5 : 1,
      )
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.FISSURE, PokemonType.GROUND, MoveCategory.PHYSICAL, 250, 30, 5, -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr)
      .attr(HitsTagAttr, BattlerTagType.UNDERGROUND)
      .makesContact(false),
    new ChargingAttackMove(MoveId.DIG, PokemonType.GROUND, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 1)
      .chargeText(i18next.t("moveTriggers:dugAHole", { pokemonName: "{USER}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.UNDERGROUND),
    new StatusMove(MoveId.TOXIC, PokemonType.POISON, 90, 10, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
      .attr(ToxicAccuracyAttr)
      .reflectable(),
    new AttackMove(MoveId.CONFUSION, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 50, 100, 25, 10, 0, 1) //
      .attr(ConfuseAttr),
    new AttackMove(MoveId.PSYCHIC, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.SPDEF], -1),
    new StatusMove(MoveId.HYPNOSIS, PokemonType.PSYCHIC, 60, 20, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .reflectable(),
    new SelfStatusMove(MoveId.MEDITATE, PokemonType.PSYCHIC, -1, 40, -1, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.ATK], 1, true),
    new SelfStatusMove(MoveId.AGILITY, PokemonType.PSYCHIC, -1, 30, -1, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.SPD], 2, true),
    new AttackMove(MoveId.QUICK_ATTACK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 1),
    new AttackMove(MoveId.RAGE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 20, 100, 20, -1, 0, 1) //
      .partial(), // No effect implemented
    new SelfStatusMove(MoveId.TELEPORT, PokemonType.PSYCHIC, -1, 20, -1, -6, 1)
      .attr(ForceSwitchOutAttr, true)
      .hidesUser()
      .condition(failTeleportCondition, 3),
    new AttackMove(MoveId.NIGHT_SHADE, PokemonType.GHOST, MoveCategory.SPECIAL, -1, 100, 15, -1, 0, 1) //
      .attr(LevelDamageAttr),
    new StatusMove(MoveId.MIMIC, PokemonType.NORMAL, -1, 10, -1, 0, 1) //
      .attr(MovesetCopyMoveAttr)
      .ignoresSubstitute(),
    new StatusMove(MoveId.SCREECH, PokemonType.NORMAL, 85, 40, -1, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.DEF], -2)
      .soundBased()
      .reflectable(),
    new SelfStatusMove(MoveId.DOUBLE_TEAM, PokemonType.NORMAL, -1, 15, -1, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.EVA], 1, true),
    new SelfStatusMove(MoveId.RECOVER, PokemonType.NORMAL, -1, 5, -1, 0, 1) //
      .attr(HealAttr, 0.5)
      .triageMove(),
    new SelfStatusMove(MoveId.HARDEN, PokemonType.NORMAL, -1, 30, -1, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.DEF], 1, true),
    new SelfStatusMove(MoveId.MINIMIZE, PokemonType.NORMAL, -1, 10, -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.MINIMIZED, true, false)
      .attr(StatStageChangeAttr, [Stat.EVA], 2, true),
    new StatusMove(MoveId.SMOKESCREEN, PokemonType.NORMAL, 100, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [Stat.ACC], -1)
      .reflectable(),
    new StatusMove(MoveId.CONFUSE_RAY, PokemonType.GHOST, 100, 10, -1, 0, 1) //
      .attr(ConfuseAttr)
      .reflectable(),
    new SelfStatusMove(MoveId.WITHDRAW, PokemonType.WATER, -1, 40, -1, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.DEF], 1, true),
    new SelfStatusMove(MoveId.DEFENSE_CURL, PokemonType.NORMAL, -1, 40, -1, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.DEF], 1, true),
    new SelfStatusMove(MoveId.BARRIER, PokemonType.PSYCHIC, -1, 20, -1, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.DEF], 2, true),
    new StatusMove(MoveId.LIGHT_SCREEN, PokemonType.PSYCHIC, -1, 30, -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.LIGHT_SCREEN, 5, true)
      .target(MoveTarget.USER_SIDE),
    new SelfStatusMove(MoveId.HAZE, PokemonType.ICE, -1, 30, -1, 0, 1) //
      .ignoresSubstitute()
      .attr(ResetStatsAttr, true),
    new StatusMove(MoveId.REFLECT, PokemonType.PSYCHIC, -1, 20, -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.REFLECT, 5, true)
      .target(MoveTarget.USER_SIDE),
    new SelfStatusMove(MoveId.FOCUS_ENERGY, PokemonType.NORMAL, -1, 30, -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.CRIT_BOOST, true, true)
      // TODO: Remove once dragon cheer & focus energy are merged into 1 tag
      .condition((_user, target) => !target.getTag(BattlerTagType.DRAGON_CHEER)),
    new AttackMove(MoveId.BIDE, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, -1, 10, -1, 1, 1)
      .target(MoveTarget.USER)
      .unimplemented(),
    new SelfStatusMove(MoveId.METRONOME, PokemonType.NORMAL, -1, 10, -1, 0, 1) //
      .attr(RandomMoveAttr, invalidMetronomeMoves),
    new StatusMove(MoveId.MIRROR_MOVE, PokemonType.FLYING, -1, 20, -1, 0, 1) //
      .attr(CopyMoveAttr, true, invalidMirrorMoveMoves),
    new AttackMove(MoveId.SELF_DESTRUCT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 200, 100, 5, -1, 0, 1)
      .attr(SacrificialAttr)
      .makesContact(false)
      .condition(failIfDampCondition, 3)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.EGG_BOMB, PokemonType.NORMAL, MoveCategory.PHYSICAL, 100, 75, 10, -1, 0, 1)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(MoveId.LICK, PokemonType.GHOST, MoveCategory.PHYSICAL, 30, 100, 30, 30, 0, 1) //
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(MoveId.SMOG, PokemonType.POISON, MoveCategory.SPECIAL, 30, 70, 20, 40, 0, 1) //
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(MoveId.SLUDGE, PokemonType.POISON, MoveCategory.SPECIAL, 65, 100, 20, 30, 0, 1) //
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(MoveId.BONE_CLUB, PokemonType.GROUND, MoveCategory.PHYSICAL, 65, 85, 20, 10, 0, 1)
      .attr(FlinchAttr)
      .makesContact(false),
    new AttackMove(MoveId.FIRE_BLAST, PokemonType.FIRE, MoveCategory.SPECIAL, 110, 85, 5, 10, 0, 1) //
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(MoveId.WATERFALL, PokemonType.WATER, MoveCategory.PHYSICAL, 80, 100, 15, 20, 0, 1) //
      .attr(FlinchAttr),
    new AttackMove(MoveId.CLAMP, PokemonType.WATER, MoveCategory.PHYSICAL, 35, 85, 15, -1, 0, 1) //
      .attr(TrapAttr, BattlerTagType.CLAMP),
    new AttackMove(MoveId.SWIFT, PokemonType.NORMAL, MoveCategory.SPECIAL, 60, -1, 20, -1, 0, 1) //
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new ChargingAttackMove(MoveId.SKULL_BASH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 130, 100, 10, -1, 0, 1)
      .chargeText(i18next.t("moveTriggers:loweredItsHead", { pokemonName: "{USER}" }))
      .chargeAttr(StatStageChangeAttr, [Stat.DEF], 1, true),
    new AttackMove(MoveId.SPIKE_CANNON, PokemonType.NORMAL, MoveCategory.PHYSICAL, 20, 100, 15, -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false),
    new AttackMove(MoveId.CONSTRICT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 10, 100, 35, 10, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.SPD], -1),
    new SelfStatusMove(MoveId.AMNESIA, PokemonType.PSYCHIC, -1, 20, -1, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.SPDEF], 2, true),
    new StatusMove(MoveId.KINESIS, PokemonType.PSYCHIC, 80, 15, -1, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.ACC], -1)
      .reflectable(),
    new SelfStatusMove(MoveId.SOFT_BOILED, PokemonType.NORMAL, -1, 5, -1, 0, 1) //
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(MoveId.HIGH_JUMP_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 130, 90, 10, -1, 0, 1)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .affectedByGravity()
      .recklessMove(),
    new StatusMove(MoveId.GLARE, PokemonType.NORMAL, 100, 30, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .reflectable(),
    new AttackMove(MoveId.DREAM_EATER, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 15, -1, 0, 1)
      .attr(HitHealAttr)
      .condition(targetSleptOrComatoseCondition)
      .triageMove(),
    new StatusMove(MoveId.POISON_GAS, PokemonType.POISON, 90, 40, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(MoveId.BARRAGE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(MoveId.LEECH_LIFE, PokemonType.BUG, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 1)
      .attr(HitHealAttr)
      .triageMove(),
    new StatusMove(MoveId.LOVELY_KISS, PokemonType.NORMAL, 75, 10, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .reflectable(),
    new ChargingAttackMove(MoveId.SKY_ATTACK, PokemonType.FLYING, MoveCategory.PHYSICAL, 140, 90, 5, 30, 0, 1)
      .chargeText(i18next.t("moveTriggers:isGlowing", { pokemonName: "{USER}" }))
      .attr(HighCritAttr)
      .attr(FlinchAttr)
      .makesContact(false),
    new StatusMove(MoveId.TRANSFORM, PokemonType.NORMAL, -1, 10, -1, 0, 1)
      .attr(TransformAttr)
      .ignoresProtect()
      /* Transform:
       * Does not copy the target's rage fist hit count
       * Does not copy the target's volatile status conditions (ie BattlerTags)
       * Renders user typeless when copying typeless opponent (should revert to original typing)
       */
      .edgeCase(),
    new AttackMove(MoveId.BUBBLE, PokemonType.WATER, MoveCategory.SPECIAL, 40, 100, 30, 10, 0, 1)
      .attr(StatStageChangeAttr, [Stat.SPD], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.DIZZY_PUNCH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, 20, 0, 1)
      .attr(ConfuseAttr)
      .punchingMove(),
    new StatusMove(MoveId.SPORE, PokemonType.GRASS, 100, 15, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .powderMove()
      .reflectable(),
    new StatusMove(MoveId.FLASH, PokemonType.NORMAL, 100, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [Stat.ACC], -1)
      .reflectable(),
    new AttackMove(MoveId.PSYWAVE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 15, -1, 0, 1) //
      .attr(RandomLevelDamageAttr),
    new SelfStatusMove(MoveId.SPLASH, PokemonType.NORMAL, -1, 40, -1, 0, 1)
      .attr(MessageAttr, i18next.t("moveTriggers:splash"))
      .affectedByGravity(),
    new SelfStatusMove(MoveId.ACID_ARMOR, PokemonType.POISON, -1, 20, -1, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.DEF], 2, true),
    new AttackMove(MoveId.CRABHAMMER, PokemonType.WATER, MoveCategory.PHYSICAL, 100, 90, 10, -1, 0, 1) //
      .attr(HighCritAttr),
    new AttackMove(MoveId.EXPLOSION, PokemonType.NORMAL, MoveCategory.PHYSICAL, 250, 100, 5, -1, 0, 1)
      .condition(failIfDampCondition, 3)
      .attr(SacrificialAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.FURY_SWIPES, PokemonType.NORMAL, MoveCategory.PHYSICAL, 18, 80, 15, -1, 0, 1) //
      .attr(MultiHitAttr),
    new AttackMove(MoveId.BONEMERANG, PokemonType.GROUND, MoveCategory.PHYSICAL, 50, 90, 10, -1, 0, 1)
      .attr(MultiHitAttr, MultiHitType.TWO)
      .makesContact(false),
    new SelfStatusMove(MoveId.REST, PokemonType.PSYCHIC, -1, 5, -1, 0, 1) //
      .attr(RestAttr, 3)
      .triageMove(),
    new AttackMove(MoveId.ROCK_SLIDE, PokemonType.ROCK, MoveCategory.PHYSICAL, 75, 90, 10, 30, 0, 1)
      .attr(FlinchAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.HYPER_FANG, PokemonType.NORMAL, MoveCategory.PHYSICAL, 80, 90, 15, 10, 0, 1)
      .attr(FlinchAttr)
      .bitingMove(),
    new SelfStatusMove(MoveId.SHARPEN, PokemonType.NORMAL, -1, 30, -1, 0, 1) //
      .attr(StatStageChangeAttr, [Stat.ATK], 1, true),
    new SelfStatusMove(MoveId.CONVERSION, PokemonType.NORMAL, -1, 30, -1, 0, 1) //
      .attr(FirstMoveTypeAttr),
    new AttackMove(MoveId.TRI_ATTACK, PokemonType.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, 20, 0, 1) //
      .attr(MultiStatusEffectAttr, [StatusEffect.BURN, StatusEffect.FREEZE, StatusEffect.PARALYSIS]),
    new AttackMove(MoveId.SUPER_FANG, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 90, 10, -1, 0, 1) //
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(MoveId.SLASH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 1)
      .attr(HighCritAttr)
      .slicingMove(),
    new SelfStatusMove(MoveId.SUBSTITUTE, PokemonType.NORMAL, -1, 10, -1, 0, 1) //
      .attr(AddSubstituteAttr, 0.25, false),
    new AttackMove(MoveId.STRUGGLE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 50, -1, 1, -1, 0, 1)
      .attr(RecoilAttr, true, 0.25, true)
      .attr(TypelessAttr)
      .attr(PreMoveMessageAttr, (user) =>
        i18next.t("moveTriggers:struggle", { pokemonName: getPokemonNameWithAffix(user) }),
      )
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(MoveId.SKETCH, PokemonType.NORMAL, -1, 1, -1, 0, 2) //
      .ignoresSubstitute()
      .attr(SketchAttr),
    new AttackMove(MoveId.TRIPLE_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 10, 90, 10, -1, 0, 2)
      .attr(MultiHitAttr, MultiHitType.THREE)
      .attr(MultiHitPowerIncrementAttr, 3)
      .checkAllHits(),
    new AttackMove(MoveId.THIEF, PokemonType.DARK, MoveCategory.PHYSICAL, 60, 100, 25, -1, 0, 2)
      .attr(StealHeldItemChanceAttr, 0.3)
      .edgeCase(),
    // Should not be able to steal held item if user faints due to Rough Skin, Iron Barbs, etc.
    // Should be able to steal items from pokemon with Sticky Hold if the damage causes them to faint
    new StatusMove(MoveId.SPIDER_WEB, PokemonType.BUG, -1, 10, -1, 0, 2)
      .condition(failIfGhostTypeCondition)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1)
      .reflectable(),
    new StatusMove(MoveId.MIND_READER, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_ACCURACY, true, false, 2)
      .attr(MessageAttr, (user, target) =>
        i18next.t("moveTriggers:tookAimAtTarget", {
          pokemonName: getPokemonNameWithAffix(user),
          targetName: getPokemonNameWithAffix(target),
        }),
      ),
    new StatusMove(MoveId.NIGHTMARE, PokemonType.GHOST, 100, 15, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.NIGHTMARE)
      .condition(targetSleptOrComatoseCondition),
    new AttackMove(MoveId.FLAME_WHEEL, PokemonType.FIRE, MoveCategory.PHYSICAL, 60, 100, 25, 10, 0, 2)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(MoveId.SNORE, PokemonType.NORMAL, MoveCategory.SPECIAL, 50, 100, 15, 30, 0, 2)
      .attr(BypassSleepAttr)
      .attr(FlinchAttr)
      .condition(userSleptOrComatoseCondition, 3)
      .soundBased(),
    new StatusMove(MoveId.CURSE, PokemonType.GHOST, -1, 10, -1, 0, 2)
      .attr(CurseAttr)
      .ignoresSubstitute()
      .ignoresProtect()
      .target(MoveTarget.CURSE),
    new AttackMove(MoveId.FLAIL, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 15, -1, 0, 2) //
      .attr(LowHpPowerAttr),
    new StatusMove(MoveId.CONVERSION_2, PokemonType.NORMAL, -1, 30, -1, 0, 2)
      .attr(ResistLastMoveTypeAttr)
      .ignoresSubstitute()
      .partial(), // Checks the move's original typing and not if its type is changed through some other means
    new AttackMove(MoveId.AEROBLAST, PokemonType.FLYING, MoveCategory.SPECIAL, 100, 95, 5, -1, 0, 2)
      .windMove()
      .attr(HighCritAttr),
    new StatusMove(MoveId.COTTON_SPORE, PokemonType.GRASS, 100, 40, -1, 0, 2)
      .attr(StatStageChangeAttr, [Stat.SPD], -2)
      .powderMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(MoveId.REVERSAL, PokemonType.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 15, -1, 0, 2) //
      .attr(LowHpPowerAttr),
    new StatusMove(MoveId.SPITE, PokemonType.GHOST, 100, 10, -1, 0, 2)
      .ignoresSubstitute()
      .attr(ReducePpMoveAttr, 4)
      .reflectable(),
    new AttackMove(MoveId.POWDER_SNOW, PokemonType.ICE, MoveCategory.SPECIAL, 40, 100, 25, 10, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(MoveId.PROTECT, PokemonType.NORMAL, -1, 10, -1, 4, 2)
      .attr(ProtectAttr)
      .condition(failIfLastCondition, 3),
    new AttackMove(MoveId.MACH_PUNCH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 2) //
      .punchingMove(),
    new StatusMove(MoveId.SCARY_FACE, PokemonType.NORMAL, 100, 10, -1, 0, 2)
      .attr(StatStageChangeAttr, [Stat.SPD], -2)
      .reflectable(),
    new AttackMove(MoveId.FEINT_ATTACK, PokemonType.DARK, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 2),
    new StatusMove(MoveId.SWEET_KISS, PokemonType.FAIRY, 75, 10, -1, 0, 2) //
      .attr(ConfuseAttr)
      .reflectable(),
    new SelfStatusMove(MoveId.BELLY_DRUM, PokemonType.NORMAL, -1, 10, -1, 0, 2) //
      .attr(CutHpStatStageBoostAttr, [Stat.ATK], 12, 2, user => {
        globalScene.phaseManager.queueMessage(
          i18next.t("moveTriggers:cutOwnHpAndMaximizedStat", {
            pokemonName: getPokemonNameWithAffix(user),
            statName: i18next.t(getStatKey(Stat.ATK)),
          }),
        );
      }),
    new AttackMove(MoveId.SLUDGE_BOMB, PokemonType.POISON, MoveCategory.SPECIAL, 90, 100, 10, 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .ballBombMove(),
    new AttackMove(MoveId.MUD_SLAP, PokemonType.GROUND, MoveCategory.SPECIAL, 20, 100, 10, 100, 0, 2) //
      .attr(StatStageChangeAttr, [Stat.ACC], -1),
    new AttackMove(MoveId.OCTAZOOKA, PokemonType.WATER, MoveCategory.SPECIAL, 65, 85, 10, 50, 0, 2)
      .attr(StatStageChangeAttr, [Stat.ACC], -1)
      .ballBombMove(),
    new StatusMove(MoveId.SPIKES, PokemonType.GROUND, -1, 20, -1, 0, 2)
      .attr(AddArenaTrapTagAttr, ArenaTagType.SPIKES)
      .target(MoveTarget.ENEMY_SIDE)
      .reflectable(),
    new AttackMove(MoveId.ZAP_CANNON, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 120, 50, 5, 100, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .ballBombMove(),
    new StatusMove(MoveId.FORESIGHT, PokemonType.NORMAL, -1, 40, -1, 0, 2)
      .attr(ExposedMoveAttr, BattlerTagType.IGNORE_GHOST)
      .ignoresSubstitute()
      .reflectable(),
    new SelfStatusMove(MoveId.DESTINY_BOND, PokemonType.GHOST, -1, 5, -1, 0, 2)
      .ignoresProtect()
      .attr(DestinyBondAttr)
      // Destiny Bond fails if it was successfully used last turn
      .condition((user, _target, move) => {
        const lastTurnMove = user.getLastXMoves(1).at(0);
        return !(lastTurnMove?.move === move.id && lastTurnMove.result === MoveResult.SUCCESS);
      }),
    new StatusMove(MoveId.PERISH_SONG, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.PERISH_SONG, false, true, 4)
      .attr(MessageAttr, (_user, target) =>
        i18next.t("moveTriggers:faintCountdown", { pokemonName: getPokemonNameWithAffix(target), turnCount: 3 }),
      )
      .ignoresProtect()
      .soundBased()
      .condition(failOnBossCondition)
      .target(MoveTarget.ALL),
    new AttackMove(MoveId.ICY_WIND, PokemonType.ICE, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 2)
      .attr(StatStageChangeAttr, [Stat.SPD], -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(MoveId.DETECT, PokemonType.FIGHTING, -1, 5, -1, 4, 2)
      .attr(ProtectAttr)
      .condition(failIfLastCondition, 3),
    new AttackMove(MoveId.BONE_RUSH, PokemonType.GROUND, MoveCategory.PHYSICAL, 25, 90, 10, -1, 0, 2)
      .attr(MultiHitAttr)
      .makesContact(false),
    new StatusMove(MoveId.LOCK_ON, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_ACCURACY, true, false, 2)
      .attr(MessageAttr, (user, target) =>
        i18next.t("moveTriggers:tookAimAtTarget", {
          pokemonName: getPokemonNameWithAffix(user),
          targetName: getPokemonNameWithAffix(target),
        }),
      ),
    new AttackMove(MoveId.OUTRAGE, PokemonType.DRAGON, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 2)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(NoEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(MoveId.SANDSTORM, PokemonType.ROCK, -1, 10, -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.SANDSTORM)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(MoveId.GIGA_DRAIN, PokemonType.GRASS, MoveCategory.SPECIAL, 75, 100, 10, -1, 0, 2)
      .attr(HitHealAttr)
      .triageMove(),
    new SelfStatusMove(MoveId.ENDURE, PokemonType.NORMAL, -1, 10, -1, 4, 2)
      .attr(ProtectAttr, BattlerTagType.ENDURING)
      .condition(failIfLastCondition, 3),
    new StatusMove(MoveId.CHARM, PokemonType.FAIRY, 100, 20, -1, 0, 2)
      .attr(StatStageChangeAttr, [Stat.ATK], -2)
      .reflectable(),
    new AttackMove(MoveId.ROLLOUT, PokemonType.ROCK, MoveCategory.PHYSICAL, 30, 90, 20, -1, 0, 2)
      .partial() // Does not lock the user, also does not increase damage properly
      .attr(ConsecutiveUseDoublePowerAttr, 5, true, true, MoveId.DEFENSE_CURL),
    new AttackMove(MoveId.FALSE_SWIPE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 2) //
      .attr(SurviveDamageAttr),
    new StatusMove(MoveId.SWAGGER, PokemonType.NORMAL, 85, 15, -1, 0, 2)
      .attr(StatStageChangeAttr, [Stat.ATK], 2)
      .attr(ConfuseAttr)
      .reflectable(),
    new SelfStatusMove(MoveId.MILK_DRINK, PokemonType.NORMAL, -1, 5, -1, 0, 2) //
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(MoveId.SPARK, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 65, 100, 20, 30, 0, 2) //
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(MoveId.FURY_CUTTER, PokemonType.BUG, MoveCategory.PHYSICAL, 40, 95, 20, -1, 0, 2)
      .attr(ConsecutiveUseDoublePowerAttr, 3, true)
      .slicingMove(),
    new AttackMove(MoveId.STEEL_WING, PokemonType.STEEL, MoveCategory.PHYSICAL, 70, 90, 25, 10, 0, 2) //
      .attr(StatStageChangeAttr, [Stat.DEF], 1, true),
    new StatusMove(MoveId.MEAN_LOOK, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .condition(failIfGhostTypeCondition)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1)
      .reflectable(),
    new StatusMove(MoveId.ATTRACT, PokemonType.NORMAL, 100, 15, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.INFATUATED)
      .ignoresSubstitute()
      .condition((user, target, _move) => user.isOppositeGender(target))
      .reflectable(),
    new SelfStatusMove(MoveId.SLEEP_TALK, PokemonType.NORMAL, -1, 10, -1, 0, 2)
      .attr(BypassSleepAttr)
      .attr(RandomMovesetMoveAttr, invalidSleepTalkMoves, false)
      .condition(userSleptOrComatoseCondition, 3)
      .target(MoveTarget.NEAR_ENEMY),
    new StatusMove(MoveId.HEAL_BELL, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(PartyStatusCureAttr, i18next.t("moveTriggers:bellChimed"), AbilityId.SOUNDPROOF)
      .soundBased()
      .target(MoveTarget.PARTY),
    new AttackMove(MoveId.RETURN, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 2) //
      .attr(FriendshipPowerAttr),
    new AttackMove(MoveId.PRESENT, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 90, 15, -1, 0, 2)
      .attr(PresentPowerAttr)
      .makesContact(false),
    new AttackMove(MoveId.FRUSTRATION, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 2) //
      .attr(FriendshipPowerAttr, true),
    new StatusMove(MoveId.SAFEGUARD, PokemonType.NORMAL, -1, 25, -1, 0, 2)
      .target(MoveTarget.USER_SIDE)
      .attr(AddArenaTagAttr, ArenaTagType.SAFEGUARD, 5, true, true),
    new StatusMove(MoveId.PAIN_SPLIT, PokemonType.NORMAL, -1, 20, -1, 0, 2)
      .attr(HpSplitAttr)
      .condition(failOnBossCondition),
    new AttackMove(MoveId.SACRED_FIRE, PokemonType.FIRE, MoveCategory.PHYSICAL, 100, 95, 5, 50, 0, 2)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .makesContact(false),
    new AttackMove(MoveId.MAGNITUDE, PokemonType.GROUND, MoveCategory.PHYSICAL, -1, 100, 30, -1, 0, 2)
      .attr(PreMoveMessageAttr, magnitudeMessageFunc)
      .attr(MagnitudePowerAttr)
      .attr(MovePowerMultiplierAttr, (_user, target, _move) =>
        globalScene.arena.terrainType === TerrainType.GRASSY && target.isGrounded() ? 0.5 : 1,
      )
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.UNDERGROUND)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.DYNAMIC_PUNCH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 50, 5, 100, 0, 2)
      .attr(ConfuseAttr)
      .punchingMove(),
    new AttackMove(MoveId.MEGAHORN, PokemonType.BUG, MoveCategory.PHYSICAL, 120, 85, 10, -1, 0, 2),
    new AttackMove(MoveId.DRAGON_BREATH, PokemonType.DRAGON, MoveCategory.SPECIAL, 60, 100, 20, 30, 0, 2) //
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new SelfStatusMove(MoveId.BATON_PASS, PokemonType.NORMAL, -1, 40, -1, 0, 2)
      .attr(ForceSwitchOutAttr, true, SwitchType.BATON_PASS)
      .condition(failIfLastInPartyCondition)
      .hidesUser(),
    new StatusMove(MoveId.ENCORE, PokemonType.NORMAL, 100, 5, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.ENCORE, false, true)
      .condition((user, target) => new EncoreTag(user.id).canAdd(target))
      .ignoresSubstitute()
      .reflectable()
      // TODO: Verify if Encore's duration decreases during status based move failures
      .edgeCase(),
    new AttackMove(MoveId.PURSUIT, PokemonType.DARK, MoveCategory.PHYSICAL, 40, 100, 20, -1, 0, 2) //
      .partial(), // No effect implemented
    new AttackMove(MoveId.RAPID_SPIN, PokemonType.NORMAL, MoveCategory.PHYSICAL, 50, 100, 40, 100, 0, 2)
      .attr(StatStageChangeAttr, [Stat.SPD], 1, true)
      .attr(
        RemoveBattlerTagAttr,
        [
          BattlerTagType.BIND,
          BattlerTagType.WRAP,
          BattlerTagType.FIRE_SPIN,
          BattlerTagType.WHIRLPOOL,
          BattlerTagType.CLAMP,
          BattlerTagType.SAND_TOMB,
          BattlerTagType.MAGMA_STORM,
          BattlerTagType.SNAP_TRAP,
          BattlerTagType.THUNDER_CAGE,
          BattlerTagType.SEEDED,
          BattlerTagType.INFESTATION,
        ],
        true,
      )
      .attr(RemoveArenaTrapAttr, user => (user.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY)),
    new StatusMove(MoveId.SWEET_SCENT, PokemonType.NORMAL, 100, 20, -1, 0, 2)
      .attr(StatStageChangeAttr, [Stat.EVA], -2)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(MoveId.IRON_TAIL, PokemonType.STEEL, MoveCategory.PHYSICAL, 100, 75, 15, 30, 0, 2) //
      .attr(StatStageChangeAttr, [Stat.DEF], -1),
    new AttackMove(MoveId.METAL_CLAW, PokemonType.STEEL, MoveCategory.PHYSICAL, 50, 95, 35, 10, 0, 2) //
      .attr(StatStageChangeAttr, [Stat.ATK], 1, true),
    new AttackMove(MoveId.VITAL_THROW, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 70, -1, 10, -1, -1, 2),
    new SelfStatusMove(MoveId.MORNING_SUN, PokemonType.NORMAL, -1, 5, -1, 0, 2) //
      .attr(PlantHealAttr)
      .triageMove(),
    new SelfStatusMove(MoveId.SYNTHESIS, PokemonType.GRASS, -1, 5, -1, 0, 2) //
      .attr(PlantHealAttr)
      .triageMove(),
    new SelfStatusMove(MoveId.MOONLIGHT, PokemonType.FAIRY, -1, 5, -1, 0, 2) //
      .attr(PlantHealAttr)
      .triageMove(),
    new AttackMove(MoveId.HIDDEN_POWER, PokemonType.NORMAL, MoveCategory.SPECIAL, 60, 100, 15, -1, 0, 2) //
      .attr(HiddenPowerTypeAttr),
    new AttackMove(MoveId.CROSS_CHOP, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 80, 5, -1, 0, 2) //
      .attr(HighCritAttr),
    new AttackMove(MoveId.TWISTER, PokemonType.DRAGON, MoveCategory.SPECIAL, 40, 100, 20, 20, 0, 2)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.FLYING)
      .attr(FlinchAttr)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(MoveId.RAIN_DANCE, PokemonType.WATER, -1, 5, -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.RAIN)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(MoveId.SUNNY_DAY, PokemonType.FIRE, -1, 5, -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.SUNNY)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(MoveId.CRUNCH, PokemonType.DARK, MoveCategory.PHYSICAL, 80, 100, 15, 20, 0, 2)
      .attr(StatStageChangeAttr, [Stat.DEF], -1)
      .bitingMove(),
    new AttackMove(MoveId.MIRROR_COAT, PokemonType.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 20, -1, -5, 2)
      .attr(CounterDamageAttr, 2, MoveCategory.SPECIAL)
      .attr(CounterRedirectAttr, MoveCategory.SPECIAL)
      .condition(counterAttackConditionSpecial, 3)
      .target(MoveTarget.ATTACKER),
    new StatusMove(MoveId.PSYCH_UP, PokemonType.NORMAL, -1, 10, -1, 0, 2) //
      .ignoresSubstitute()
      .attr(CopyStatsAttr),
    new AttackMove(MoveId.EXTREME_SPEED, PokemonType.NORMAL, MoveCategory.PHYSICAL, 80, 100, 5, -1, 2, 2),
    new AttackMove(MoveId.ANCIENT_POWER, PokemonType.ROCK, MoveCategory.SPECIAL, 60, 100, 5, 10, 0, 2) //
      .attr(StatStageChangeAttr, [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD], 1, true),
    new AttackMove(MoveId.SHADOW_BALL, PokemonType.GHOST, MoveCategory.SPECIAL, 80, 100, 15, 20, 0, 2)
      .attr(StatStageChangeAttr, [Stat.SPDEF], -1)
      .ballBombMove(),
    new AttackMove(MoveId.FUTURE_SIGHT, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 2)
      .attr(DelayedAttackAttr, ChargeAnim.FUTURE_SIGHT_CHARGING, "moveTriggers:foresawAnAttack")
      .ignoresProtect()
      // Should not apply abilities or held items if user is off the field
      .edgeCase(),
    new AttackMove(MoveId.ROCK_SMASH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 15, 50, 0, 2) //
      .attr(StatStageChangeAttr, [Stat.DEF], -1),
    new AttackMove(MoveId.WHIRLPOOL, PokemonType.WATER, MoveCategory.SPECIAL, 35, 85, 15, -1, 0, 2)
      .attr(TrapAttr, BattlerTagType.WHIRLPOOL)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.UNDERWATER),
    new AttackMove(MoveId.BEAT_UP, PokemonType.DARK, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 2)
      .attr(MultiHitAttr, MultiHitType.BEAT_UP)
      .attr(BeatUpAttr)
      .makesContact(false),
    new AttackMove(MoveId.FAKE_OUT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 10, 100, 3, 3)
      .attr(FlinchAttr)
      .condition(new FirstMoveCondition(), 3),
    new AttackMove(MoveId.UPROAR, PokemonType.NORMAL, MoveCategory.SPECIAL, 90, 100, 10, -1, 0, 3)
      .soundBased()
      .target(MoveTarget.RANDOM_NEAR_ENEMY)
      // Does not lock the user, does not stop Pokemon from sleeping
      // Likely can make use of FrenzyAttr and an ArenaTag (just without the FrenzyMissFunc)
      .partial(),
    new SelfStatusMove(MoveId.STOCKPILE, PokemonType.NORMAL, -1, 20, -1, 0, 3)
      .condition(user => (user.getTag(StockpilingTag)?.stockpiledCount ?? 0) < 3, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.STOCKPILING, true),
    new AttackMove(MoveId.SPIT_UP, PokemonType.NORMAL, MoveCategory.SPECIAL, -1, 100, 10, -1, 0, 3)
      .condition(hasStockpileStacksCondition, 3)
      .attr(SpitUpPowerAttr, 100)
      .attr(RemoveBattlerTagAttr, [BattlerTagType.STOCKPILING], true),
    new SelfStatusMove(MoveId.SWALLOW, PokemonType.NORMAL, -1, 10, -1, 0, 3)
      .condition(hasStockpileStacksCondition, 3)
      .attr(SwallowHealAttr)
      .attr(RemoveBattlerTagAttr, [BattlerTagType.STOCKPILING], true)
      .triageMove()
      // TODO: Verify if using Swallow at full HP still consumes stacks or not
      .edgeCase(),
    new AttackMove(MoveId.HEAT_WAVE, PokemonType.FIRE, MoveCategory.SPECIAL, 95, 90, 10, 10, 0, 3)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(MoveId.HAIL, PokemonType.ICE, -1, 10, -1, 0, 3)
      .attr(WeatherChangeAttr, WeatherType.HAIL)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(MoveId.TORMENT, PokemonType.DARK, 100, 15, -1, 0, 3)
      .ignoresSubstitute()
      .edgeCase() // Incomplete implementation because of Uproar's partial implementation
      .attr(AddBattlerTagAttr, BattlerTagType.TORMENT, false, true, 1)
      .reflectable(),
    new StatusMove(MoveId.FLATTER, PokemonType.DARK, 100, 15, -1, 0, 3)
      .attr(StatStageChangeAttr, [Stat.SPATK], 1)
      .attr(ConfuseAttr)
      .reflectable(),
    new StatusMove(MoveId.WILL_O_WISP, PokemonType.FIRE, 85, 15, -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .reflectable(),
    new StatusMove(MoveId.MEMENTO, PokemonType.DARK, 100, 10, -1, 0, 3)
      .attr(SacrificialAttrOnHit)
      .attr(StatStageChangeAttr, [Stat.ATK, Stat.SPATK], -2),
    new AttackMove(MoveId.FACADE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, _target, _move) =>
        user.status
        && (user.status.effect === StatusEffect.BURN
          || user.status.effect === StatusEffect.POISON
          || user.status.effect === StatusEffect.TOXIC
          || user.status.effect === StatusEffect.PARALYSIS)
          ? 2
          : 1,
      )
      .attr(BypassBurnDamageReductionAttr),
    new AttackMove(MoveId.FOCUS_PUNCH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 150, 100, 20, -1, -3, 3)
      .attr(MessageHeaderAttr, user =>
        i18next.t("moveTriggers:isTighteningFocus", { pokemonName: getPokemonNameWithAffix(user) }),
      )
      .attr(
        PreUseInterruptAttr,
        user => i18next.t("moveTriggers:lostFocus", { pokemonName: getPokemonNameWithAffix(user) }),
        user => user.turnData.attacksReceived.some(r => r.damage > 0),
      )
      .punchingMove(),
    new AttackMove(MoveId.SMELLING_SALTS, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (_user, target, _move) =>
        target.status?.effect === StatusEffect.PARALYSIS ? 2 : 1,
      )
      .attr(HealStatusEffectAttr, true, StatusEffect.PARALYSIS),
    new SelfStatusMove(MoveId.FOLLOW_ME, PokemonType.NORMAL, -1, 20, -1, 2, 3)
      //Should be reworked so that enemy next move fails if it target itself, take reduced dmg if hit
      .attr(AddBattlerTagAttr, BattlerTagType.CENTER_OF_ATTENTION, true),
    new StatusMove(MoveId.NATURE_POWER, PokemonType.NORMAL, -1, 20, -1, 0, 3) //
      .attr(NaturePowerAttr),
    new SelfStatusMove(MoveId.CHARGE, PokemonType.ELECTRIC, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [Stat.SPDEF], 1, true)
      .attr(AddBattlerTagAttr, BattlerTagType.CHARGED, true, false),
    new StatusMove(MoveId.TAUNT, PokemonType.DARK, 100, 20, -1, 0, 3)
      .ignoresSubstitute()
      .attr(AddBattlerTagAttr, BattlerTagType.TAUNT, false, true, 4)
      .reflectable(),
    new StatusMove(MoveId.HELPING_HAND, PokemonType.NORMAL, -1, 20, -1, 5, 3)
      //.attr(AddBattlerTagAttr, BattlerTagType.HELPING_HAND)
      .ignoresSubstitute()
      .unimplemented(), //since game is solo battles, it need to be reworked to be usable on Out of Field party members
    new StatusMove(MoveId.TRICK, PokemonType.PSYCHIC, 100, 10, -1, 0, 3) //
      .unimplemented(),
    new StatusMove(MoveId.ROLE_PLAY, PokemonType.PSYCHIC, -1, 10, -1, 0, 3)
      .ignoresSubstitute()
      // TODO: Enable / remove once balance reaches a consensus on ability overrides during boss fights
      // .condition(failAgainstFinalBossCondition, 3)
      .attr(AbilityCopyAttr),
    new SelfStatusMove(MoveId.WISH, PokemonType.NORMAL, -1, 10, -1, 0, 3) //
      .attr(WishAttr)
      .triageMove(),
    new SelfStatusMove(MoveId.ASSIST, PokemonType.NORMAL, -1, 20, -1, 0, 3) //
      .attr(RandomMovesetMoveAttr, invalidAssistMoves, true),
    new SelfStatusMove(MoveId.INGRAIN, PokemonType.GRASS, -1, 20, -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.INGRAIN, true, true)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_FLYING, true, true)
      .attr(RemoveBattlerTagAttr, [BattlerTagType.FLOATING], true),
    new AttackMove(MoveId.SUPERPOWER, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 3) //
      .attr(StatStageChangeAttr, [Stat.ATK, Stat.DEF], -1, true),
    new SelfStatusMove(MoveId.MAGIC_COAT, PokemonType.PSYCHIC, -1, 15, -1, 4, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.MAGIC_COAT, true, true, 0)
      .condition(failIfLastCondition, 3)
      // Should reflect moves that would otherwise fail
      .edgeCase(),
    new SelfStatusMove(MoveId.RECYCLE, PokemonType.NORMAL, -1, 10, -1, 0, 3) //
      .unimplemented(),
    new AttackMove(MoveId.REVENGE, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, -1, -4, 3) //
      .attr(TurnDamagedDoublePowerAttr),
    new AttackMove(MoveId.BRICK_BREAK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 75, 100, 15, -1, 0, 3) //
      .attr(RemoveScreensAttr, (_user, target) => (target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY)),
    new StatusMove(MoveId.YAWN, PokemonType.NORMAL, -1, 10, -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.DROWSY, false, true)
      .condition((user, target, _move) => !target.status && !target.isSafeguarded(user))
      .reflectable()
      // Does not count as failed for terrain-based failures;
      // should not check Safeguard when triggering drowsiness
      .edgeCase(),
    new AttackMove(MoveId.KNOCK_OFF, PokemonType.DARK, MoveCategory.PHYSICAL, 65, 100, 20, -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (_user, target, _move) =>
        target.getHeldItems().filter(i => i.isTransferable).length > 0 ? 1.5 : 1,
      )
      .attr(RemoveHeldItemAttr, false)
      // Should not be able to remove held item if user faints due to Rough Skin, Iron Barbs, etc.
      // Should be able to remove items from pokemon with Sticky Hold if the damage causes them to faint
      .edgeCase(),
    new AttackMove(MoveId.ENDEAVOR, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 3)
      .attr(MatchHpAttr)
      .condition(failOnBossCondition),
    new AttackMove(MoveId.ERUPTION, PokemonType.FIRE, MoveCategory.SPECIAL, 150, 100, 5, -1, 0, 3)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(MoveId.SKILL_SWAP, PokemonType.PSYCHIC, -1, 10, -1, 0, 3)
      .ignoresSubstitute()
      .attr(SwitchAbilitiesAttr),
    new StatusMove(MoveId.IMPRISON, PokemonType.PSYCHIC, 100, 10, -1, 0, 3)
      .ignoresSubstitute()
      .attr(AddArenaTagAttr, ArenaTagType.IMPRISON, 1, true, false)
      // TODO: Enable / remove once balance reaches a consensus on imprison interaction during the final boss fight
      // .condition(failAgainstFinalBossCondition, 2)
      .target(MoveTarget.ENEMY_SIDE),
    new SelfStatusMove(MoveId.REFRESH, PokemonType.NORMAL, -1, 20, -1, 0, 3)
      .attr(HealStatusEffectAttr, true, [
        StatusEffect.PARALYSIS,
        StatusEffect.POISON,
        StatusEffect.TOXIC,
        StatusEffect.BURN,
      ])
      .condition(
        (user, _target, _move) =>
          !!user.status
          && (user.status.effect === StatusEffect.PARALYSIS
            || user.status.effect === StatusEffect.POISON
            || user.status.effect === StatusEffect.TOXIC
            || user.status.effect === StatusEffect.BURN),
      ),
    new SelfStatusMove(MoveId.GRUDGE, PokemonType.GHOST, -1, 5, -1, 0, 3) //
      // NB: failing on overlap is meaningless since Grudge wears off before the user's next move
      .attr(AddBattlerTagAttr, BattlerTagType.GRUDGE, true, false, 1),
    new SelfStatusMove(MoveId.SNATCH, PokemonType.DARK, -1, 10, -1, 4, 3) //
      .unimplemented(),
    new AttackMove(MoveId.SECRET_POWER, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, 30, 0, 3)
      .makesContact(false)
      .attr(SecretPowerAttr),
    new ChargingAttackMove(MoveId.DIVE, PokemonType.WATER, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 3)
      .chargeText(i18next.t("moveTriggers:hidUnderwater", { pokemonName: "{USER}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.UNDERWATER)
      .chargeAttr(GulpMissileTagAttr),
    new AttackMove(MoveId.ARM_THRUST, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 15, 100, 20, -1, 0, 3) //
      .attr(MultiHitAttr),
    new SelfStatusMove(MoveId.CAMOUFLAGE, PokemonType.NORMAL, -1, 20, -1, 0, 3) //
      .attr(CopyBiomeTypeAttr),
    new SelfStatusMove(MoveId.TAIL_GLOW, PokemonType.BUG, -1, 20, -1, 0, 3) //
      .attr(StatStageChangeAttr, [Stat.SPATK], 3, true),
    new AttackMove(MoveId.LUSTER_PURGE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 95, 100, 5, 50, 0, 3) //
      .attr(StatStageChangeAttr, [Stat.SPDEF], -1),
    new AttackMove(MoveId.MIST_BALL, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 95, 100, 5, 50, 0, 3)
      .attr(StatStageChangeAttr, [Stat.SPATK], -1)
      .ballBombMove(),
    new StatusMove(MoveId.FEATHER_DANCE, PokemonType.FLYING, 100, 15, -1, 0, 3)
      .attr(StatStageChangeAttr, [Stat.ATK], -2)
      .danceMove()
      .reflectable(),
    new StatusMove(MoveId.TEETER_DANCE, PokemonType.NORMAL, 100, 20, -1, 0, 3)
      .attr(ConfuseAttr)
      .danceMove()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.BLAZE_KICK, PokemonType.FIRE, MoveCategory.PHYSICAL, 85, 90, 10, 10, 0, 3)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(MoveId.MUD_SPORT, PokemonType.GROUND, -1, 15, -1, 0, 3)
      .ignoresProtect()
      .attr(AddArenaTagAttr, ArenaTagType.MUD_SPORT, 5)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(MoveId.ICE_BALL, PokemonType.ICE, MoveCategory.PHYSICAL, 30, 90, 20, -1, 0, 3)
      .partial() // Does not lock the user properly, does not increase damage correctly
      .attr(ConsecutiveUseDoublePowerAttr, 5, true, true, MoveId.DEFENSE_CURL)
      .ballBombMove(),
    new AttackMove(MoveId.NEEDLE_ARM, PokemonType.GRASS, MoveCategory.PHYSICAL, 60, 100, 15, 30, 0, 3) //
      .attr(FlinchAttr),
    new SelfStatusMove(MoveId.SLACK_OFF, PokemonType.NORMAL, -1, 5, -1, 0, 3) //
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(MoveId.HYPER_VOICE, PokemonType.NORMAL, MoveCategory.SPECIAL, 90, 100, 10, -1, 0, 3)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.POISON_FANG, PokemonType.POISON, MoveCategory.PHYSICAL, 50, 100, 15, 50, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
      .bitingMove(),
    new AttackMove(MoveId.CRUSH_CLAW, PokemonType.NORMAL, MoveCategory.PHYSICAL, 75, 95, 10, 50, 0, 3) //
      .attr(StatStageChangeAttr, [Stat.DEF], -1),
    new AttackMove(MoveId.BLAST_BURN, PokemonType.FIRE, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 3) //
      .attr(RechargeAttr),
    new AttackMove(MoveId.HYDRO_CANNON, PokemonType.WATER, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 3) //
      .attr(RechargeAttr),
    new AttackMove(MoveId.METEOR_MASH, PokemonType.STEEL, MoveCategory.PHYSICAL, 90, 90, 10, 20, 0, 3)
      .attr(StatStageChangeAttr, [Stat.ATK], 1, true)
      .punchingMove(),
    new AttackMove(MoveId.ASTONISH, PokemonType.GHOST, MoveCategory.PHYSICAL, 30, 100, 15, 30, 0, 3) //
      .attr(FlinchAttr),
    new AttackMove(MoveId.WEATHER_BALL, PokemonType.NORMAL, MoveCategory.SPECIAL, 50, 100, 10, -1, 0, 3)
      .attr(WeatherBallTypeAttr)
      .attr(MovePowerMultiplierAttr, (_user, _target, _move) => {
        const weather = globalScene.arena.weather;
        if (!weather) {
          return 1;
        }
        const weatherTypes = [
          WeatherType.SUNNY,
          WeatherType.RAIN,
          WeatherType.SANDSTORM,
          WeatherType.HAIL,
          WeatherType.SNOW,
          WeatherType.FOG,
          WeatherType.HEAVY_RAIN,
          WeatherType.HARSH_SUN,
        ];
        if (weatherTypes.includes(weather.weatherType) && !weather.isEffectSuppressed()) {
          return 2;
        }
        return 1;
      })
      .ballBombMove(),
    new StatusMove(MoveId.AROMATHERAPY, PokemonType.GRASS, -1, 5, -1, 0, 3)
      .attr(PartyStatusCureAttr, i18next.t("moveTriggers:soothingAromaWaftedThroughArea"), AbilityId.SAP_SIPPER)
      .target(MoveTarget.PARTY),
    new StatusMove(MoveId.FAKE_TEARS, PokemonType.DARK, 100, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [Stat.SPDEF], -2)
      .reflectable(),
    new AttackMove(MoveId.AIR_CUTTER, PokemonType.FLYING, MoveCategory.SPECIAL, 60, 95, 25, -1, 0, 3)
      .attr(HighCritAttr)
      .slicingMove()
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.OVERHEAT, PokemonType.FIRE, MoveCategory.SPECIAL, 130, 90, 5, -1, 0, 3)
      .attr(StatStageChangeAttr, [Stat.SPATK], -2, true)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE),
    new StatusMove(MoveId.ODOR_SLEUTH, PokemonType.NORMAL, -1, 40, -1, 0, 3)
      .attr(ExposedMoveAttr, BattlerTagType.IGNORE_GHOST)
      .ignoresSubstitute()
      .reflectable(),
    new AttackMove(MoveId.ROCK_TOMB, PokemonType.ROCK, MoveCategory.PHYSICAL, 60, 95, 15, 100, 0, 3)
      .attr(StatStageChangeAttr, [Stat.SPD], -1)
      .makesContact(false),
    new AttackMove(MoveId.SILVER_WIND, PokemonType.BUG, MoveCategory.SPECIAL, 60, 100, 5, 10, 0, 3)
      .attr(StatStageChangeAttr, [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD], 1, true)
      .windMove(),
    new StatusMove(MoveId.METAL_SOUND, PokemonType.STEEL, 85, 40, -1, 0, 3)
      .attr(StatStageChangeAttr, [Stat.SPDEF], -2)
      .soundBased()
      .reflectable(),
    new StatusMove(MoveId.GRASS_WHISTLE, PokemonType.GRASS, 55, 15, -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased()
      .reflectable(),
    new StatusMove(MoveId.TICKLE, PokemonType.NORMAL, 100, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [Stat.ATK, Stat.DEF], -1)
      .reflectable(),
    new SelfStatusMove(MoveId.COSMIC_POWER, PokemonType.PSYCHIC, -1, 20, -1, 0, 3) //
      .attr(StatStageChangeAttr, [Stat.DEF, Stat.SPDEF], 1, true),
    new AttackMove(MoveId.WATER_SPOUT, PokemonType.WATER, MoveCategory.SPECIAL, 150, 100, 5, -1, 0, 3)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.SIGNAL_BEAM, PokemonType.BUG, MoveCategory.SPECIAL, 75, 100, 15, 10, 0, 3) //
      .attr(ConfuseAttr),
    new AttackMove(MoveId.SHADOW_PUNCH, PokemonType.GHOST, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 3) //
      .punchingMove(),
    new AttackMove(MoveId.EXTRASENSORY, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 20, 10, 0, 3) //
      .attr(FlinchAttr),
    new AttackMove(MoveId.SKY_UPPERCUT, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 85, 90, 15, -1, 0, 3)
      .attr(HitsTagAttr, BattlerTagType.FLYING)
      .punchingMove(),
    new AttackMove(MoveId.SAND_TOMB, PokemonType.GROUND, MoveCategory.PHYSICAL, 35, 85, 15, -1, 0, 3)
      .attr(TrapAttr, BattlerTagType.SAND_TOMB)
      .makesContact(false),
    new AttackMove(MoveId.SHEER_COLD, PokemonType.ICE, MoveCategory.SPECIAL, 250, 30, 5, -1, 0, 3)
      .attr(IceNoEffectTypeAttr)
      .attr(OneHitKOAttr)
      .attr(SheerColdAccuracyAttr),
    new AttackMove(MoveId.MUDDY_WATER, PokemonType.WATER, MoveCategory.SPECIAL, 90, 85, 10, 30, 0, 3)
      .attr(StatStageChangeAttr, [Stat.ACC], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.BULLET_SEED, PokemonType.GRASS, MoveCategory.PHYSICAL, 25, 100, 30, -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(MoveId.AERIAL_ACE, PokemonType.FLYING, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 3) //
      .slicingMove(),
    new AttackMove(MoveId.ICICLE_SPEAR, PokemonType.ICE, MoveCategory.PHYSICAL, 25, 100, 30, -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false),
    new SelfStatusMove(MoveId.IRON_DEFENSE, PokemonType.STEEL, -1, 15, -1, 0, 3) //
      .attr(StatStageChangeAttr, [Stat.DEF], 2, true),
    new StatusMove(MoveId.BLOCK, PokemonType.NORMAL, -1, 5, -1, 0, 3)
      .condition(failIfGhostTypeCondition)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1)
      .reflectable(),
  );
}
