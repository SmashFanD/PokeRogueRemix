import { BattlerIndex } from "../../enums/battler-index.js";
import { HitResult } from "../../enums/hit-result.js";
import { StatusEffect } from "../../enums/status-effect.js";
import { globalScene } from "../../global-scene.js";
import { i18next } from "../../i18next.js";
import { coerceArray, toCamelCase } from "../../utils.js";

/**
 * class for all ability attributes.
 *
 * Each {@linkcode Ability} may have any number of individual attributes, each functioning independently from one another.
 */
export class AbAttr {
  /**
   * Whether to show this ability as a flyout when applying its effects.
   * Should be kept in parity with mainline where possible.
   * @defaultValue `true`
   */
  showAbility = true;
  /** The additional condition associated with this AbAttr, if any. */
  extraCondition;

  /**
   * Return whether this attribute is of the given type.
   *
   * @remarks
   * Used to avoid requiring the caller to have imported the specific attribute type, avoiding circular dependencies.
   *
   * @param attr - The attribute to check against
   * @returns Whether the attribute is an instance of the given type
   */
  is(attr) {
    const targetAttr = AbilityAttrs[attr];
    if (!targetAttr) {
      return false;
    }
    return this instanceof targetAttr;
  }

  /**
   * @param showAbility - Whether to show this ability as a flyout during battle; default `true`.
   * Should be kept in parity with mainline where possible.
   */
  constructor(showAbility = true) {
    this.showAbility = showAbility;
  }

  /**
   * Apply this attribute's effects without checking conditions.
   *
   * @remarks
   * **Never call this method directly!** \
   * Use {@linkcode applyAbAttrs} instead.
   */
  apply(_params) {}

  /**
   * Return the trigger message to show when this attribute is executed.
   * @param _params - The parameters passed to this attribute's {@linkcode apply} function; must match type exactly
   * @param _abilityName - The name of the current ability.
   * @privateRemarks
   * If more fields are provided than needed, any excess can be discarded using destructuring.
   * @todo Remove `null` from signature in lieu of using an empty string
   */
  getTriggerMessage(_params, _abilityName) {
    return null;
  }

  /**
   * Check whether this attribute can have its effects successfully applied.
   * Applies to **all** instances of the given attribute.
   * @param _params - The parameters passed to this attribute's {@linkcode apply} function; must match type exactly
   * @privateRemarks
   * If more fields are provided than needed, any excess can be discarded using destructuring.
   */
  canApply(_params) {
    return true;
  }

  /**
   * Return the additional condition associated with this particular AbAttr instance, if any.
   * @returns The extra condition for this {@linkcode AbAttr}, or `null` if none exist
   * @todo Make this use `undefined` instead of `null`
   * @todo Prevent this from being overridden by sub-classes
   */
  getCondition() {
    return this.extraCondition || null;
  }

  addCondition(condition) {
    this.extraCondition = condition;
    return this;
  }
}

/**
 * class for ability attributes that simply cancel an interaction
 *
 * @remarks
 * Abilities that have simple cancel interactions (e.g. {@linkcode BlockRecoilDamageAttr}) can extend this class to reuse the `canApply` and `apply` logic
 */
class CancelInteractionAbAttr extends AbAttr {
  canApply({ cancelled }) {
    return !cancelled.value;
  }

  apply({ cancelled }) {
    cancelled.value = true;
  }
}

export class BlockRecoilDamageAttr extends CancelInteractionAbAttr {
  constructor() {
    super(false);
  }

  apply({ cancelled }) {
    cancelled.value = true;
  }
}

export class PostBattleInitAbAttr extends AbAttr {
}

export class PostBattleInitFormChangeAbAttr extends PostBattleInitAbAttr {
  formFunc;

  constructor(formFunc) {
    super(false);

    this.formFunc = formFunc;
  }

  canApply({ pokemon, simulated }) {
    const formIndex = this.formFunc(pokemon);
    return formIndex !== pokemon.formIndex && !simulated;
  }

  apply({ pokemon }) {
    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
  }
}

/**
 * Class for abilities that apply effects before the defending Pokemon takes damage.
 *
 * ⚠️ This attribute must not be called via `applyAbAttrs` as its subclasses violate the Liskov Substitution Principle.
 */
// TODO: this class is effectively useless
export class PreDefendAbAttr extends AbAttr {
}

export class PreDefendFullHpEndureAbAttr extends PreDefendAbAttr {
  canApply({ pokemon, damage }) {
    return (
      pokemon.isFullHp() // Checks if pokemon has wonder_guard (which forces 1hp)
      && pokemon.getMaxHp() > 1 // Damage >= hp
      && damage.value >= pokemon.hp // Cannot apply if the pokemon already has sturdy from some other source
      && !pokemon.getTag(BattlerTagType.STURDY)
    );
  }

  apply({ pokemon, simulated }) {
    if (!simulated) {
      pokemon.addTag(BattlerTagType.STURDY, 1);
    }
  }
}

export class BlockItemTheftAbAttr extends CancelInteractionAbAttr {
  getTriggerMessage({ pokemon }, abilityName) {
    return i18next.t("abilityTriggers:blockItemTheft", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

export class StabBoostAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  canApply({ multiplier }) {
    return multiplier.value > 1;
  }

  apply({ multiplier }) {
    multiplier.value += 0.5;
  }
}

export class ReceivedMoveDamageMultiplierAbAttr extends PreDefendAbAttr {
  condition;
  damageMultiplier;

  constructor(condition, damageMultiplier, showAbility = false) {
    super(showAbility);

    this.condition = condition;
    this.damageMultiplier = damageMultiplier;
  }

  canApply({ pokemon, opponent: attacker, move }) {
    return this.condition(pokemon, attacker, move);
  }

  apply({ damage }) {
    damage.value = toDmgValue(damage.value * this.damageMultiplier);
  }
}

/** Reduces the damage dealt to an allied Pokemon. Used by Friend Guard. */
export class AlliedFieldDamageReductionAbAttr extends PreDefendAbAttr {
  damageMultiplier;

  constructor(damageMultiplier) {
    super();
    this.damageMultiplier = damageMultiplier;
  }

  apply({ damage }) {
    damage.value = toDmgValue(damage.value * this.damageMultiplier);
  }
}

export class ReceivedTypeDamageMultiplierAbAttr extends ReceivedMoveDamageMultiplierAbAttr {
  constructor(moveType, damageMultiplier) {
    super((_target, user, move) => user.getMoveType(move) === moveType, damageMultiplier, false);
  }
}

/** Determines whether a Pokemon is immune to a move because of an ability. */
export class TypeImmunityAbAttr extends PreDefendAbAttr {
  immuneType;
  condition;

  // TODO: Change `NonSuperEffectiveImmunityAbAttr` to not pass `null` as immune type
  constructor(immuneType, condition) {
    super(true);

    this.immuneType = immuneType;
    this.condition = condition ?? null;
  }

  canApply({ move, opponent: attacker, pokemon }) {
    return (
      ![MoveTarget.BOTH_SIDES, MoveTarget.ENEMY_SIDE, MoveTarget.USER_SIDE].includes(move.moveTarget)
      && attacker !== pokemon
      && attacker.getMoveType(move) === this.immuneType
    );
  }

  apply({ typeMultiplier }) {
    typeMultiplier.value = 0;
  }

  getImmuneType() {
    return this.immuneType;
  }

  getCondition() {
    return this.condition;
  }
}

export class AttackTypeImmunityAbAttr extends TypeImmunityAbAttr {
  // biome-ignore lint/complexity/noUselessConstructor: Changes the type of `immuneType`
  constructor(immuneType, condition) {
    super(immuneType, condition);
  }

  canApply(params) {
    const { move } = params;
    return (
      move.category !== MoveCategory.STATUS // TODO: make Thousand Arrows ignore Levitate in a different manner
      && !move.hasAttr("NeutralDamageAgainstFlyingTypeAttr")
      && super.canApply(params)
    );
  }
}

export class TypeImmunityHealAbAttr extends TypeImmunityAbAttr {
  // biome-ignore lint/complexity/noUselessConstructor: Changes the type of `immuneType`
  constructor(immuneType) {
    super(immuneType);
  }

  apply(params) {
    super.apply(params);
    const { pokemon, cancelled, simulated, passive } = params;
    if (!pokemon.isFullHp() && !simulated) {
      const abilityName = (passive ? pokemon.getPassiveAbility() : pokemon.getAbility()).name;
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 4),
        i18next.t("abilityTriggers:typeImmunityHeal", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          abilityName,
        }),
        true,
      );
      cancelled.value = true; // Suppresses "No Effect" message
    }
  }
}

export class TypeImmunityStatStageChangeAbAttr extends TypeImmunityAbAttr {
  stat;
  stages;

  constructor(immuneType, stat, stages, condition) {
    super(immuneType, condition);

    this.stat = stat;
    this.stages = stages;
  }

  apply(params) {
    const { cancelled, simulated, pokemon } = params;
    super.apply(params);
    cancelled.value = true; // Suppresses "No Effect" message
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        true,
        [this.stat],
        this.stages,
      );
    }
  }
}

export class TypeImmunityAddBattlerTagAbAttr extends TypeImmunityAbAttr {
  tagType;
  turnCount;

  constructor(immuneType, tagType, turnCount, condition) {
    super(immuneType, condition);

    this.tagType = tagType;
    this.turnCount = turnCount;
  }

  apply(params) {
    const { cancelled, simulated, pokemon } = params;
    super.apply(params);
    cancelled.value = true; // Suppresses "No Effect" message
    if (!simulated) {
      pokemon.addTag(this.tagType, this.turnCount, undefined, pokemon.id);
    }
  }
}

export class NonSuperEffectiveImmunityAbAttr extends TypeImmunityAbAttr {
  constructor(condition) {
    super(null, condition);
  }

  canApply({ move, typeMultiplier }) {
    return move.is("AttackMove") && typeMultiplier.value < 2;
  }

  apply({ typeMultiplier, cancelled }) {
    cancelled.value = true; // Suppresses "No Effect" message
    typeMultiplier.value = 0;
  }

  getTriggerMessage({ pokemon }, abilityName) {
    return i18next.t("abilityTriggers:nonSuperEffectiveImmunity", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

/**
 * Attribute implementing the effects of {@link https://bulbapedia.bulbagarden.net/wiki/Tera_Shell_(Ability) | Tera Shell}.
 * When the source is at full HP, incoming attacks will have a maximum 0.5x type effectiveness multiplier.
 */
export class FullHpResistTypeAbAttr extends PreDefendAbAttr {
  canApply({ typeMultiplier, move, pokemon }) {
    return (
      typeMultiplier instanceof NumberHolder
      && !move?.hasAttr("FixedDamageAttr")
      && pokemon.isFullHp()
      && typeMultiplier.value > 0.5
    );
  }

  apply({ typeMultiplier, pokemon }) {
    typeMultiplier.value = 0.5;
    pokemon.turnData.moveEffectiveness = 0.5;
  }

  getTriggerMessage({ pokemon }, _abilityName) {
    return i18next.t("abilityTriggers:fullHpResistType", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
    });
  }
}

export class FieldPriorityMoveImmunityAbAttr extends PreDefendAbAttr {
  canApply({ move, opponent: attacker, cancelled }) {
    return (
      !cancelled.value
      && !(move.moveTarget === MoveTarget.USER || move.moveTarget === MoveTarget.NEAR_ALLY)
      && move.getPriority(attacker) > 0
      && !move.isMultiTarget()
    );
  }

  apply({ cancelled }) {
    cancelled.value = true;
  }
}

// TODO: Consider examining whether this move immunity ability attribute
// can be merged with the MoveTypeMultiplierAbAttr in some way.
export class MoveImmunityAbAttr extends PreDefendAbAttr {
  immuneCondition;

  constructor(immuneCondition) {
    super(true);

    this.immuneCondition = immuneCondition;
  }

  canApply({ pokemon, opponent: attacker, move, cancelled }) {
    return !cancelled.value && this.immuneCondition(pokemon, attacker, move);
  }

  apply({ cancelled }) {
    cancelled.value = true;
  }

  getTriggerMessage({ pokemon }, _abilityName) {
    return i18next.t("abilityTriggers:moveImmunity", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) });
  }
}

/**
 * Reduces the accuracy of status moves used against the Pokémon with this ability to 50%.
 * Used by Wonder Skin.
 */
export class WonderSkinAbAttr extends PreDefendAbAttr {
  constructor() {
    super(false);
  }

  canApply({ move, accuracy }) {
    return move.category === MoveCategory.STATUS && accuracy.value >= 50;
  }

  apply({ accuracy }) {
    accuracy.value = 50;
  }
}

export class MoveImmunityStatStageChangeAbAttr extends MoveImmunityAbAttr {
  stat;
  stages;

  constructor(immuneCondition, stat, stages) {
    super(immuneCondition);
    this.stat = stat;
    this.stages = stages;
  }

  canApply(params) {
    // TODO: Evaluate whether it makes sense to check against simulated here.
    // We likely want to check 'simulated' when the apply method enqueues the phase
    return !params.simulated && super.canApply(params);
  }

  apply(params) {
    super.apply(params);
    // TODO: We probably should not unshift the phase if this is simulated
    globalScene.phaseManager.unshiftNew(
      "StatStageChangePhase",
      params.pokemon.getBattlerIndex(),
      true,
      [this.stat],
      this.stages,
    );
  }
}

export class PostDefendAbAttr extends AbAttr {
  canApply(_params) {
    return true;
  }
  apply(_params) {}
}

/** Class for abilities that make drain moves deal damage to user instead of healing them. */
export class ReverseDrainAbAttr extends PostDefendAbAttr {
  canApply({ move, opponent, simulated }) {
    const cancelled = new BooleanHolder(false);
    applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon: opponent, cancelled, simulated });
    return !cancelled.value && move.hasAttr("HitHealAttr");
  }

  /**
   * Determines if a damage and draining move was used to check if this ability should stop the healing.
   * Examples include: Absorb, Draining Kiss, Bitter Blade, etc.
   * Also displays a message to show this ability was activated.
   */
  apply({ move, simulated, opponent, pokemon }) {
    if (simulated) {
      return;
    }
    const damageAmount = move.getAttrs<"HitHealAttr">("HitHealAttr")[0].getHealAmount(opponent, pokemon);
    pokemon.turnData.damageTaken += damageAmount;
    globalScene.phaseManager.unshiftNew(
      "PokemonHealPhase",
      opponent.getBattlerIndex(),
      -damageAmount,
      null,
      false,
      true,
    );
  }

  getTriggerMessage({ opponent }) {
    return i18next.t("abilityTriggers:reverseDrain", { pokemonNameWithAffix: getPokemonNameWithAffix(opponent) });
  }
}

// TODO: Move `allOthers` to its own attribute class
export class PostDefendStatStageChangeAbAttr extends PostDefendAbAttr {
  // TODO: Review what conditions are actually used and whether they can be consolidated into the main class
  condition;
  stat;
  stages;
  selfTarget;
  allOthers;

  constructor(
    condition,
    stat,
    stages,
    selfTarget = true,
    allOthers = false,
  ) {
    super(true);

    this.condition = condition;
    this.stat = stat;
    this.stages = stages;
    this.selfTarget = selfTarget;
    this.allOthers = allOthers;
  }

  canApply({ pokemon, opponent: attacker, move }) {
    return this.condition(pokemon, attacker, move);
  }

  apply({ simulated, pokemon, opponent: attacker }) {
    if (simulated) {
      return;
    }

    if (this.allOthers) {
      const ally = pokemon.getAlly();
      const otherPokemon = ally != null ? pokemon.getOpponents().concat([ally]) : pokemon.getOpponents();
      for (const other of otherPokemon) {
        globalScene.phaseManager.unshiftNew(
          "StatStageChangePhase",
          other.getBattlerIndex(),
          false,
          [this.stat],
          this.stages,
        );
      }
    } else {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        (this.selfTarget ? pokemon : attacker).getBattlerIndex(),
        this.selfTarget,
        [this.stat],
        this.stages,
      );
    }
  }
}

export class PostDefendHpGatedStatStageChangeAbAttr extends PostDefendAbAttr {
  hpGate;
  stats;
  stages;
  selfTarget;

  constructor(hpGate, stats, stages, selfTarget = true) {
    super(true);

    this.hpGate = hpGate;
    this.stats = stats;
    this.stages = stages;
    this.selfTarget = selfTarget;
  }

  // TODO: This should trigger after the final hit of multi-strike moves, which requires an aggregated damage total
  // across all strikes (similar to Wimp Out).
  // The structure used for the former can likely be re-used for the latter.
  canApply({ pokemon, move, damage }) {
    if (move.category === MoveCategory.STATUS) {
      return false;
    }

    const threshold = toDmgValue(pokemon.getMaxHp() * this.hpGate);
    return pokemon.hp <= threshold && pokemon.hp + damage > threshold;
  }

  apply({ simulated, pokemon, opponent }) {
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        (this.selfTarget ? pokemon : opponent).getBattlerIndex(),
        true,
        this.stats,
        this.stages,
      );
    }
  }
}

export class PostDefendApplyArenaTrapTagAbAttr extends PostDefendAbAttr {
  condition;
  arenaTagType;

  constructor(condition, tagType) {
    super(true);

    this.condition = condition;
    this.arenaTagType = tagType;
  }

  canApply({ pokemon, opponent: attacker, move }) {
    const tag = globalScene.arena.getTag(this.arenaTagType);
    return this.condition(pokemon, attacker, move) && (!tag || tag.canAdd());
  }

  apply({ simulated, pokemon }) {
    if (!simulated) {
      globalScene.arena.addTag(
        this.arenaTagType,
        0,
        undefined,
        pokemon.id,
        pokemon.isPlayer() ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER,
      );
    }
  }
}

export class PostDefendApplyBattlerTagAbAttr extends PostDefendAbAttr {
  condition;
  tagType;
  constructor(condition, tagType) {
    super(true);

    this.condition = condition;
    this.tagType = tagType;
  }

  canApply({ pokemon, opponent: attacker, move }) {
    return this.condition(pokemon, attacker, move);
  }

  apply({ simulated, pokemon, move }) {
    if (!pokemon.getTag(this.tagType) && !simulated) {
      pokemon.addTag(this.tagType, undefined, undefined, pokemon.id);
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:windPowerCharged", {
          pokemonName: getPokemonNameWithAffix(pokemon),
          moveName: move.name,
        }),
      );
    }
  }
}

export class PostDefendTypeChangeAbAttr extends PostDefendAbAttr {
  type;

  canApply({ opponent: attacker, move, pokemon, hitResult }) {
    if (hitResult >= HitResult.NO_EFFECT) {
      return false;
    }

    if (pokemon.isTerastallized) {
      return false;
    }

    if (move.hasAttr("TypelessAttr")) {
      return false;
    }

    if (attacker.turnData.hitsLeft > 1) {
      return false;
    }

    this.type = attacker.getMoveType(move);
    if (pokemon.isOfType(this.type, true, true)) {
      return false;
    }

    return true;
  }

  apply({ pokemon, simulated }) {
    if (simulated) {
      return;
    }

    pokemon.summonData.types = [this.type];
  }

  getTriggerMessage({ pokemon }, abilityName) {
    return i18next.t("abilityTriggers:postDefendTypeChange", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
      typeName: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.type])}`),
    });
  }
}
export class PostDefendContactApplyStatusEffectAbAttr extends PostDefendAbAttr {
  chance;
  effects;

  constructor(chance, ...effects) {
    super(true);

    this.chance = chance;
    this.effects = effects;
  }

  canApply({ pokemon, move, opponent: attacker }) {
    const effect =
      this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randBattleSeedInt(this.effects.length)];
    return (
      move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
      && !attacker.status
      && (this.chance === -1 || pokemon.randBattleSeedInt(100) < this.chance)
      && attacker.canSetStatus(effect, true, false, pokemon)
    );
  }

  apply({ opponent: attacker, pokemon }) {
    // TODO: Probably want to check against simulated here
    const effect =
      this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randBattleSeedInt(this.effects.length)];
    attacker.trySetStatus(effect, pokemon);
  }
}

export class EffectSporeAbAttr extends PostDefendContactApplyStatusEffectAbAttr {
  constructor() {
    super(10, StatusEffect.POISON, StatusEffect.PARALYSIS, StatusEffect.SLEEP);
  }

  canApply(params) {
    const attacker = params.opponent;
    return !(attacker.isOfType(PokemonType.GRASS) || attacker.hasAbility(AbilityId.OVERCOAT)) && super.canApply(params);
  }
}

export class PostDefendContactApplyTagChanceAbAttr extends PostDefendAbAttr {
  chance;
  tagType;
  turnCount;

  constructor(chance, tagType, turnCount) {
    super();

    this.tagType = tagType;
    this.chance = chance;
    this.turnCount = turnCount;
  }

  canApply({ move, pokemon, opponent }) {
    return (
      move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: opponent, target: pokemon })
      && pokemon.randBattleSeedInt(100) < this.chance
      && opponent.canAddTag(this.tagType)
    );
  }

  apply({ pokemon, simulated, opponent, move }) {
    if (!simulated) {
      opponent.addTag(this.tagType, this.turnCount, move.id, pokemon.id);
    }
  }
}

/**
 * Set stat stages when the user gets hit by a critical hit
 *
 * @privateRemarks
 * It is the responsibility of the caller to ensure that this ability attribute is only applied
 * when the user has been hit by a critical hit; such an event is not checked here.
 *
 * @sealed
 */
export class PostReceiveCritStatStageChangeAbAttr extends AbAttr {
  stat;
  stages;

  constructor(stat, stages) {
    super();

    this.stat = stat;
    this.stages = stages;
  }

  apply({ simulated, pokemon }) {
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        true,
        [this.stat],
        this.stages,
      );
    }
  }
}

export class PostDefendContactDamageAbAttr extends PostDefendAbAttr {
  damageRatio;

  constructor(damageRatio) {
    super();

    this.damageRatio = damageRatio;
  }

  canApply({ simulated, move, opponent: attacker, pokemon }) {
    return (
      !simulated
      && move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
      && !attacker.hasAbilityWithAttr("BlockNonDirectDamageAbAttr")
    );
  }

  apply({ opponent: attacker }) {
    attacker.damageAndUpdate(toDmgValue(attacker.getMaxHp() * (1 / this.damageRatio)), { result: HitResult.INDIRECT });
    attacker.turnData.damageTaken += toDmgValue(attacker.getMaxHp() * (1 / this.damageRatio));
  }

  getTriggerMessage({ pokemon }, abilityName) {
    return i18next.t("abilityTriggers:postDefendContactDamage", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

/**
 * This ability applies the Perish Song tag to the attacking pokemon
 * and the defending pokemon if the move makes physical contact and neither pokemon
 * already has the Perish Song tag.
 */
export class PostDefendPerishSongAbAttr extends PostDefendAbAttr {
  turns;

  constructor(turns) {
    super();

    this.turns = turns;
  }

  canApply({ move, opponent: attacker, pokemon }) {
    return (
      move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
      && !attacker.getTag(BattlerTagType.PERISH_SONG)
    );
  }

  apply({ simulated, opponent: attacker, pokemon }) {
    if (!simulated) {
      attacker.addTag(BattlerTagType.PERISH_SONG, this.turns);
      pokemon.addTag(BattlerTagType.PERISH_SONG, this.turns);
    }
  }

  getTriggerMessage({ pokemon }, abilityName) {
    return i18next.t("abilityTriggers:perishBody", {
      pokemonName: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

export class PostDefendWeatherChangeAbAttr extends PostDefendAbAttr {
  weatherType;
  condition;

  constructor(weatherType, condition) {
    super();

    this.weatherType = weatherType;
    if (condition != null) {
      this.condition = condition;
    }
  }

  canApply({ pokemon, opponent: attacker, move }) {
    return (
      !(this.condition && !this.condition(pokemon, attacker, move))
      && !globalScene.arena.weather?.isImmutable()
      && globalScene.arena.canSetWeather(this.weatherType)
    );
  }

  apply({ simulated, pokemon }) {
    if (!simulated) {
      globalScene.arena.trySetWeather(this.weatherType, pokemon);
    }
  }
}

export class PostDefendAbilitySwapAbAttr extends PostDefendAbAttr {
  canApply({ move, opponent: attacker, pokemon }) {
    return (
      move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
      && attacker.getAbility().swappable
    );
  }

  apply({ simulated, opponent: attacker, pokemon }) {
    if (!simulated) {
      const tempAbility = attacker.getAbility();
      attacker.setTempAbility(pokemon.getAbility());
      pokemon.setTempAbility(tempAbility);
    }
  }

  getTriggerMessage({ pokemon }, _abilityName) {
    return i18next.t("abilityTriggers:postDefendAbilitySwap", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
    });
  }
}

export class PostDefendAbilityGiveAbAttr extends PostDefendAbAttr {
  ability;

  constructor(ability) {
    super();
    this.ability = ability;
  }

  canApply({ move, opponent: attacker, pokemon }) {
    return (
      move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
      && attacker.getAbility().suppressable
      && !attacker.getAbility().hasAttr("PostDefendAbilityGiveAbAttr")
    );
  }

  apply({ simulated, opponent: attacker }) {
    if (!simulated) {
      attacker.setTempAbility(allAbilities[this.ability]);
    }
  }

  getTriggerMessage({ pokemon }, abilityName) {
    return i18next.t("abilityTriggers:postDefendAbilityGive", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

export class PostDefendMoveDisableAbAttr extends PostDefendAbAttr {
  chance;

  constructor(chance) {
    super();

    this.chance = chance;
  }

  canApply({ move, opponent: attacker, pokemon }) {
    return (
      attacker.getTag(BattlerTagType.DISABLED) == null
      && move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
      && (this.chance === -1 || pokemon.randBattleSeedInt(100) < this.chance)
    );
  }

  apply({ simulated, opponent, pokemon }) {
    if (!simulated) {
      opponent.addTag(BattlerTagType.DISABLED, 4, 0, pokemon.id);
    }
  }
}

export class PostStatStageChangeAbAttr extends AbAttr {

  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

export class PostStatStageChangeStatStageChangeAbAttr extends PostStatStageChangeAbAttr {
  condition;
  statsToChange;
  stages;

  constructor(condition, statsToChange, stages) {
    super(true);

    this.condition = condition;
    this.statsToChange = statsToChange;
    this.stages = stages;
  }

  canApply({ pokemon, stats, stages, selfTarget }) {
    return this.condition(pokemon, stats, stages) && !selfTarget;
  }

  apply({ simulated, pokemon }) {
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        true,
        this.statsToChange,
        this.stages,
      );
    }
  }
}

export class PreAttackAbAttr extends AbAttr {
}

/**
 * Modifies moves additional effects with multipliers, e.g. Sheer Force, Serene Grace.
 */
export class MoveEffectChanceMultiplierAbAttr extends AbAttr {
  chanceMultiplier;

  constructor(chanceMultiplier) {
    super(false);
    this.chanceMultiplier = chanceMultiplier;
  }

  canApply({ chance, move }) {
    const exceptMoves = [MoveId.ORDER_UP, MoveId.ELECTRO_SHOT];
    return !(chance.value <= 0 || exceptMoves.includes(move.id));
  }

  apply({ chance }) {
    chance.value *= this.chanceMultiplier;
    chance.value = Math.min(chance.value, 100);
  }
}

/**
 * Sets incoming moves additional effect chance to zero, ignoring all effects from moves. e.g. Shield Dust.
 */
export class IgnoreMoveEffectsAbAttr extends PreDefendAbAttr {
  constructor(showAbility = false) {
    super(showAbility);
  }

  canApply({ chance }) {
    return chance.value > 0;
  }

  apply({ chance }) {
    chance.value = 0;
  }
}

export class FieldPreventExplosiveMovesAbAttr extends CancelInteractionAbAttr {}

/**
 * Multiplies a Stat if the checked Pokemon lacks this ability.
 * If this ability cannot stack, a BooleanHolder can be used to prevent this from stacking.
 */
export class FieldMultiplyStatAbAttr extends AbAttr {
  stat;
  multiplier;
  /**
   * Whether this ability can stack with others of the same type for this stat.
   * @defaultValue `false`
   * @todo Remove due to being literally useless - the ruin abilities are hardcoded to never stack in game
   */
  canStack;

  constructor(stat, multiplier, canStack = false) {
    super(false);

    this.stat = stat;
    this.multiplier = multiplier;
    this.canStack = canStack;
  }

  canApply({ hasApplied, target, stat }) {
    return (
      this.canStack
      || (!hasApplied.value
        && this.stat === stat
        && target.getAbilityAttrs("FieldMultiplyStatAbAttr").every(attr => attr.stat !== stat))
    );
  }

  apply({ statVal, hasApplied }) {
    statVal.value *= this.multiplier;
    hasApplied.value = true;
  }
}

export class MoveTypeChangeAbAttr extends PreAttackAbAttr {
  newType;
  condition;

  constructor(newType, condition) {
    super(false);

    this.newType = newType;
    this.condition = condition;
  }

  canApply({ pokemon, opponent, move }) {
    return this.condition(pokemon, opponent, move);
  }

  apply({ moveType }) {
    moveType.value = this.newType;
  }
}

/**
 * Attribute to change the user's type to that of the move currently being executed.
 * @see {@linkcode AbilityId.PROTEAN} and {@linkcode AbilityId.LIBERO}.
 */
export class PokemonTypeChangeAbAttr extends PreAttackAbAttr {
  moveType = PokemonType.UNKNOWN;
  constructor() {
    super(true);
  }

  canApply({ move, pokemon }) {
    if (
      pokemon.isTerastallized
      || move.id === MoveId.STRUGGLE /*
       * Skip moves that call other moves because these moves generate a following move that will trigger this ability attribute
       * See: https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_call_other_moves
       */
      || move.hasAttr("CallMoveAttr")
      || move.hasAttr("NaturePowerAttr") // TODO: remove this line when nature power is made to extend from `CallMoveAttr`
    ) {
      return false;
    }

    // Skip changing type if we're already of the given type as-is
    const moveType = pokemon.getMoveType(move);
    if (pokemon.getTypes().every(t => t === moveType)) {
      return false;
    }

    this.moveType = moveType;
    return true;
  }

  apply({ simulated, pokemon, move }) {
    const moveType = pokemon.getMoveType(move);

    if (!simulated) {
      this.moveType = moveType;
      pokemon.summonData.types = [moveType];
      pokemon.updateInfo();
    }
  }

  getTriggerMessage({ pokemon }, _abilityName) {
    return i18next.t("abilityTriggers:pokemonTypeChange", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      moveType: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.moveType])}`),
    });
  }
}

/**
 * Class for abilities that add additional strikes to single-target moves.
 * @see {@linkcode MoveId.PARENTAL_BOND | Parental Bond}
 */
export class AddSecondStrikeAbAttr extends PreAttackAbAttr {
  canApply({ pokemon, opponent, move }) {
    return move.canBeMultiStrikeEnhanced(pokemon, true, opponent);
  }

  apply({ hitCount }) {
    hitCount.value += 1;
  }
}

/**
 * Class for abilities that boost the damage of moves
 * For abilities that boost the base power of moves, see VariableMovePowerAbAttr
 * @param damageMultiplier the amount to multiply the damage by
 * @param condition the condition for this ability to be applied
 */
export class MoveDamageBoostAbAttr extends PreAttackAbAttr {
  damageMultiplier;
  condition;

  // TODO: This should not take a `PokemonAttackCondition` (with nullish parameters)
  // as it's effectively offloading nullishness checks to its child attributes
  constructor(damageMultiplier, condition) {
    super(false);
    this.damageMultiplier = damageMultiplier;
    this.condition = condition;
  }

  canApply({ pokemon, opponent: target, move }) {
    return this.condition(pokemon, target, move);
  }

  apply({ damage: power }) {
    power.value = toDmgValue(power.value * this.damageMultiplier);
  }
}

/*
This base class *is* allowed to be invoked directly by `applyAbAttrs`.
As such, we require that all subclasses have compatible `apply` parameters.
The `Closed` type is used to indicate that subclasses should not modify the param typing.
*/
export class VariableMovePowerAbAttr extends PreAttackAbAttr {
  /** Whether to skip this attribute's application during moveset generation */
  skipDuringMovesetGen = false;

  canApply(_params) {
    return !this.skipDuringMovesetGen || globalScene.movesetGenInProgress;
  }
  apply(_params) {}
}

export class MovePowerBoostAbAttr extends VariableMovePowerAbAttr {
  condition;
  powerMultiplier;

  constructor(condition, powerMultiplier, showAbility = false) {
    super(showAbility);
    this.condition = condition;
    this.powerMultiplier = powerMultiplier;
  }

  canApply({ pokemon, opponent, move }) {
    return this.condition(pokemon, opponent, move);
  }

  apply({ power }) {
    power.value *= this.powerMultiplier;
  }
}

export class MoveTypePowerBoostAbAttr extends MovePowerBoostAbAttr {
  skipDuringMovesetGen;
  constructor(boostedType, powerMultiplier, skipDuringMovesetGen) {
    super((pokemon, _defender, move) => pokemon?.getMoveType(move) === boostedType, powerMultiplier || 1.5, false);
    if (skipDuringMovesetGen != null) {
      this.skipDuringMovesetGen = skipDuringMovesetGen;
    }
  }
}

export class LowHpMoveTypePowerBoostAbAttr extends MoveTypePowerBoostAbAttr {
  skipDuringMovesetGen = true;
  // biome-ignore lint/complexity/noUselessConstructor: Changes the constructor params
  constructor(boostedType) {
    super(boostedType);
  }

  getCondition() {
    return pokemon => pokemon.getHpRatio() <= 0.33;
  }
}

/** Abilities which cause a variable amount of power increase. */
export class VariableMovePowerBoostAbAttr extends VariableMovePowerAbAttr {
  mult;

  /**
   * @param mult - A function which takes the user, target, and move, and returns the power multiplier. 1 means no multiplier.
   * @param showAbility - Whether to show the ability when it activates.
   */
  constructor(mult, showAbility = true) {
    super(showAbility);
    this.mult = mult;
  }

  canApply({ pokemon, opponent, move }) {
    return this.mult(pokemon, opponent, move) !== 1;
  }

  apply({ pokemon, opponent, move, power }) {
    const multiplier = this.mult(pokemon, opponent, move);
    power.value *= multiplier;
  }
}

/** Boosts the power of a Pokémon's move under certain conditions. */
export class FieldMovePowerBoostAbAttr extends AbAttr {
  // TODO: Refactor this class? It extends from base AbAttr but has preAttack methods and gets called directly instead of going through applyAbAttrsInternal
  condition;
  powerMultiplier;

  /**
   * @param condition - A function that determines whether the power boost condition is met.
   * @param powerMultiplier - The multiplier to apply to the move's power when the condition is met.
   */
  constructor(condition, powerMultiplier) {
    super(false);
    this.condition = condition;
    this.powerMultiplier = powerMultiplier;
  }

  canApply(_params) {
    return true; // logic for this attr is handled in move.ts instead of normally
  }

  apply({ pokemon, opponent, move, power }) {
    if (this.condition(pokemon, opponent, move)) {
      power.value *= this.powerMultiplier;
    }
  }
}

/** Boosts the power of a specific type of move. */
export class PreAttackFieldMoveTypePowerBoostAbAttr extends FieldMovePowerBoostAbAttr {
  /**
   * @param boostedType - The type of move that will receive the power boost.
   * @param powerMultiplier - The multiplier to apply to the move's power, defaults to 1.5 if not provided.
   */
  constructor(boostedType, powerMultiplier) {
    super((pokemon, _defender, move) => pokemon?.getMoveType(move) === boostedType, powerMultiplier || 1.5);
  }
}

/** Boosts the power of a specific type of move for all Pokemon in the field. */
export class FieldMoveTypePowerBoostAbAttr extends PreAttackFieldMoveTypePowerBoostAbAttr {}

/** Boosts the power of a specific type of move for the user and its allies. */
export class UserFieldMoveTypePowerBoostAbAttr extends PreAttackFieldMoveTypePowerBoostAbAttr {}

/** Boosts the power of moves in specified categories. */
export class AllyMoveCategoryPowerBoostAbAttr extends FieldMovePowerBoostAbAttr {
  /**
   * @param boostedCategories - The categories of moves that will receive the power boost.
   * @param powerMultiplier - The multiplier to apply to the move's power.
   */
  constructor(boostedCategories, powerMultiplier) {
    super((_pokemon, _defender, move) => boostedCategories.includes(move.category), powerMultiplier);
  }
}

export class StatMultiplierAbAttr extends AbAttr {
  stat;
  multiplier;
  /**
   * Function determining if the stat multiplier is able to be applied to the move.
   *
   * @remarks
   * Currently only used by Hustle.
   */
  condition;

  constructor(stat, multiplier, condition) {
    super(false);

    this.stat = stat;
    this.multiplier = multiplier;
    if (condition != null) {
      this.condition = condition;
    }
  }

  canApply({ pokemon, move, stat }) {
    return stat === this.stat && (!this.condition || this.condition(pokemon, null, move));
  }

  apply({ statVal }) {
    statVal.value *= this.multiplier;
  }
}

/** Multiplies a Stat from an ally pokemon's ability. */
export class AllyStatMultiplierAbAttr extends AbAttr {
  stat;
  multiplier;
  ignorable;

  /**
   * @param stat - The stat being modified
   * @param multiplier - The multiplier to apply to the stat
   * @param ignorable - Whether the multiplier can be ignored by mold breaker-like moves and abilities
   */
  constructor(stat, multiplier, ignorable = true) {
    super(false);

    this.stat = stat;
    this.multiplier = multiplier;
    this.ignorable = ignorable;
  }

  apply({ statVal }) {
    statVal.value *= this.multiplier;
  }

  canApply({ stat, ignoreAbility }) {
    return stat === this.stat && !(ignoreAbility && this.ignorable);
  }
}

/**
 * Takes effect whenever the user's move succesfully executes, such as gorilla tactics' move-locking.
 * (More specifically, whenever a move is pushed to the move history)
 */
export class ExecutedMoveAbAttr extends AbAttr {
  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

/**
 * Ability attribute for {@linkcode AbilityId.GORILLA_TACTICS | Gorilla Tactics}
 * to lock the user into its first selected move.
 */
export class GorillaTacticsAbAttr extends ExecutedMoveAbAttr {
  constructor(showAbility = false) {
    super(showAbility);
  }

  canApply({ pokemon }) {
    // TODO: Consider whether checking against simulated makes sense here
    return !pokemon.getTag(BattlerTagType.GORILLA_TACTICS);
  }

  apply({ pokemon, simulated }) {
    if (!simulated) {
      pokemon.addTag(BattlerTagType.GORILLA_TACTICS);
    }
  }
}

/*
Subclasses that the `canApply` and `apply` are not allowed to change the type of their parameters.
This is suggested via the `Closed` type.
*/
/** Base class for abilities that apply some effect after the user's move successfully executes. */
export class PostAttackAbAttr extends AbAttr {
  attackCondition;

  /** The default `attackCondition` requires that the selected move is a damaging move */
  constructor(
    attackCondition = (_user, _target, move) => move.category !== MoveCategory.STATUS,
    showAbility = true,
  ) {
    super(showAbility);

    this.attackCondition = attackCondition;
  }

  /**
   * By default, this method checks that the move used is a damaging attack before
   * applying the effect of any inherited class.
   * This can be changed by providing a different {@linkcode attackCondition} to the constructor.
   * @see {@linkcode ConfusionOnStatusEffectAbAttr} for an example of an effect that does not require a damaging move.
   */
  canApply({ pokemon, opponent, move }) {
    return this.attackCondition(pokemon, opponent, move);
  }

  apply(_params) {}
}

export class PostAttackStealHeldItemAbAttr extends PostAttackAbAttr {
  stealCondition;
  stolenItem;

  constructor(stealCondition) {
    super();
    if (stealCondition != null) {
      this.stealCondition = stealCondition;
    }
  }

  canApply(params) {
    const { simulated, pokemon, opponent, move, hitResult } = params;
    // TODO: Revisit the hitResult check here.
    // The PostAttackAbAttr should should only be invoked in cases where the move successfully connected,
    // calling `super.canApply` already checks that the move was a damage move and not a status move.
    if (
      super.canApply(params)
      && !simulated
      && hitResult < HitResult.NO_EFFECT
      && (!this.stealCondition || this.stealCondition(pokemon, opponent, move))
    ) {
      const heldItems = this.getTargetHeldItems(opponent).filter(i => i.isTransferable);
      if (heldItems.length > 0) {
        // Ensure that the stolen item in testing is the same as when the effect is applied
        this.stolenItem = heldItems[pokemon.randBattleSeedInt(heldItems.length)];
        if (globalScene.canTransferHeldItemModifier(this.stolenItem, pokemon)) {
          return true;
        }
      }
    }
    this.stolenItem = undefined;
    return false;
  }

  apply({ opponent, pokemon }) {
    const heldItems = this.getTargetHeldItems(opponent).filter(i => i.isTransferable);
    if (!this.stolenItem) {
      this.stolenItem = heldItems[pokemon.randBattleSeedInt(heldItems.length)];
    }
    if (globalScene.tryTransferHeldItemModifier(this.stolenItem, pokemon, false)) {
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:postAttackStealHeldItem", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          defenderName: opponent.name,
          stolenItemType: this.stolenItem.type.name,
        }),
      );
    }
    this.stolenItem = undefined;
  }

  getTargetHeldItems(target) {
    return globalScene.findModifiers(
      m => m instanceof PokemonHeldItemModifier && m.pokemonId === target.id,
      target.isPlayer(),
    );
  }
}

export class PostAttackApplyStatusEffectAbAttr extends PostAttackAbAttr {
  contactRequired;
  chance;
  effects;

  constructor(contactRequired, chance, ...effects) {
    super();

    this.contactRequired = contactRequired;
    this.chance = chance;
    this.effects = effects;
  }

  canApply(params) {
    const { simulated, pokemon, move, opponent } = params;
    if (
      super.canApply(params)
      && (simulated
        || (!opponent.hasAbilityWithAttr("IgnoreMoveEffectsAbAttr")
          && pokemon !== opponent
          && (!this.contactRequired
            || move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user, target: opponent }))
          && pokemon.randBattleSeedInt(100) < this.chance
          && !pokemon.status))
    ) {
      const effect =
        this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randBattleSeedInt(this.effects.length)];
      return simulated || opponent.canSetStatus(effect, true, false, pokemon);
    }

    return false;
  }

  apply({ pokemon, opponent }) {
    const effect =
      this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randBattleSeedInt(this.effects.length)];
    opponent.trySetStatus(effect, pokemon);
  }
}

export class PostAttackContactApplyStatusEffectAbAttr extends PostAttackApplyStatusEffectAbAttr {
  constructor(chance, ...effects) {
    super(true, chance, ...effects);
  }
}

export class PostAttackApplyBattlerTagAbAttr extends PostAttackAbAttr {
  contactRequired;
  chance;
  effects;

  constructor(
    contactRequired,
    chance,
    ...effects
  ) {
    super(undefined, false);

    this.contactRequired = contactRequired;
    this.chance = chance;
    this.effects = effects;
  }

  canApply(params) {
    const { pokemon, move, opponent } = params;
    // Battler tags inflicted by abilities post attacking are also considered additional effects.
    return (
      super.canApply(params)
      && !opponent.hasAbilityWithAttr("IgnoreMoveEffectsAbAttr")
      && pokemon !== opponent
      && (!this.contactRequired
        || move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: opponent, target: pokemon }))
      && pokemon.randBattleSeedInt(100) < this.chance(opponent, pokemon, move)
      && !pokemon.status
    );
  }

  apply({ pokemon, simulated, opponent }) {
    if (!simulated) {
      const effect =
        this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randBattleSeedInt(this.effects.length)];
      opponent.addTag(effect);
    }
  }
}

export class PostDefendStealHeldItemAbAttr extends PostDefendAbAttr {
  condition;
  stolenItem;

  constructor(condition) {
    super();
    if (condition) {
      this.condition = condition;
    }
  }

  canApply({ simulated, pokemon, opponent, move, hitResult }) {
    if (!simulated && hitResult < HitResult.NO_EFFECT && (!this.condition || this.condition(pokemon, opponent, move))) {
      const heldItems = this.getTargetHeldItems(opponent).filter(i => i.isTransferable);
      if (heldItems.length > 0) {
        this.stolenItem = heldItems[pokemon.randBattleSeedInt(heldItems.length)];
        if (globalScene.canTransferHeldItemModifier(this.stolenItem, pokemon)) {
          return true;
        }
      }
    }
    return false;
  }

  apply({ pokemon, opponent }) {
    const heldItems = this.getTargetHeldItems(opponent).filter(i => i.isTransferable);
    if (!this.stolenItem) {
      this.stolenItem = heldItems[pokemon.randBattleSeedInt(heldItems.length)];
    }
    if (globalScene.tryTransferHeldItemModifier(this.stolenItem, pokemon, false)) {
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:postDefendStealHeldItem", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          attackerName: opponent.name,
          stolenItemType: this.stolenItem.type.name,
        }),
      );
    }
    this.stolenItem = undefined;
  }

  getTargetHeldItems(target) {
    return globalScene.findModifiers(
      m => m instanceof PokemonHeldItemModifier && m.pokemonId === target.id,
      target.isPlayer(),
    );
  }
}

/*
Subclasses that the `canApply` and `apply` methods of `PostSetStatusAbAttr` are not allowed to change the
type of their parameters. This is enforced via the Closed type.
*/
/** Base class for defining all ability attributes that activate after a status effect has been set. */
export class PostSetStatusAbAttr extends AbAttr {
  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

/**
 * When the user is burned, paralyzed, or poisoned by an opponent, the opponent receives the same status.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Synchronize_(Ability) | Synchronize (Bulbapedia)}
 */
export class SynchronizeStatusAbAttr extends PostSetStatusAbAttr {
  /**
   * @returns Whether the status effect that was set is one of the synchronizable statuses:
   * - {@linkcode StatusEffect.BURN | Burn}
   * - {@linkcode StatusEffect.PARALYSIS | Paralysis}
   * - {@linkcode StatusEffect.POISON | Poison}
   * - {@linkcode StatusEffect.TOXIC | Toxic}
   */
  canApply({ sourcePokemon, effect }) {
    /** Synchronizable statuses */
    const syncStatuses = new Set<StatusEffect>([
      StatusEffect.BURN,
      StatusEffect.PARALYSIS,
      StatusEffect.POISON,
      StatusEffect.TOXIC,
    ]);

    // synchronize does not need to check canSetStatus because the ability shows even if it fails to set the status
    return (sourcePokemon ?? false) && syncStatuses.has(effect);
  }

  /**
   * If the `StatusEffect` that was set is Burn, Paralysis, Poison, or Toxic, and the status
   * was set by a source Pokemon, set the source Pokemon's status to the same `StatusEffect`.
   */
  apply({ simulated, effect, sourcePokemon, pokemon }) {
    if (!simulated && sourcePokemon) {
      sourcePokemon.trySetStatus(effect, pokemon);
    }
  }
}

/**
 * Base class for abilities that apply an effect after the user knocks out an opponent in battle.
 *
 * Not to be confused with {@linkcode PostKnockOutAbAttr}, which applies after any pokemon is knocked out in battle.
 */
export class PostVictoryAbAttr extends AbAttr {
  canApply(_params) {
    return true;
  }

  apply(_params) {}
}
export class PostVictoryStatStageChangeAbAttr extends PostVictoryAbAttr {
  stats;
  stages;

  constructor(stats, stages) {
    super();

    this.stats = stats;
    this.stages = stages;
  }

  apply({ pokemon, simulated }) {
    if (simulated) {
      return;
    }

    const stats = coerceArray(typeof this.stats === "function" ? this.stats(pokemon) : this.stats);
    globalScene.phaseManager.unshiftNew("StatStageChangePhase", pokemon.getBattlerIndex(), true, stats, this.stages);
  }
}

export class PostVictoryFormChangeAbAttr extends PostVictoryAbAttr {
  formFunc;

  constructor(formFunc) {
    super(true);

    this.formFunc = formFunc;
  }

  canApply({ pokemon }) {
    const formIndex = this.formFunc(pokemon);
    return formIndex !== pokemon.formIndex;
  }

  apply({ simulated, pokemon }) {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
    }
  }
}

/**
 * Base class for ability attributes that apply after a Pokemon (other than the user) is knocked out, including indirectly.
 *
 * Not to be confused with {@linkcode PostVictoryAbAttr}, which applies after the user directly knocks out an opponent.
 */
export class PostKnockOutAbAttr extends AbAttr {
  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

export class PostKnockOutStatStageChangeAbAttr extends PostKnockOutAbAttr {
  stat;
  stages;

  constructor(stat, stages) {
    super();

    this.stat = stat;
    this.stages = stages;
  }

  apply({ pokemon, simulated }) {
    const stat = typeof this.stat === "function" ? this.stat(pokemon) : this.stat;
    if (!simulated) {
      globalScene.phaseManager.unshiftNew("StatStageChangePhase", pokemon.getBattlerIndex(), true, [stat], this.stages);
    }
  }
}

export class CopyFaintedAllyAbilityAbAttr extends PostKnockOutAbAttr {
  canApply({ pokemon, victim }) {
    return pokemon.isPlayer() === victim.isPlayer() && victim.getAbility().copiable;
  }

  apply({ pokemon, simulated, victim }) {
    if (!simulated) {
      pokemon.setTempAbility(victim.getAbility());
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:copyFaintedAllyAbility", {
          pokemonNameWithAffix: getPokemonNameWithAffix(victim),
          abilityName: allAbilities[victim.getAbility().id].name,
        }),
      );
    }
  }
}

/**
 * Ability attribute for ignoring the opponent's stat changes
 * @param stats the stats that should be ignored
 */
export class IgnoreOpponentStatStagesAbAttr extends AbAttr {
  stats;

  constructor(stats) {
    super(false);

    this.stats = stats ?? BATTLE_STATS;
  }

  canApply({ stat }) {
    return this.stats.includes(stat);
  }

  apply({ ignored }) {
    ignored.value = true;
  }
}

/**
 * Abilities with this attribute prevent the user from being affected by Intimidate.
 * @sealed
 */
export class IntimidateImmunityAbAttr extends CancelInteractionAbAttr {
  constructor() {
    super(false);
  }

  getTriggerMessage({ pokemon }, abilityName, ..._args) {
    return i18next.t("abilityTriggers:intimidateImmunity", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

export class PostIntimidateStatStageChangeAbAttr extends AbAttr {
  stats;
  stages;
  overwrites;

  constructor(stats, stages, overwrites) {
    super(true);
    this.stats = stats;
    this.stages = stages;
    this.overwrites = !!overwrites;
  }

  apply({ pokemon, simulated, cancelled }) {
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        false,
        this.stats,
        this.stages,
      );
    }
    cancelled.value = this.overwrites;
  }
}

/** Base class for ability attributes that active after a Pokemon is summoned */
export class PostSummonAbAttr extends AbAttr {
  /**
   * Whether to activate the ability when gained in battle
   * @defaultValue `true`
   * @remarks
   * Used exclusively by Imposter.
   */
  // TODO: Make this a publicly accessible getter
  activateOnGain;

  // TODO: Evaluate if this should default to `false` for base class consistency
  // TODO: Make `activateOnGain` parameter an overridable property
  constructor(showAbility = true, activateOnGain = true) {
    super(showAbility);
    this.activateOnGain = activateOnGain;
  }

  /**
   * @returns Whether the ability should activate when gained in battle
   */
  shouldActivateOnGain() {
    return this.activateOnGain;
  }

  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

/** Base class for ability attributes which remove an effect on summon */
export class PostSummonRemoveEffectAbAttr extends PostSummonAbAttr {}

/** Attribute to remove the specified arena tags when a Pokemon is summoned. */
export class PostSummonRemoveArenaTagAbAttr extends PostSummonAbAttr {
  /** The arena tags that this attribute should remove. */
  arenaTags;

  /**
   * @param tagTypes - The arena tags that this attribute should remove
   */
  constructor(tagTypes) {
    super(true);
    this.arenaTags = tagTypes;
  }

  canApply(_params) {
    return globalScene.arena.hasTag(this.arenaTags);
  }

  apply({ simulated }) {
    if (simulated) {
      return;
    }
    globalScene.arena.removeTagsOnSide(this.arenaTags, ArenaTagSide.BOTH);
  }
}

/** Generic class to add an arena tag upon switching in */
export class PostSummonAddArenaTagAbAttr extends PostSummonAbAttr {
  tagType;
  turnCount;
  side;
  quiet;
  // TODO: This should not need to track the source ID in a tempvar
  sourceId;

  constructor(showAbility, tagType, turnCount, side, quiet) {
    super(showAbility);
    this.tagType = tagType;
    this.turnCount = turnCount;
    this.side = side;
    this.quiet = quiet;
  }

  apply({ pokemon, simulated }) {
    this.sourceId = pokemon.id;
    if (!simulated) {
      globalScene.arena.addTag(this.tagType, this.turnCount, undefined, this.sourceId, this.side, this.quiet);
    }
  }
}

export class PostSummonMessageAbAttr extends PostSummonAbAttr {
  messageFunc;

  constructor(messageFunc) {
    super(true);

    this.messageFunc = messageFunc;
  }

  apply({ simulated, pokemon }) {
    if (!simulated) {
      globalScene.phaseManager.queueMessage(this.messageFunc(pokemon));
    }
  }
}

// TODO: This should be merged with message func
export class PostSummonUnnamedMessageAbAttr extends PostSummonAbAttr {
  //Attr doesn't force pokemon name on the message
  message;

  constructor(message) {
    super(true);

    this.message = message;
  }

  apply({ simulated }) {
    if (!simulated) {
      globalScene.phaseManager.queueMessage(this.message);
    }
  }
}

export class PostSummonAddBattlerTagAbAttr extends PostSummonAbAttr {
  tagType;
  turnCount;

  constructor(tagType, turnCount, showAbility) {
    super(showAbility);

    this.tagType = tagType;
    this.turnCount = turnCount;
  }

  canApply({ pokemon }) {
    return pokemon.canAddTag(this.tagType);
  }

  apply({ simulated, pokemon }) {
    if (!simulated) {
      pokemon.addTag(this.tagType, this.turnCount);
    }
  }
}

/**
 * Removes Specific battler tags when a Pokemon is summoned
 *
 * This should realistically only ever activate on gain rather than on summon
 */
export class PostSummonRemoveBattlerTagAbAttr extends PostSummonRemoveEffectAbAttr {
  immuneTags;

  /**
   * @param immuneTags - The {@linkcode BattlerTagType | battler tags} the Pokémon is immune to.
   */
  constructor(...immuneTags) {
    super();
    this.immuneTags = immuneTags;
  }

  canApply({ pokemon }) {
    return this.immuneTags.some(tagType => !!pokemon.getTag(tagType));
  }

  apply({ pokemon }) {
    // biome-ignore lint/suspicious/useIterableCallbackReturn: the return type of `removeTag` is `void`
    this.immuneTags.forEach(tagType => pokemon.removeTag(tagType));
  }
}

export class PostSummonStatStageChangeAbAttr extends PostSummonAbAttr {
  stats;
  stages;
  selfTarget;
  intimidate;

  constructor(stats, stages, selfTarget = false, intimidate = false) {
    super(true);

    this.stats = stats;
    this.stages = stages;
    this.selfTarget = selfTarget;
    this.intimidate = intimidate;
  }

  apply({ pokemon, simulated }) {
    if (simulated) {
      return;
    }

    if (this.selfTarget) {
      // we unshift the StatStageChangePhase to put it right after the showAbility and not at the end of the
      // phase list (which could be after CommandPhase for example)
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        true,
        this.stats,
        this.stages,
      );
      return;
    }

    for (const opponent of pokemon.getOpponentsGenerator()) {
      const cancelled = new BooleanHolder(false);
      if (this.intimidate) {
        const paramsParamsWithCancel = { pokemon: opponent, cancelled, simulated };
        applyAbAttrs("IntimidateImmunityAbAttr", params);
        applyAbAttrs("PostIntimidateStatStageChangeAbAttr", params);

        if (opponent.getTag(BattlerTagType.SUBSTITUTE)) {
          cancelled.value = true;
        }
      }
      if (!cancelled.value) {
        globalScene.phaseManager.unshiftNew(
          "StatStageChangePhase",
          opponent.getBattlerIndex(),
          false,
          this.stats,
          this.stages,
        );
      }
    }
  }
}

export class PostSummonAllyHealAbAttr extends PostSummonAbAttr {
  healRatio;
  showAnim;

  constructor(healRatio, showAnim = false) {
    super();

    this.healRatio = healRatio || 4;
    this.showAnim = showAnim;
  }

  canApply({ pokemon }) {
    return pokemon.getAlly()?.isActive(true) ?? false;
  }

  apply({ pokemon, simulated }) {
    const target = pokemon.getAlly();
    if (!simulated && target != null) {
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        target.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / this.healRatio),
        i18next.t("abilityTriggers:postSummonAllyHeal", {
          pokemonNameWithAffix: getPokemonNameWithAffix(target),
          pokemonName: pokemon.name,
        }),
        true,
        !this.showAnim,
      );
    }
  }
}

/**
 * Resets an ally's temporary stat boots to zero with no regard to
 * whether this is a positive or negative change
 */
export class PostSummonClearAllyStatStagesAbAttr extends PostSummonAbAttr {
  canApply({ pokemon }) {
    return pokemon.getAlly()?.isActive(true) ?? false;
  }

  apply({ pokemon, simulated }) {
    const target = pokemon.getAlly();
    if (!simulated && target != null) {
      for (const s of BATTLE_STATS) {
        target.setStatStage(s, 0);
      }

      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:postSummonClearAllyStats", {
          pokemonNameWithAffix: getPokemonNameWithAffix(target),
        }),
      );
    }
  }
}

/**
 * Raises the user's Attack Special Attack stat by one stage depending on the lower of the foes' defensive stats.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Download_(Ability) | Download (Bulbapedia)}
 */
export class DownloadAbAttr extends PostSummonAbAttr {
  enemyDef;
  enemySpDef;
  enemyCountTally;
  stats;

  canApply({ pokemon }) {
    this.enemyDef = 0;
    this.enemySpDef = 0;
    this.enemyCountTally = 0;

    for (const opponent of pokemon.getOpponents()) {
      this.enemyCountTally++;
      this.enemyDef += opponent.getEffectiveStat(Stat.DEF);
      this.enemySpDef += opponent.getEffectiveStat(Stat.SPDEF);
    }
    this.enemyDef = Math.round(this.enemyDef / this.enemyCountTally);
    this.enemySpDef = Math.round(this.enemySpDef / this.enemyCountTally);
    return this.enemyDef > 0 && this.enemySpDef > 0;
  }

  apply({ pokemon, simulated }) {
    if (this.enemyDef < this.enemySpDef) {
      this.stats = [Stat.ATK];
    } else {
      this.stats = [Stat.SPATK];
    }

    if (!simulated) {
      globalScene.phaseManager.unshiftNew("StatStageChangePhase", pokemon.getBattlerIndex(), false, this.stats, 1);
    }
  }
}

export class PostSummonWeatherChangeAbAttr extends PostSummonAbAttr {
  weatherType;

  constructor(weatherType) {
    super();

    this.weatherType = weatherType;
  }

  canApply(_params) {
    const weatherReplaceable =
      this.weatherType === WeatherType.HEAVY_RAIN
      || this.weatherType === WeatherType.HARSH_SUN
      || this.weatherType === WeatherType.STRONG_WINDS
      || this.weatherType === WeatherType.NONE
      || !globalScene.arena.weather?.isImmutable();
    return weatherReplaceable && globalScene.arena.canSetWeather(this.weatherType);
  }

  apply({ pokemon, simulated }) {
    if (!simulated) {
      globalScene.arena.trySetWeather(this.weatherType, pokemon);
    }
  }
}

/** Heals a status effect if the Pokemon is afflicted with it upon switch in (or gain) */
export class PostSummonHealStatusAbAttr extends PostSummonRemoveEffectAbAttr {
  immuneEffects;
  statusHealed;

  /**
   * @param immuneEffects - The {@linkcode StatusEffect}s the Pokémon is immune to.
   */
  constructor(...immuneEffects) {
    super();
    this.immuneEffects = immuneEffects;
  }

  canApply({ pokemon }) {
    const status = pokemon.status?.effect;
    const immuneEffects = this.immuneEffects;
    return status != null && (immuneEffects.length === 0 || immuneEffects.includes(status));
  }

  apply({ pokemon }) {
    // TODO: should probably check against simulated...
    const status = pokemon.status?.effect;
    if (status != null) {
      this.statusHealed = status;
      pokemon.resetStatus(false);
      pokemon.updateInfo();
    }
  }

  getTriggerMessage({ pokemon }) {
    if (this.statusHealed) {
      return getStatusEffectHealText(this.statusHealed, getPokemonNameWithAffix(pokemon));
    }
    return null;
  }
}

export class PostSummonFormChangeAbAttr extends PostSummonAbAttr {
  formFunc;

  constructor(formFunc) {
    super(true);

    this.formFunc = formFunc;
  }

  canApply({ pokemon }) {
    return this.formFunc(pokemon) !== pokemon.formIndex;
  }

  apply({ pokemon, simulated }) {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
    }
  }
}

/**
 * Attempts to copy a pokemon's ability
 *
 * @remarks
 * Hardcodes idiosyncrasies specific to trace, so should not be used for other abilities
 * that might copy abilities in the future
 * @sealed
 */
export class PostSummonCopyAbilityAbAttr extends PostSummonAbAttr {
  target;
  targetAbilityName;

  canApply({ pokemon, simulated }) {
    const targets = pokemon
      .getOpponents()
      .filter(t => t.getAbility().copiable || t.getAbility().id === AbilityId.WONDER_GUARD);
    if (targets.length === 0) {
      return false;
    }

    let target;
    // simulated call always chooses first target so as to not advance RNG
    if (targets.length > 1 && !simulated) {
      target = targets[randSeedInt(targets.length)];
    } else {
      target = targets[0];
    }

    this.target = target;
    this.targetAbilityName = allAbilities[target.getAbility().id].name;
    return true;
  }

  apply({ pokemon, simulated }) {
    // Protect against this somehow being called before canApply by ensuring target is defined
    if (!simulated && this.target) {
      pokemon.setTempAbility(this.target.getAbility());
      this.target.revealAbility();
      pokemon.updateInfo();
    }
  }

  getTriggerMessage({ pokemon }, _abilityName) {
    return i18next.t("abilityTriggers:trace", {
      pokemonName: getPokemonNameWithAffix(pokemon),
      targetName: getPokemonNameWithAffix(this.target),
      abilityName: this.targetAbilityName,
    });
  }
}

/** Removes supplied status effects from the user's field. */
export class PostSummonUserFieldRemoveStatusEffectAbAttr extends PostSummonAbAttr {
  statusEffect;

  /**
   * @param statusEffect - The status effects to be removed from the user's field.
   */
  constructor(...statusEffect) {
    super(false);

    this.statusEffect = statusEffect;
  }

  canApply({ pokemon }) {
    const party = pokemon.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField();
    return party.filter(p => p.isAllowedInBattle()).length > 0;
  }

  apply({ pokemon, simulated }) {
    if (simulated) {
      return;
    }

    for (const partyPokemon of pokemon.getAlliesGenerator()) {
      if (partyPokemon.status && this.statusEffect.includes(partyPokemon.status.effect)) {
        globalScene.phaseManager.queueMessage(
          getStatusEffectHealText(partyPokemon.status.effect, getPokemonNameWithAffix(partyPokemon)),
        );
        partyPokemon.resetStatus(false);
        partyPokemon.updateInfo();
      }
    }
  }
}

/**
 * Copies the stat stages and critical hit stage of the user's ally.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Costar_(Ability) | Costar (Bulbapedia)}
 * @remarks This need rework, should be able to choose Out of field pkmn since stat stage and crit stage will not be removed on switch
 */
export class PostSummonCopyAllyStatsAbAttr extends PostSummonAbAttr {
  ally;

  canApply({ pokemon }) {
    //if (!globalScene.currentBattle.double) {
    //  return false;
    //}

    //const ally = pokemon.getAlly();
    //if (!ally?.isActive(true)) {
    //  return false;
    //}
    //this.ally = ally;

    //return true;
  }

  apply({ pokemon, simulated }) {
    if (simulated) {
      return;
    }

    for (const s of BATTLE_STATS) {
      pokemon.setStatStage(s, this.ally.getStatStage(s));
    }
    pokemon.updateInfo();

    const dragonCheerTag = this.ally.getTag(BattlerTagType.DRAGON_CHEER);
    if (dragonCheerTag) {
      pokemon.addTag(BattlerTagType.DRAGON_CHEER);
      (pokemon.getTag(CritBoostTag)).critStages = dragonCheerTag.critStages;
    }

    const critBoostTag = this.ally.getTag(BattlerTagType.CRIT_BOOST);
    if (critBoostTag) {
      pokemon.addTag(BattlerTagType.CRIT_BOOST);
    }

    const laserFocusTag = this.ally.getTag(BattlerTagType.ALWAYS_CRIT);
    if (laserFocusTag) {
      pokemon.addTag(BattlerTagType.ALWAYS_CRIT);
    }
  }

  getTriggerMessage({ pokemon }, _abilityName) {
    return i18next.t("abilityTriggers:costar", {
      pokemonName: getPokemonNameWithAffix(pokemon),
      allyName: getPokemonNameWithAffix(this.ally),
    });
  }
}

/**
 * Causes the user to transform into a random opposing Pokémon on entry.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Imposter_(Ability) | Imposter (Bulbapedia)}
 */
export class PostSummonTransformAbAttr extends PostSummonAbAttr {
  targetIndex = BattlerIndex.ATTACKER;
  constructor() {
    super(true, false);
  }

  /**
   * Return the correct opponent for Imposter to copy, barring enemies with fusions, substitutes and illusions.
   * @param user - The {@linkcode Pokemon} with this ability.
   * @returns The {@linkcode Pokemon} to transform into, or `undefined` if none are eligible.
   * @remarks
   * This sets the `targetIndex` field to the target's {@linkcode BattlerIndex} on success.
   */
  getTarget(user) {
    // As opposed to the mainline behavior of "always copy the opposite slot",
    // PKR Imposter instead attempts to copy a random eligible opposing Pokemon meeting Transform's criteria.
    // If none are eligible to copy, it will not activate.
    const targets = user.getOpponents().filter(opp => user.canTransformInto(opp));
    if (targets.length === 0) {
      return;
    }

    const mon = targets[user.randBattleSeedInt(targets.length)];
    this.targetIndex = mon.getBattlerIndex();
    return mon;
  }

  canApply({ pokemon }) {
    const target = this.getTarget(pokemon);

    return !!target;
  }

  apply({ pokemon }) {
    globalScene.phaseManager.unshiftNew("PokemonTransformPhase", pokemon.getBattlerIndex(), this.targetIndex, true);
  }
}

/**
 * Reverts weather-based forms to their normal forms when the user is summoned.
 * Used by Cloud Nine and Air Lock.
 */
export class PostSummonWeatherSuppressedFormChangeAbAttr extends PostSummonAbAttr {
  canApply(_params) {
    return getPokemonWithWeatherBasedForms().length > 0;
  }

  /**
   * Triggers {@linkcode Arena.triggerWeatherBasedFormChangesToNormal | triggerWeatherBasedFormChangesToNormal}
   */
  apply({ simulated }) {
    if (!simulated) {
      globalScene.arena.triggerWeatherBasedFormChangesToNormal();
    }
  }
}

/**
 * Triggers weather-based form change when summoned into an active weather.
 * Used by Forecast and Flower Gift.
 */
export class PostSummonFormChangeByWeatherAbAttr extends PostSummonAbAttr {
  /**
   * Determine if the pokemon has a forme change that is triggered by the weather
   */
  canApply({ pokemon }) {
    return !!pokemonFormChanges[pokemon.species.speciesId]?.some(
      fc => fc.findTrigger(SpeciesFormChangeWeatherTrigger) && fc.canChange(pokemon),
    );
  }

  /**
   * Calls the {@linkcode BattleScene.triggerPokemonFormChange | triggerPokemonFormChange} for both
   * {@linkcode SpeciesFormChangeWeatherTrigger} and
   * {@linkcode SpeciesFormChangeRevertWeatherFormTrigger} if it
   * is the specific Pokemon and ability
   */
  apply({ pokemon, simulated }) {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeWeatherTrigger);
    }
  }
}

/** Base class for ability attributes that apply their effect when their user switches out. */
// TODO: Clarify the differences between this and `PreLeaveFieldAbAttr`
export class PreSwitchOutAbAttr extends AbAttr {
  constructor(showAbility = true) {
    super(showAbility);
  }

  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

/** Resets all status effects on the user when it switches out. */
export class PreSwitchOutResetStatusAbAttr extends PreSwitchOutAbAttr {
  constructor() {
    super(false);
  }

  canApply({ pokemon }) {
    return pokemon.status != null;
  }

  apply({ pokemon, simulated }) {
    if (!simulated) {
      pokemon.resetStatus();
      pokemon.updateInfo();
    }
  }
}

export class PreSwitchOutHealAbAttr extends PreSwitchOutAbAttr {
  constructor() {
    super(false);
  }

  canApply({ pokemon }) {
    return !pokemon.isFullHp();
  }

  apply({ pokemon, simulated }) {
    if (!simulated) {
      const healAmount = toDmgValue(pokemon.getMaxHp() * 0.33);
      pokemon.heal(healAmount);
      pokemon.updateInfo();
    }
  }
}

/** Attribute for form changes that occur on switching out */
export class PreSwitchOutFormChangeAbAttr extends PreSwitchOutAbAttr {
  formFunc;

  constructor(formFunc) {
    super();

    this.formFunc = formFunc;
  }

  canApply({ pokemon }) {
    return this.formFunc(pokemon) !== pokemon.formIndex;
  }

  apply({ simulated, pokemon }) {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
    }
  }
}

/** Base class for ability attributes that apply their effect just before the user leaves the field */
export class PreLeaveFieldAbAttr extends AbAttr {
  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

/**
 * Ability attribute to clear a primal {@linkcode WeatherType} upon this Pokemon switching out.
 */
export class PreLeaveFieldClearWeatherAbAttr extends PreLeaveFieldAbAttr {
  weatherType;

  constructor(weatherType) {
    super(false);

    this.weatherType = weatherType;
  }

  canApply({ pokemon }) {
    const weatherType = globalScene.arena.weatherType;
    if (weatherType !== this.weatherType) {
      return false;
    }

    // Clear immutable weather only if no other Pokemon with this attribute for the given weather type exists
    return !globalScene
      .getField(true)
      .some(
        p =>
          p !== pokemon
          && p.getAbilityAttrs("PreLeaveFieldClearWeatherAbAttr").some(attr => attr.weatherType === this.weatherType),
      );
  }

  apply({ simulated }) {
    if (!simulated) {
      globalScene.arena.trySetWeather(WeatherType.NONE);
    }
  }
}

/**
 * Attribute that updates the active {@linkcode SuppressAbilitiesTag} when its user leaves the field.
 * @sealed
 */
export class PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr extends PreLeaveFieldAbAttr {
  constructor() {
    super(false);
  }

  canApply(_params) {
    return !!globalScene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS);
  }

  apply(_params) {
    const suppressTag = globalScene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS);
    suppressTag.onSourceLeave(globalScene.arena);
  }
}

/**
 * Base class for ability attributes that apply their effect before a stat stage change.
 */
export class PreStatStageChangeAbAttr extends AbAttr {
  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

/**
 * Reflect all {@linkcode BattleStat} reductions caused by other Pokémon's moves and Abilities.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Mirror_Armor_(Ability) | Mirror Armor (Bulbapedia)}
 */
export class ReflectStatStageChangeAbAttr extends PreStatStageChangeAbAttr {
  /** The stat to reflect */
  reflectedStat;

  canApply({ source, cancelled }) {
    return !!source && !cancelled.value;
  }

  apply({ source, cancelled, stat, simulated, stages }) {
    if (!source) {
      return;
    }
    this.reflectedStat = stat;
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        source.getBattlerIndex(),
        false,
        [stat],
        stages,
        true,
        false,
        true,
        null,
        true,
      );
    }
    cancelled.value = true;
  }

  getTriggerMessage({ pokemon }, abilityName) {
    return i18next.t("abilityTriggers:protectStat", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
      statName: this.reflectedStat ? i18next.t(getStatKey(this.reflectedStat)) : i18next.t("battle:stats"),
    });
  }
}

/**
 * Protect one or all {@linkcode BattleStat} from reductions caused by other Pokémon's moves and Abilities
 */
export class ProtectStatAbAttr extends PreStatStageChangeAbAttr {
  /** {@linkcode BattleStat} to protect or `undefined` if **all** {@linkcode BattleStat} are */
  protectedStat;

  constructor(protectedStat) {
    super();
    if (protectedStat != null) {
      this.protectedStat = protectedStat;
    }
  }

  canApply({ stat, cancelled }) {
    return !cancelled.value && (this.protectedStat == null || stat === this.protectedStat);
  }

  apply({ cancelled }) {
    cancelled.value = true;
  }

  getTriggerMessage({ pokemon }, abilityName) {
    return i18next.t("abilityTriggers:protectStat", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
      statName: this.protectedStat ? i18next.t(getStatKey(this.protectedStat)) : i18next.t("battle:stats"),
    });
  }
}

/**
 * This attribute applies confusion to the target whenever the user
 * directly poisons them with a move, e.g. Poison Puppeteer.
 * Called in {@linkcode StatusEffectAttr}.
 */
export class ConfusionOnStatusEffectAbAttr extends AbAttr {
  /** List of effects to apply confusion after */
  effects;

  constructor(...effects) {
    super();
    this.effects = new Set(effects);
  }

  canApply({ opponent, effect }) {
    return this.effects.has(effect) && !opponent.isFainted() && opponent.canAddTag(BattlerTagType.CONFUSED);
  }

  apply({ opponent, simulated, pokemon }) {
    if (!simulated) {
      opponent.addTag(BattlerTagType.CONFUSED, pokemon.randBattleSeedIntRange(2, 5), undefined, opponent.id);
    }
  }
}

export class PreSetStatusAbAttr extends AbAttr {
  /** Return whether the ability attribute can be applied */
  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

/** Provides immunity to status effects to specified targets. */
export class PreSetStatusEffectImmunityAbAttr extends PreSetStatusAbAttr {
  immuneEffects;

  /**
   * @param immuneEffects - An array of {@linkcode StatusEffect}s to prevent application.
   * If none are provided, will block **all** status effects regardless of type.
   */
  constructor(...immuneEffects) {
    super();

    this.immuneEffects = immuneEffects;
  }

  canApply({ effect, cancelled }) {
    return (
      !cancelled.value
      && ((this.immuneEffects.length === 0 && effect !== StatusEffect.FAINT) || this.immuneEffects.includes(effect))
    );
  }

  apply({ cancelled }) {
    cancelled.value = true;
  }

  getTriggerMessage({ pokemon, effect }, abilityName) {
    return this.immuneEffects.length > 0
      ? i18next.t("abilityTriggers:statusEffectImmunityWithName", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          abilityName,
          statusEffectName: getStatusEffectDescriptor(effect),
        })
      : i18next.t("abilityTriggers:statusEffectImmunity", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          abilityName,
        });
  }
}

// NOTE: There is a good amount of overlapping code between this
// and PreSetStatusEffectImmunity. However, we need these classes to be distinct
// as this one's apply method requires additional parameters
// TODO: Find away to avoid the code duplication without sacrificing the subclass split
/**  Provides immunity to status effects to the user. */
export class StatusEffectImmunityAbAttr extends PreSetStatusEffectImmunityAbAttr {}

/** Provides immunity to status effects to the user's field. */
export class UserFieldStatusEffectImmunityAbAttr extends CancelInteractionAbAttr {
  immuneEffects;

  /**
   * @param immuneEffects - An array of {@linkcode StatusEffect}s to prevent application.
   * If none are provided, will block **all** status effects regardless of type.
   */
  constructor(...immuneEffects) {
    super();

    this.immuneEffects = immuneEffects;
  }

  canApply({ effect, cancelled }) {
    return (
      (!cancelled.value && this.immuneEffects.length === 0 && effect !== StatusEffect.FAINT)
      || this.immuneEffects.includes(effect)
    );
  }

  // here to allow typescript to allow us to `canApply` method without adjusting params
  apply;
}

/**
 * Conditionally provides immunity to status effects for the user's field.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Flower_Veil_(Ability) | Flower Veil (Bulbapedia)}.
 */
export class ConditionalUserFieldStatusEffectImmunityAbAttr extends UserFieldStatusEffectImmunityAbAttr {
  /**
   * The condition for the field immunity to be applied.
   * @param target - The target of the status effect
   * @param source - The source of the status effect
   */
  condition;

  /**
   * @param immuneEffects - An array of {@linkcode StatusEffect}s to prevent application.
   * If none are provided, will block **all** status effects regardless of type.
   */
  constructor(condition, ...immuneEffects) {
    super(...immuneEffects);

    this.condition = condition;
  }

  /**
   * Evaluate the condition to determine if the {@linkcode ConditionalUserFieldStatusEffectImmunityAbAttr} can be applied.
   * @returns Whether the ability can be applied to cancel the status effect.
   */
  canApply(params) {
    return !params.cancelled.value && this.condition(params.target, params.source) && super.canApply(params);
  }
}

/**
 * Conditionally provides immunity to stat drop effects to the user's field.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Flower_Veil_(Ability) | Flower Veil (Bulbapedia)}
 */
export class ConditionalUserFieldProtectStatAbAttr extends PreStatStageChangeAbAttr {
  /** The {@linkcode BattleStat} to protect or `undefined` if **all** stats are */
  protectedStat;

  /** If the method evaluates to true, the stat will be protected. */
  condition;

  constructor(condition, _protectedStat) {
    super();
    this.condition = condition;
  }

  /**
   * @returns Whether the ability can be used to cancel the stat stage change.
   */
  canApply({ stat, cancelled, target }) {
    if (!target) {
      return false;
    }
    return !cancelled.value && (this.protectedStat == null || stat === this.protectedStat) && this.condition(target);
  }

  /**
   * Apply the {@linkcode ConditionalUserFieldStatusEffectImmunityAbAttr} to an interaction
   */
  apply({ cancelled }) {
    cancelled.value = true;
  }
}

/**
 * Base class for ability attributes that apply their effect before a BattlerTag {@linkcode BattlerTag} is applied.
 * @remarks
 * ⚠️ Subclasses violate Liskov Substitution Principle, so this class must not be provided to {@linkcode applyAbAttrs}
 */
export class PreApplyBattlerTagAbAttr extends AbAttr {
  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

// Intentionally not exported because this shouldn't be able to be passed to `applyAbAttrs`. It only exists so that
// PreApplyBattlerTagImmunityAbAttr and UserFieldPreApplyBattlerTagImmunityAbAttr can avoid code duplication
// while preserving type safety. (Since the UserField version require an additional parameter, target, in its apply methods)
class BaseBattlerTagImmunityAbAttr extends PreApplyBattlerTagAbAttr {
  immuneTagTypes;

  constructor(immuneTagTypes) {
    super(true);

    this.immuneTagTypes = coerceArray(immuneTagTypes);
  }

  canApply({ cancelled, tag }) {
    return !cancelled.value && this.immuneTagTypes.includes(tag.tagType);
  }

  apply({ cancelled }) {
    cancelled.value = true;
  }

  getTriggerMessage({ pokemon, tag }, abilityName) {
    return i18next.t("abilityTriggers:battlerTagImmunity", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
      battlerTagName: tag.getDescriptor(),
    });
  }
}

// TODO: The battler tag ability attributes are in dire need of improvement
// It is unclear why there is a `PreApplyBattlerTagImmunityAbAttr` class that isn't used,
// and then why there's a BattlerTagImmunityAbAttr class as well.
/**
 * Provides immunity to {@linkcode BattlerTag}s to specified targets.
 * @remarks
 * Does not check whether the tag is already applied; that check should happen in the caller.
 */
export class PreApplyBattlerTagImmunityAbAttr extends BaseBattlerTagImmunityAbAttr {}

/** Provides immunity to BattlerTags {@linkcode BattlerTag} to the user. */
export class BattlerTagImmunityAbAttr extends PreApplyBattlerTagImmunityAbAttr {}

/** Provides immunity to BattlerTags {@linkcode BattlerTag} to the user's field. */
export class UserFieldBattlerTagImmunityAbAttr extends BaseBattlerTagImmunityAbAttr {}

export class ConditionalUserFieldBattlerTagImmunityAbAttr extends UserFieldBattlerTagImmunityAbAttr {
  condition;

  /**
   * Determine whether the {@linkcode ConditionalUserFieldBattlerTagImmunityAbAttr} can be applied by passing the target pokemon to the condition.
   * @returns Whether the ability can be used to cancel the battler tag
   */
  canApply(params) {
    return super.canApply(params) && this.condition(params.target);
  }

  constructor(condition, immuneTagTypes) {
    super(immuneTagTypes);

    this.condition = condition;
  }
}

export class BlockCritAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  /**
   * Apply the block crit ability by setting the value in the provided boolean holder to `true`.
   */
  apply({ blockCrit }) {
    blockCrit.value = true;
  }
}

export class BonusCritAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  /**
   * Apply the bonus crit ability by increasing the value in the provided number holder by 1
   */
  apply({ critStage }) {
    critStage.value += 1;
  }
}

export class MultCritAbAttr extends AbAttr {
  multAmount;

  constructor(multAmount) {
    super(false);

    this.multAmount = multAmount;
  }

  canApply({ critMult }) {
    return critMult.value > 1;
  }

  apply({ critMult }) {
    critMult.value *= this.multAmount;
  }
}

/**
 * Guarantees a critical hit according to the given condition, except if target prevents critical hits. ie. Merciless
 */
export class ConditionalCritAbAttr extends AbAttr {
  condition;

  constructor(condition, _checkUser) {
    super(false);

    this.condition = condition;
  }

  canApply({ isCritical, pokemon, target, move }) {
    return !isCritical.value && this.condition(pokemon, target, move);
  }

  apply({ isCritical }) {
    isCritical.value = true;
  }
}

export class BlockNonDirectDamageAbAttr extends CancelInteractionAbAttr {
  constructor() {
    super(false);
  }
}

export class BlockStatusDamageAbAttr extends CancelInteractionAbAttr {
  effects;

  constructor(...effects) {
    super(false);

    this.effects = effects;
  }

  canApply({ pokemon, cancelled}) {
    return !cancelled.value && !!pokemon.status?.effect && this.effects.includes(pokemon.status.effect);
  }
}

export class BlockOneHitKOAbAttr extends CancelInteractionAbAttr {}

/**
 * This governs abilities that alter the priority of moves
 * @remarks
 * Used by Prankster, Gale Wings, Triage, Mycelium Might, and Stall.
 *
 * NB: Quick Claw has a separate and distinct implementation outside of priority
 *
 * @sealed
 */
export class ChangeMovePriorityAbAttr extends AbAttr {
  moveFunc;
  changeAmount;

  /**
   * @param moveFunc - applies priority-change to moves that meet the condition
   * @param changeAmount - The amount of priority added or subtracted
   */
  constructor(moveFunc, changeAmount) {
    super(false);

    this.moveFunc = moveFunc;
    this.changeAmount = changeAmount;
  }

  canApply({ pokemon, move }) {
    return this.moveFunc(pokemon, move);
  }

  apply({ priority }) {
    priority.value += this.changeAmount;
  }
}

export class ChangeMovePriorityInBracketAbAttr extends AbAttr {
  newModifier;
  moveFunc;

  constructor(moveFunc, newModifier) {
    super(false);
    this.newModifier = newModifier;
    this.moveFunc = moveFunc;
  }

  canApply({ pokemon, move }) {
    return this.moveFunc(pokemon, move);
  }

  apply({ priority }) {
    priority.value = this.newModifier;
  }
}

export class IgnoreContactAbAttr extends AbAttr {
}

export class PreWeatherEffectAbAttr extends AbAttr {
  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

/** Base class for abilities that apply an effect before a weather effect is applied. */
export class PreWeatherDamageAbAttr extends PreWeatherEffectAbAttr {}

export class BlockWeatherDamageAttr extends PreWeatherDamageAbAttr {
  weatherTypes;

  constructor(...weatherTypes) {
    super(false);

    this.weatherTypes = weatherTypes;
  }

  canApply({ weather, cancelled }) {
    if (!weather || cancelled.value) {
      return false;
    }
    const weatherType = weather.weatherType;
    return this.weatherTypes.length === 0 || this.weatherTypes.includes(weatherType);
  }

  apply({ cancelled }) {
    cancelled.value = true;
  }
}

export class SuppressWeatherEffectAbAttr extends PreWeatherEffectAbAttr {
  affectsImmutable;

  constructor(affectsImmutable = false) {
    super(true);

    this.affectsImmutable = affectsImmutable;
  }

  canApply({ weather, cancelled }) {
    if (!weather || cancelled.value) {
      return false;
    }
    return this.affectsImmutable || weather.isImmutable();
  }

  apply({ cancelled }) {
    cancelled.value = true;
  }
}

/**
 * Displays a message on switch-in containing the highest power Move known by the user's opponents,
 * picking randomly in the case of a tie.
 *
 * @see {@link https://www.smogon.com/dex/sv/abilities/forewarn/}
 * @sealed
 */
export class ForewarnAbAttr extends PostSummonAbAttr {
  constructor() {
    super(true);
  }

  canApply({ pokemon }) {
    return pokemon.getOpponents().some(opp => opp.getMoveset().length > 0);
  }

  apply({ simulated, pokemon }) {
    if (simulated) {
      return;
    }

    let maxPowerSeen = 0;
    const movesAtMaxPower = [];

    // Record all moves in all opponents' movesets seen at our max power threshold, clearing it if a new "highest power" is found
    // TODO: Change to `pokemon.getOpponents().flatMap(p => p.getMoveset())` if or when we upgrade to ES2025
    for (const opp of pokemon.getOpponents()) {
      for (const oppMove of opp.getMoveset()) {
        const move = oppMove.getMove();
        const movePower = getForewarnPower(move);
        if (movePower < maxPowerSeen) {
          continue;
        }

        // Another move at current max found; add to tiebreaker array
        if (movePower === maxPowerSeen) {
          movesAtMaxPower.push(move.name);
          continue;
        }

        // New max reached; clear prior results and update tracker
        maxPowerSeen = movePower;
        movesAtMaxPower.splice(0, movesAtMaxPower.length, move.name);
      }
    }

    // Pick a random move in our list.
    if (movesAtMaxPower.length === 0) {
      return;
    }
    const chosenMove = movesAtMaxPower[pokemon.randBattleSeedInt(movesAtMaxPower.length)];
    globalScene.phaseManager.queueMessage(
      i18next.t("abilityTriggers:forewarn", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        moveName: chosenMove,
      }),
    );
  }
}

/**
 * Helper function to return the estimated power used by Forewarn's "highest power" ranking.
 * @param move - The `Move` being checked
 * @returns The "forewarned" power of the move.
 * @see {@link https://www.smogon.com/dex/sv/abilities/forewarn/}
 */
function getForewarnPower(move) {
  if (move.is("StatusMove")) {
    return 1;
  }

  if (move.hasAttr("OneHitKOAttr")) {
    return 150;
  }

  // NB: Mainline doesn't count Comeuppance in its "counter move exceptions" list, which is dumb
  if (move.hasAttr("CounterDamageAttr")) {
    return 120;
  }

  // All damaging moves with unlisted powers use 80 as a fallback
  if (move.power === -1) {
    return 80;
  }
  return move.power;
}

/**
 * Ability attribute that reveals the abilities of all opposing Pokémon when the Pokémon with this ability is summoned.
 * @sealed
 */
export class FriskAbAttr extends PostSummonAbAttr {
  constructor() {
    super(true);
  }

  apply({ simulated, pokemon }) {
    if (!simulated) {
      for (const opponent of pokemon.getOpponentsGenerator()) {
        globalScene.phaseManager.queueMessage(
          i18next.t("abilityTriggers:frisk", {
            pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
            opponentName: opponent.name,
            opponentAbilityName: opponent.getAbility().name,
          }),
        );
        opponent.revealAbility();
      }
    }
  }
}

/**
 * Base class for ability attributes that apply their effect after a weather change.
 */
export class PostWeatherChangeAbAttr extends AbAttr {
  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

/**
 * Triggers weather-based form change when weather changes.
 *
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Forecast_(Ability) | Forecast (Bulbapedia)}
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Flower_Gift_(Ability) | Flower Gift (Bulbapedia)}
 *
 * @sealed
 */
export class PostWeatherChangeFormChangeAbAttr extends PostWeatherChangeAbAttr {
  ability;
  formRevertingWeathers;

  constructor(ability, formRevertingWeathers) {
    super(false);

    this.ability = ability;
    this.formRevertingWeathers = formRevertingWeathers;
  }

  canApply({ pokemon }) {
    const isCastformWithForecast =
      pokemon.species.speciesId === SpeciesId.CASTFORM && this.ability === AbilityId.FORECAST;
    const isCherrimWithFlowerGift =
      pokemon.species.speciesId === SpeciesId.CHERRIM && this.ability === AbilityId.FLOWER_GIFT;

    return isCastformWithForecast || isCherrimWithFlowerGift;
  }

  /**
   * Calls {@linkcode Arena.triggerWeatherBasedFormChangesToNormal | triggerWeatherBasedFormChangesToNormal} when the
   * weather changed to form-reverting weather, otherwise calls {@linkcode Arena.triggerWeatherBasedFormChanges | triggerWeatherBasedFormChanges}
   */
  apply({ simulated }) {
    if (simulated) {
      return;
    }

    // TODO: investigate why this is not using the weatherType parameter
    // and is instead reading the weather from the global scene
    const weatherType = globalScene.arena.weather?.weatherType;

    if (weatherType && this.formRevertingWeathers.includes(weatherType)) {
      globalScene.arena.triggerWeatherBasedFormChangesToNormal();
    } else {
      globalScene.arena.triggerWeatherBasedFormChanges();
    }
  }
}

/**
 * Ability attribute to change Eiscue to Ice form if snowing or hailing.
 */
// TODO: This is only required due to how tightly `PostWeatherChangeFormChangeAbAttr` is tied to its related abilities
export class IceFaceFormChangeAbAttr extends PostWeatherChangeAbAttr {
  formIndex;

  constructor(formIndex) {
    super();
    this.formIndex = formIndex;
  }

  canApply({ pokemon, weather }) {
    return pokemon.formIndex === this.formIndex && (weather === WeatherType.HAIL || weather === WeatherType.SNOW);
  }

  apply({ simulated, pokemon }) {
    if (simulated) {
      return;
    }
    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger);
  }
}

/**
 * Adds a battler tag to the pokemon when the weather changes.
 * @sealed
 */
export class PostWeatherChangeAddBattlerTagAbAttr extends PostWeatherChangeAbAttr {
  tagType;
  turnCount;
  weatherTypes;

  constructor(tagType, turnCount, ...weatherTypes) {
    super();

    this.tagType = tagType;
    this.turnCount = turnCount;
    this.weatherTypes = weatherTypes;
  }

  canApply({ weather, pokemon }) {
    return this.weatherTypes.includes(weather) && pokemon.canAddTag(this.tagType);
  }

  apply({ simulated, pokemon }) {
    if (!simulated) {
      pokemon.addTag(this.tagType, this.turnCount);
    }
  }
}
export class PostWeatherLapseAbAttr extends AbAttr {
  weatherTypes;

  constructor(...weatherTypes) {
    super();

    this.weatherTypes = weatherTypes;
  }

  canApply(_params) {
    return true;
  }

  apply(_params) {}

  getCondition() {
    return getWeatherCondition(...this.weatherTypes);
  }
}

export class PostWeatherLapseHealAbAttr extends PostWeatherLapseAbAttr {
  healFactor;

  constructor(healFactor, ...weatherTypes) {
    super(...weatherTypes);

    this.healFactor = healFactor;
  }

  canApply({ pokemon }) {
    return !pokemon.isFullHp();
  }

  apply({ pokemon, passive, simulated }) {
    const abilityName = (passive ? pokemon.getPassiveAbility() : pokemon.getAbility()).name;
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / (16 / this.healFactor)),
        i18next.t("abilityTriggers:postWeatherLapseHeal", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          abilityName,
        }),
        true,
      );
    }
  }
}

export class PostWeatherLapseDamageAbAttr extends PostWeatherLapseAbAttr {
  damageFactor;

  constructor(damageFactor, ...weatherTypes) {
    super(...weatherTypes);

    this.damageFactor = damageFactor;
  }

  canApply({ pokemon }) {
    return !pokemon.hasAbilityWithAttr("BlockNonDirectDamageAbAttr");
  }

  apply({ simulated, pokemon, passive }) {
    if (!simulated) {
      const abilityName = (passive ? pokemon.getPassiveAbility() : pokemon.getAbility()).name;
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:postWeatherLapseDamage", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          abilityName,
        }),
      );
      pokemon.damageAndUpdate(toDmgValue(pokemon.getMaxHp() / (16 / this.damageFactor)), {
        result: HitResult.INDIRECT,
      });
    }
  }
}

export class PostTurnAbAttr extends AbAttr {
  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

/**
 * This attribute will heal 1/8th HP if the ability pokemon has the correct status.
 *
 * @sealed
 */
export class PostTurnStatusHealAbAttr extends PostTurnAbAttr {
  effects;

  /**
   * @param effects - The status effect(s) that will qualify healing the ability pokemon
   */
  constructor(...effects) {
    super(false);

    this.effects = effects;
  }

  canApply({ pokemon }) {
    return pokemon.status != null && this.effects.includes(pokemon.status.effect) && !pokemon.isFullHp();
  }

  apply({ simulated, passive, pokemon }) {
    if (!simulated) {
      const abilityName = (passive ? pokemon.getPassiveAbility() : pokemon.getAbility()).name;
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 8),
        i18next.t("abilityTriggers:poisonHeal", { pokemonName: getPokemonNameWithAffix(pokemon), abilityName }),
        true,
      );
    }
  }
}

/**
 * Resets the status of either the user or their ally at the end of each turn.
 *
 * @sealed
 */
export class PostTurnResetStatusAbAttr extends PostTurnAbAttr {
  allyTarget;
  target;

  constructor(allyTarget = false) {
    super(true);
    this.allyTarget = allyTarget;
  }

  canApply({ pokemon }) {
    if (this.allyTarget) {
      this.target = pokemon.getAlly();
    } else {
      this.target = pokemon;
    }

    const effect = this.target?.status?.effect;
    return !!effect && effect !== StatusEffect.FAINT;
  }

  apply({ simulated }) {
    if (!simulated && this.target?.status) {
      globalScene.phaseManager.queueMessage(
        getStatusEffectHealText(this.target.status?.effect, getPokemonNameWithAffix(this.target)),
      );
      this.target.resetStatus(false);
      this.target.updateInfo();
    }
  }
}

/**
 * Attribute to try and restore eaten berries after the turn ends.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Harvest_(Ability) | Harvest (Bulbapedia)}
 */
export class PostTurnRestoreBerryAbAttr extends PostTurnAbAttr {
  /**
   * Array containing all {@linkcode BerryType | BerryTypes} that are under cap and able to be restored.
   * Stored inside the class for a minor performance boost
   */
  berriesUnderCap;
  procChance;

  /**
   * @param procChance - function providing chance to restore an item
   * @see {@linkcode createEatenBerry}
   */
  constructor(procChance) {
    super();
    this.procChance = procChance;
  }

  canApply({ pokemon }) {
    // Ensure we have at least 1 recoverable berry (at least 1 berry in berriesEaten is not capped)
    const cappedBerries = new Set(
      globalScene
        .getModifiers(BerryModifier, pokemon.isPlayer())
        .filter(bm => bm.pokemonId === pokemon.id && bm.getCountUnderMax() < 1)
        .map(bm => bm.berryType),
    );

    this.berriesUnderCap = pokemon.battleData.berriesEaten.filter(bt => !cappedBerries.has(bt));

    if (this.berriesUnderCap.length === 0) {
      return false;
    }

    // Clamp procChance to [0, 1]. Skip if didn't proc (less than pass)
    const pass = randSeedFloat();
    return this.procChance(pokemon) >= pass;
  }

  apply({ simulated, pokemon }) {
    if (!simulated) {
      this.createEatenBerry(pokemon);
    }
  }

  /**
   * Create a new berry chosen randomly from all berries the user consumed in the current battle.
   * @param pokemon - The {@linkcode Pokemon} with this ability
   * @returns Whether a new berry was created
   */
  createEatenBerry(pokemon) {
    // Pick a random available berry to yoink
    const randomIdx = randSeedInt(this.berriesUnderCap.length);
    const chosenBerryType = this.berriesUnderCap[randomIdx];
    pokemon.battleData.berriesEaten.splice(randomIdx, 1); // Remove berry from memory
    const chosenBerry = new BerryModifierType(chosenBerryType);

    // Add the randomly chosen berry or update the existing one
    const berryModifier = globalScene.findModifier(
      m => m instanceof BerryModifier && m.berryType === chosenBerryType && m.pokemonId === pokemon.id,
      pokemon.isPlayer(),
    );

    if (berryModifier) {
      berryModifier.stackCount++;
    } else {
      const newBerry = new BerryModifier(chosenBerry, pokemon.id, chosenBerryType, 1);
      if (pokemon.isPlayer()) {
        globalScene.addModifier(newBerry);
      } else {
        globalScene.addEnemyModifier(newBerry);
      }
    }

    globalScene.updateModifiers(pokemon.isPlayer());
    globalScene.phaseManager.queueMessage(
      i18next.t("abilityTriggers:postTurnLootCreateEatenBerry", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        berryName: chosenBerry.name,
      }),
    );
    return true;
  }
}

/**
 * Attribute to track and re-trigger last turn's berries at the end of the `BerryPhase`.
 *
 * @remarks
 * ⚠️ Must only be used by Cud Chew; do _not_ reuse this attribute for anything else.
 *
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Cud_Chew_(Ability) | Cud Chew (Bulbapedia)}
 * @sealed
 */
export class CudChewConsumeBerryAbAttr extends AbAttr {
  /**
   * @returns `true` if the pokemon ate anything last turn
   */
  canApply({ pokemon }) {
    return pokemon.summonData.berriesEatenLast.length > 0;
  }

  apply({ pokemon }) {
    // TODO: Consider respecting the `simulated` flag
    globalScene.phaseManager.unshiftNew(
      "CommonAnimPhase",
      pokemon.getBattlerIndex(),
      pokemon.getBattlerIndex(),
      CommonAnim.USE_ITEM,
    );

    // Re-apply effects of all berries previously scarfed.
    // This doesn't count as "eating" a berry (for unnerve/stuff cheeks/unburden) as no item is consumed.
    for (const berryType of pokemon.summonData.berriesEatenLast) {
      getBerryEffectFunc(berryType)(pokemon);
      const bMod = new BerryModifier(new BerryModifierType(berryType), pokemon.id, berryType, 1);
      globalScene.eventTarget.dispatchEvent(new BerryUsedEvent(bMod)); // trigger message
    }

    // uncomment to make cheek pouch work with cud chew
    // applyAbAttrs("HealFromBerryUseAbAttr", {pokemon});
  }
}

/**
 * Consume a berry at the end of the turn if the pokemon has one.
 *
 * @remarks
 * Must be used in conjunction with {@linkcode CudChewConsumeBerryAbAttr}.
 *
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Cud_Chew_(Ability) | Cud Chew (Bulbapedia)}
 * @sealed
 */
export class CudChewRecordBerryAbAttr extends PostTurnAbAttr {
  constructor() {
    super(false);
  }

  /**
   * Move this {@linkcode Pokemon}'s `berriesEaten` array from `PokemonTurnData`
   * into `PokemonSummonData` on turn end.
   * Both arrays are cleared on switch.
   */
  apply({ pokemon }) {
    pokemon.summonData.berriesEatenLast = pokemon.turnData.berriesEaten;
  }
}

/**
 * Randomly raises and lowers stats at the end of the turn.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Moody_(Ability) | Moody (Bulbapedia)}
 */
export class MoodyAbAttr extends PostTurnAbAttr {
  constructor() {
    super(true);
  }
  /**
   * Randomly increases one stat stage by 2 and decreases a different stat stage by 1. \
   * Any stat stages at +6 or -6 are excluded from being increased or decreased, respectively. \
   * If the pokemon already has all stat stages raised to 6, it will only decrease one stat stage by 1. \
   * If the pokemon already has all stat stages lowered to -6, it will only increase one stat stage by 2.
   */
  apply({ pokemon, simulated }) {
    if (simulated) {
      return;
    }
    const canRaise = EFFECTIVE_STATS.filter(s => pokemon.getStatStage(s) < 6);
    let canLower = EFFECTIVE_STATS.filter(s => pokemon.getStatStage(s) > -6);

    if (!simulated) {
      if (canRaise.length > 0) {
        const raisedStat = canRaise[pokemon.randBattleSeedInt(canRaise.length)];
        canLower = canLower.filter(s => s !== raisedStat);
        globalScene.phaseManager.unshiftNew("StatStageChangePhase", pokemon.getBattlerIndex(), true, [raisedStat], 2);
      }
      if (canLower.length > 0) {
        const loweredStat = canLower[pokemon.randBattleSeedInt(canLower.length)];
        globalScene.phaseManager.unshiftNew("StatStageChangePhase", pokemon.getBattlerIndex(), true, [loweredStat], -1);
      }
    }
  }
}

/** @sealed */
export class SpeedBoostAbAttr extends PostTurnAbAttr {
  constructor() {
    super(true);
  }

  canApply({ simulated, pokemon }) {
    // todo: Consider moving the `simulated` check to the `apply` method
    return simulated || (!pokemon.turnData.switchedInThisTurn && !pokemon.turnData.failedRunAway);
  }

  apply({ pokemon }) {
    globalScene.phaseManager.unshiftNew("StatStageChangePhase", pokemon.getBattlerIndex(), true, [Stat.SPD], 1);
  }
}

export class PostTurnHealAbAttr extends PostTurnAbAttr {
  canApply({ pokemon }) {
    return !pokemon.isFullHp();
  }

  apply({ simulated, pokemon, passive }) {
    if (!simulated) {
      const abilityName = (passive ? pokemon.getPassiveAbility() : pokemon.getAbility()).name;
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 16),
        i18next.t("abilityTriggers:postTurnHeal", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          abilityName,
        }),
        true,
      );
    }
  }
}

/** @sealed */
export class PostTurnFormChangeAbAttr extends PostTurnAbAttr {
  formFunc;

  constructor(formFunc) {
    super(true);

    this.formFunc = formFunc;
  }

  canApply({ pokemon }) {
    return this.formFunc(pokemon) !== pokemon.formIndex;
  }

  apply({ simulated, pokemon }) {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
    }
  }
}

/**
 * Damages sleeping opponents at the end of the turn.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Bad_Dreams_(Ability) | Bad Dreams (Bulbapedia)}
 * @sealed
 */
export class PostTurnHurtIfSleepingAbAttr extends PostTurnAbAttr {
  canApply({ pokemon }) {
    return pokemon
      .getOpponents()
      .some(
        opp =>
          (opp.status?.effect === StatusEffect.SLEEP || opp.hasAbility(AbilityId.COMATOSE))
          && !opp.hasAbilityWithAttr("BlockNonDirectDamageAbAttr")
          && !opp.switchOutStatus,
      );
  }

  /** Deal damage to all sleeping, on-field opponents equal to 1/8 of their max hp (min 1). */
  apply({ pokemon, simulated }) {
    if (simulated) {
      return;
    }

    for (const opp of pokemon.getOpponentsGenerator()) {
      if ((opp.status?.effect !== StatusEffect.SLEEP && !opp.hasAbility(AbilityId.COMATOSE)) || opp.switchOutStatus) {
        continue;
      }

      const cancelled = new BooleanHolder(false);
      applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, simulated, cancelled });

      if (!cancelled.value) {
        opp.damageAndUpdate(toDmgValue(opp.getMaxHp() / 8), { result: HitResult.INDIRECT });
        globalScene.phaseManager.queueMessage(
          i18next.t("abilityTriggers:badDreams", { pokemonName: getPokemonNameWithAffix(opp) }),
        );
      }
    }
  }
}

// TODO: Remove this?
export class PostBiomeChangeAbAttr extends AbAttr {
}

export class PostBiomeChangeWeatherChangeAbAttr extends PostBiomeChangeAbAttr {
  weatherType;

  constructor(weatherType) {
    super();

    this.weatherType = weatherType;
  }

  canApply(_params) {
    return (globalScene.arena.weather?.isImmutable() ?? false) && globalScene.arena.canSetWeather(this.weatherType);
  }

  apply({ simulated, pokemon }) {
    if (!simulated) {
      globalScene.arena.trySetWeather(this.weatherType, pokemon);
    }
  }
}

/** Triggers just after a move is used either by the opponent or the player */
export class PostMoveUsedAbAttr extends AbAttr {
  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

/** Triggers after a dance move is used either by the opponent or the player */
export class PostDancingMoveAbAttr extends PostMoveUsedAbAttr {
  canApply({ source, pokemon }) {
    /** Tags that prevent Dancer from replicating the move */
    const forbiddenTags = [
      BattlerTagType.FLYING,
      BattlerTagType.UNDERWATER,
      BattlerTagType.UNDERGROUND,
      BattlerTagType.HIDDEN,
    ];
    // The move to replicate cannot come from the Dancer
    return (
      source.getBattlerIndex() !== pokemon.getBattlerIndex()
      && !pokemon.summonData.tags.some(tag => forbiddenTags.includes(tag.tagType))
    );
  }

  apply({ source, pokemon, move, targets, simulated }) {
    if (!simulated) {
      // If the move is an AttackMove or a StatusMove the Dancer must replicate the move on the source of the Dance
      if (move.getMove().is("AttackMove") || move.getMove().is("StatusMove")) {
        const target = this.getTarget(pokemon, source, targets);
        globalScene.phaseManager.unshiftNew(
          "MovePhase",
          pokemon,
          target,
          move,
          MoveUseMode.INDIRECT,
          MovePhaseTimingModifier.FIRST,
        );
      } else if (move.getMove().is("SelfStatusMove")) {
        // If the move is a SelfStatusMove (ie. Swords Dance) the Dancer should replicate it on itself
        globalScene.phaseManager.unshiftNew(
          "MovePhase",
          pokemon,
          [pokemon.getBattlerIndex()],
          move,
          MoveUseMode.INDIRECT,
          MovePhaseTimingModifier.FIRST,
        );
      }
    }
  }

  /**
   * Get the correct targets of Dancer ability
   *
   * @param dancer - Pokémon with Dancer ability
   * @param source - The user of the dancing move
   * @param targets - Targets of the dancing move
   */
  getTarget(dancer, source, targets) {
    if (dancer.isPlayer()) {
      return source.isPlayer() ? targets : [source.getBattlerIndex()];
    }
    return source.isPlayer() ? [source.getBattlerIndex()] : targets;
  }
}

/** Triggers after the Pokemon loses or consumes an item */
export class PostItemLostAbAttr extends AbAttr {
  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

/** Applies a Battler Tag to the Pokemon after it loses or consumes an item */
export class PostItemLostApplyBattlerTagAbAttr extends PostItemLostAbAttr {
  tagType;
  constructor(tagType) {
    super(false);
    this.tagType = tagType;
  }

  canApply({ pokemon, simulated }) {
    return !pokemon.getTag(this.tagType) && !simulated;
  }

  apply({ pokemon }) {
    pokemon.addTag(this.tagType);
  }
}

export class StatStageChangeMultiplierAbAttr extends AbAttr {
  multiplier;

  constructor(multiplier) {
    super(false);

    this.multiplier = multiplier;
  }

  apply({ numStages }) {
    numStages.value *= this.multiplier;
  }
}

export class StatStageChangeCopyAbAttr extends AbAttr {
  apply({ pokemon, stats, numStages, simulated }) {
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        true,
        stats,
        numStages,
        true,
        false,
        false,
      );
    }
  }
}

export class BypassBurnDamageReductionAbAttr extends CancelInteractionAbAttr {
  constructor() {
    super(false);
  }
}

/**
 * Causes Pokemon to take reduced damage from the {@linkcode StatusEffect.BURN | Burn} status
 * @param multiplier Multiplied with the damage taken
 */
export class ReduceBurnDamageAbAttr extends AbAttr {
  multiplier;
  constructor(multiplier) {
    super(false);
    this.multiplier = multiplier;
  }

  /**
   * Applies the damage reduction
   */
  apply({ burnDamage }) {
    burnDamage.value = toDmgValue(burnDamage.value * this.multiplier);
  }
}

export class DoubleBerryEffectAbAttr extends AbAttr {
  apply({ effectValue }) {
    effectValue.value *= 2;
  }
}

/**
 * Attribute to prevent opposing berry use while on the field.
 * Used by {@linkcode AbilityId.UNNERVE}, {@linkcode AbilityId.AS_ONE_GLASTRIER} and {@linkcode AbilityId.AS_ONE_SPECTRIER}
 */
export class PreventBerryUseAbAttr extends CancelInteractionAbAttr {}

/**
 * A Pokemon with this ability heals by a percentage of their maximum hp after eating a berry
 * @param healPercent - Percent of Max HP to heal
 */
export class HealFromBerryUseAbAttr extends AbAttr {
  /** Percent of Max HP to heal */
  healPercent;

  constructor(healPercent) {
    super();

    // Clamp healPercent so its between [0,1].
    this.healPercent = Math.max(Math.min(healPercent, 1), 0);
  }

  apply({ simulated, passive, pokemon }) {
    if (simulated) {
      return;
    }

    const { name: abilityName } = passive ? pokemon.getPassiveAbility() : pokemon.getAbility();
    globalScene.phaseManager.unshiftNew(
      "PokemonHealPhase",
      pokemon.getBattlerIndex(),
      toDmgValue(pokemon.getMaxHp() * this.healPercent),
      i18next.t("abilityTriggers:healFromBerryUse", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        abilityName,
      }),
      true,
    );
  }
}
/** Double the succès rate of running away. */
export class RunSuccessAbAttr extends AbAttr {
  apply({ chance }) {
    chance.value = 2;
  }
}

/** Base class for checking if a Pokemon is trapped by a trapping effect. */
export class CheckTrappedAbAttr extends AbAttr {
  arenaTrapCondition;

  constructor(condition) {
    super(false);
    this.arenaTrapCondition = condition;
  }

  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

/**
 * Determines whether a Pokemon is blocked from switching/running away
 * because of a trapping ability or move.
 */
export class ArenaTrapAbAttr extends CheckTrappedAbAttr {
  /**
   * Checks if enemy Pokemon is trapped by an Arena Trap-esque ability
   * If the enemy is a Ghost type, it is not trapped
   * If the enemy has the ability Run Away, it is not trapped.
   * If the user has Magnet Pull and the enemy is not a Steel type, it is not trapped.
   * If the user has Arena Trap and the enemy is not grounded, it is not trapped.
   */
  canApply({ pokemon, opponent }) {
    return (
      this.arenaTrapCondition(pokemon, opponent)
      && !(
        opponent.getTypes(true).includes(PokemonType.GHOST)
        || (opponent.getTypes(true).includes(PokemonType.STELLAR) && opponent.getTypes().includes(PokemonType.GHOST))
      )
      && !opponent.hasAbility(AbilityId.RUN_AWAY)
    );
  }

  apply({ trapped }) {
    trapped.value = true;
  }

  getTriggerMessage({ pokemon }, abilityName) {
    return i18next.t("abilityTriggers:arenaTrap", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

export class MaxMultiHitAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  apply({ hits }) {
    hits.value = 0;
  }
}

export class PostBattleAbAttr extends AbAttr {
  constructor(showAbility = true) {
    super(showAbility);
  }

  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

export class PostBattleLootAbAttr extends PostBattleAbAttr {
  randItem;

  canApply({ simulated, victory, pokemon }) {
    const postBattleLoot = globalScene.currentBattle.postBattleLoot;
    if (!simulated && postBattleLoot.length > 0 && victory) {
      this.randItem = randSeedItem(postBattleLoot);
      return globalScene.canTransferHeldItemModifier(this.randItem, pokemon, 1);
    }
    return false;
  }

  apply({ pokemon }) {
    const postBattleLoot = globalScene.currentBattle.postBattleLoot;
    if (!this.randItem) {
      this.randItem = randSeedItem(postBattleLoot);
    }

    if (globalScene.tryTransferHeldItemModifier(this.randItem, pokemon, true, 1, true, undefined, false)) {
      postBattleLoot.splice(postBattleLoot.indexOf(this.randItem), 1);
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:postBattleLoot", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          itemName: this.randItem.type.name,
        }),
      );
    }
    this.randItem = undefined;
  }
}

export class PostFaintAbAttr extends AbAttr {
  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

/**
 * Used for weather suppressing abilities to trigger weather-based form changes upon being fainted.
 * Used by Cloud Nine and Air Lock.
 * @sealed
 */
export class PostFaintUnsuppressedWeatherFormChangeAbAttr extends PostFaintAbAttr {
  canApply(_params) {
    return getPokemonWithWeatherBasedForms().length > 0;
  }

  /**
   * Triggers {@linkcode Arena.triggerWeatherBasedFormChanges | triggerWeatherBasedFormChanges}
   * when the user of the ability faints
   */
  apply({ simulated }) {
    if (!simulated) {
      globalScene.arena.triggerWeatherBasedFormChanges();
    }
  }
}

export class PostFaintFormChangeAbAttr extends PostFaintAbAttr {
  formFunc;

  constructor(formFunc) {
    super(true);

    this.formFunc = formFunc;
  }

  canApply({ pokemon }) {
    return this.formFunc(pokemon) !== pokemon.formIndex;
  }

  apply({ pokemon, simulated }) {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
    }
  }
}

export class PostFaintContactDamageAbAttr extends PostFaintAbAttr {
  damageRatio;

  constructor(damageRatio) {
    super(true);

    this.damageRatio = damageRatio;
  }

  canApply({ pokemon, attacker, move, simulated }) {
    if (
      move === undefined
      || attacker === undefined
      || !move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
    ) {
      return false;
    }

    const cancelled = new BooleanHolder(false);
    for (const p of inSpeedOrder(ArenaTagSide.BOTH)) {
      applyAbAttrs("FieldPreventExplosiveMovesAbAttr", { pokemon: p, cancelled, simulated });
    }

    if (cancelled.value) {
      return false;
    }

    // Confirmed: Aftermath does not activate or show text vs Magic Guard killers
    applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon: attacker, cancelled });
    return !cancelled.value;
  }

  apply({ simulated, attacker }) {
    if (!attacker || simulated) {
      return;
    }

    attacker.damageAndUpdate(toDmgValue(attacker.getMaxHp() * (1 / this.damageRatio)), {
      result: HitResult.INDIRECT,
    });
    attacker.turnData.damageTaken += toDmgValue(attacker.getMaxHp() * (1 / this.damageRatio));
  }

  getTriggerMessage({ pokemon }, abilityName) {
    return i18next.t("abilityTriggers:postFaintContactDamage", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

/**
 * Attribute used for abilities that damage opponents causing the user to faint
 * equal to the amount of damage the last attack inflicted.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Innards_Out_(Ability) | Innards Out (Bulbapedia)}
 * @sealed
 */
export class PostFaintHPDamageAbAttr extends PostFaintAbAttr {
  apply({ simulated, pokemon, move, attacker }) {
    // return early if the user died to indirect damage, target has magic guard or was KO'd by an ally
    if (!move || !attacker || simulated || attacker.getAlly() === pokemon) {
      return;
    }

    const cancelled = new BooleanHolder(false);
    applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon: attacker, cancelled });
    if (cancelled.value) {
      return;
    }

    const damage = pokemon.turnData.attacksReceived[0].damage;
    attacker.damageAndUpdate(damage, { result: HitResult.INDIRECT });
    attacker.turnData.damageTaken += damage;
  }

  // Oddly, Innards Out still shows a flyout if the effect was blocked due to Magic Guard...
  // TODO: Verify on cart
  getTriggerMessage({ pokemon }, abilityName) {
    return i18next.t("abilityTriggers:postFaintHpDamage", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

/** Base class for abilities that redirect moves to the pokemon with this ability. */
export class RedirectMoveAbAttr extends AbAttr {
  canApply({ pokemon, moveId, targetIndex, sourcePokemon }) {
    if (!this.canRedirect(moveId, sourcePokemon)) {
      return false;
    }
    const newTarget = pokemon.getBattlerIndex();
    return targetIndex.value !== newTarget;
  }

  apply({ pokemon, targetIndex }) {
    const newTarget = pokemon.getBattlerIndex();
    targetIndex.value = newTarget;
  }

  canRedirect(moveId, _user) {
    const move = allMoves[moveId];
    return !![MoveTarget.NEAR_OTHER, MoveTarget.OTHER].find(t => move.moveTarget === t);
  }
}

/** @sealed */
export class RedirectTypeMoveAbAttr extends RedirectMoveAbAttr {
  type;

  constructor(type) {
    super();
    this.type = type;
  }

  canRedirect(moveId, user) {
    return super.canRedirect(moveId, user) && user.getMoveType(allMoves[moveId]) === this.type;
  }
}

export class BlockRedirectAbAttr extends AbAttr {
}

/**
 * Used by Early Bird, makes the pokemon wake up faster
 * @param statusEffect - The {@linkcode StatusEffect} to check for
 * @sealed
 */
export class ReduceStatusEffectDurationAbAttr extends AbAttr {
  statusEffect;

  constructor(statusEffect) {
    super(false);

    this.statusEffect = statusEffect;
  }

  canApply({ statusEffect }) {
    return statusEffect === this.statusEffect;
  }

  apply({ duration }) {
    duration.value -= 1;
  }
}

/** Base class for abilities that apply an effect when the user is flinched. */
export class FlinchEffectAbAttr extends AbAttr {
  constructor() {
    super(true);
  }

  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

export class FlinchStatStageChangeAbAttr extends FlinchEffectAbAttr {
  stats;
  stages;

  constructor(stats, stages) {
    super();

    this.stats = stats;
    this.stages = stages;
  }

  apply({ simulated, pokemon }) {
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        true,
        this.stats,
        this.stages,
      );
    }
  }
}

export class IncreasePpAbAttr extends AbAttr {
}

/** @sealed */
export class ForceSwitchOutImmunityAbAttr extends CancelInteractionAbAttr {}

/** @sealed */
export class ReduceBerryUseThresholdAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  canApply({ pokemon, hpRatioReq }) {
    const hpRatio = pokemon.getHpRatio();
    return hpRatioReq.value < hpRatio;
  }

  apply({ hpRatioReq }) {
    hpRatioReq.value *= 2;
  }
}

/**
 * Ability attribute used for abilites that change the ability owner's weight
 * Used for Heavy Metal (doubling weight) and Light Metal (halving weight)
 * @sealed
 */
export class WeightMultiplierAbAttr extends AbAttr {
  multiplier;

  constructor(multiplier) {
    super(false);

    this.multiplier = multiplier;
  }

  apply({ weight }) {
    weight.value *= this.multiplier;
  }
}

/** @sealed */
export class SyncEncounterNatureAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  apply({ target, pokemon }) {
    target.setNature(pokemon.getNature());
  }
}

export class MoveAbilityBypassAbAttr extends AbAttr {
  moveIgnoreFunc;

  constructor(moveIgnoreFunc = () => true) {
    super(false);

    this.moveIgnoreFunc = moveIgnoreFunc;
  }

  canApply({ pokemon, move, cancelled }) {
    return !cancelled.value && this.moveIgnoreFunc(pokemon, move);
  }

  apply({ cancelled }) {
    cancelled.value = true;
  }
}

/** Attribute for abilities that allow moves that make contact to ignore protection (i.e. Unseen Fist) */
export class IgnoreProtectOnContactAbAttr extends AbAttr {
}

/**
 * Attribute implementing the effects of {@link https://bulbapedia.bulbagarden.net/wiki/Infiltrator_(Ability) | Infiltrator}.
 * Allows the source's moves to bypass the effects of opposing Light Screen, Reflect, Aurora Veil, Safeguard, Mist, and Substitute.
 * @sealed
 */
export class InfiltratorAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  /** @returns Whether bypassed has not yet been set */
  canApply({ bypassed }) {
    return !bypassed.value;
  }

  /**
   * Sets a flag to bypass screens, Substitute, Safeguard, and Mist
   */
  apply({ bypassed }) {
    bypassed.value = true;
  }
}

/**
 * Attribute implementing the effects of {@link https://bulbapedia.bulbagarden.net/wiki/Magic_Bounce_(ability) | Magic Bounce}.
 *
 * Allows the source to bounce back {@linkcode MoveFlags.REFLECTABLE | Reflectable}
 * moves as if the user had used {@linkcode MoveId.MAGIC_COAT | Magic Coat}.
 *
 * The calling {@linkcode MoveEffectPhase} will "skip" targets with a reflection effect active,
 * showing the flyout and activating this ability during the queued {@linkcode MoveReflectPhase}.
 */
export class ReflectStatusMoveAbAttr extends PreDefendAbAttr {
  apply({ pokemon, opponent, move }) {
    const newTargets = move.isMultiTarget() ? getMoveTargets(pokemon, move.id).targets : [opponent.getBattlerIndex()];
    globalScene.phaseManager.unshiftNew(
      "MovePhase",
      pokemon,
      newTargets,
      new PokemonMove(move.id),
      MoveUseMode.REFLECTED,
      MovePhaseTimingModifier.FIRST,
    );
  }
}

// TODO: Make these ability attributes be flags instead of dummy attributes
/** @sealed */
export class NoTransformAbilityAbAttr extends AbAttr {
  constructor() {
    super(false);
  }
}

/** @sealed */
export class NoFusionAbilityAbAttr extends AbAttr {
  constructor() {
    super(false);
  }
}

/** @sealed */
export class IgnoreTypeImmunityAbAttr extends AbAttr {
  defenderType;
  allowedMoveTypes;

  constructor(defenderType, allowedMoveTypes) {
    super(false);
    this.defenderType = defenderType;
    this.allowedMoveTypes = allowedMoveTypes;
  }

  canApply({ moveType, defenderType, cancelled }) {
    return !cancelled.value && this.defenderType === defenderType && this.allowedMoveTypes.includes(moveType);
  }

  apply({ cancelled }) {
    cancelled.value = true;
  }
}

/**
 * Ignores the type immunity to Status Effects of the defender if the defender is of a certain type
 * @sealed
 */
export class IgnoreTypeStatusEffectImmunityAbAttr extends AbAttr {
  statusEffect;
  defenderType;

  constructor(statusEffect, defenderType) {
    super(false);

    this.statusEffect = statusEffect;
    this.defenderType = defenderType;
  }

  canApply({ statusEffect, defenderType, cancelled }) {
    return !cancelled.value && this.statusEffect.includes(statusEffect) && this.defenderType.includes(defenderType);
  }

  apply({ cancelled }) {
    cancelled.value = true;
  }
}

/** Gives money to the user after the battle. */
export class MoneyAbAttr extends PostBattleAbAttr {
  canApply({ simulated, victory }) {
    // TODO: Consider moving the simulated check to the apply method
    return !simulated && victory;
  }

  apply(_params) {
    globalScene.currentBattle.moneyScattered += globalScene.getWaveMoneyAmount(0.2);
  }
}

// TODO: Consider removing this class and just using the PostSummonStatStageChangeAbAttr with a conditionalAttr
// that checks for the presence of the tag.
/**
 * Applies a stat change after a Pokémon is summoned,
 * conditioned on the presence of a specific arena tag.
 * @sealed
 */
export class PostSummonStatStageChangeOnArenaAbAttr extends PostSummonStatStageChangeAbAttr {
  /** The type of arena tag that conditions the stat change. */
  arenaTagType;

  /**
   * Creates an instance of PostSummonStatStageChangeOnArenaAbAttr.
   * Initializes the stat change to increase Attack by 1 stage if the specified arena tag is present.
   *
   * @param tagType - The type of arena tag to check for.
   */
  constructor(tagType) {
    super([Stat.ATK], 1, true, false);
    this.arenaTagType = tagType;
  }

  canApply(params) {
    const side = params.pokemon.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
    return (globalScene.arena.getTagOnSide(this.arenaTagType, side) ?? false) && super.canApply(params);
  }
}

/**
 * Ability attribute to nullify damage from moves used against the user depending on their form.
 * This is used in the Disguise and Ice Face abilities.
 *
 * Does not apply to a user's substitute
 * @sealed
 */
// TODO: This assumes the pokemon's base form has the damage immunity and its 1st form doesn't;
// this should be reworked to not hardcode these assumptions
export class FormBlockDamageAbAttr extends ReceivedMoveDamageMultiplierAbAttr {
  formIndex;
  /** The percentage of maximum HP to deal in recoil, or `0` to deal none. */
  recoil;
  /**
   * The `i18n` locales key to show upon triggering.
   * Within it, the following variables will be populated:
   * - `pokemonNameWithAffix`: The name of the Pokémon with the ability
   * - `abilityName`: The name of the ability being triggered
   */
  // TODO: Remove `abilityName` from contexts for greater translator freedoms & such
  i18nKey;

  constructor(
    formIndex,
    i18nKey,
    recoil,
    // TODO: Since only Ice Face uses this, should this simply take the move and nothing else?
    condition = () => true,
  ) {
    super(condition, 0);

    this.formIndex = formIndex;
    this.i18nKey = i18nKey;
    this.recoil = recoil;
  }

  canApply({ pokemon, opponent, move, damage }) {
    // TODO: Investigate whether the substitute check can be removed, as it should be accounted for in the move effect phase
    return (
      damage.value > 0
      && pokemon.formIndex === this.formIndex
      && this.condition(pokemon, opponent, move)
      && !move.hitsSubstitute(opponent, pokemon)
    );
  }

  apply({ pokemon, simulated, damage }) {
    if (simulated) {
      return;
    }

    damage.value = 0;
    if (this.recoil > 0) {
      pokemon.damageAndUpdate(toDmgValue(pokemon.getMaxHp() * this.recoil), {
        result: HitResult.INDIRECT,
        ignoreSegments: true,
        ignoreFaintPhase: true,
      });
    }

    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger);
  }

  getTriggerMessage({ pokemon }, abilityName) {
    return i18next.t(this.i18nKey, { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), abilityName });
  }
}

/**
 * Base class for defining {@linkcode Ability} attributes before summon
 * (should use {@linkcode PostSummonAbAttr} for most ability)
 */

export class PreSummonAbAttr extends AbAttr {
  apply(_params) {}

  canApply(_params) {
    return true;
  }
}

/** @sealed */
export class IllusionPreSummonAbAttr extends PreSummonAbAttr {
  /**
   * Apply a new illusion when summoning Zoroark if the illusion is available
   *
   * @param pokemon - The Pokémon with the Illusion ability.
   */
  apply({ pokemon }) {
    const party = (pokemon.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty()).filter(
      p => p.isAllowedInBattle(),
    );
    let illusionPokemon;
    if (pokemon.hasTrainer()) {
      illusionPokemon = party.filter(p => p !== pokemon).at(-1) || pokemon;
    } else {
      illusionPokemon = globalScene.arena.randomSpecies(globalScene.currentBattle.waveIndex, pokemon.level);
    }
    pokemon.setIllusion(illusionPokemon);
  }

  /** @returns Whether the illusion can be applied. */
  canApply({ pokemon }) {
    if (pokemon.hasTrainer()) {
      const party = (pokemon.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty()).filter(
        p => p.isAllowedInBattle(),
      );
      const lastPokemon = party.filter(p => p !== pokemon).at(-1) || pokemon;
      const speciesId = lastPokemon.species.speciesId;

      // If the last conscious Pokémon in the party is a Terastallized Ogerpon or Terapagos, Illusion will not activate.
      // Illusion will also not activate if the Pokémon with Illusion is Terastallized and the last Pokémon in the party is Ogerpon or Terapagos.
      if (
        lastPokemon === pokemon
        || ((speciesId === SpeciesId.OGERPON || speciesId === SpeciesId.TERAPAGOS)
          && (lastPokemon.isTerastallized || pokemon.isTerastallized))
      ) {
        return false;
      }
    }
    return pokemon.summonData.illusion != null;
  }
}

/** @sealed */
export class IllusionBreakAbAttr extends AbAttr {
  // TODO: Consider adding a `canApply` method that checks if the pokemon has an active illusion
  apply({ pokemon }) {
    pokemon.breakIllusion();
  }
}

/** @sealed */
export class PostDefendIllusionBreakAbAttr extends PostDefendAbAttr {
  apply({ pokemon }) {
    pokemon.breakIllusion();
  }

  canApply({ pokemon, hitResult }) {
    // TODO: I remember this or a derivative being declared elsewhere - merge the 2 into 1
    // and store it somewhere globally accessible
    const damagingHitResults = new Set([
      HitResult.EFFECTIVE,
      HitResult.SUPER_EFFECTIVE,
      HitResult.NOT_VERY_EFFECTIVE,
      HitResult.ONE_HIT_KO,
    ]);
    return damagingHitResults.has(hitResult) && pokemon.summonData.illusion != null;
  }
}

export class IllusionPostBattleAbAttr extends PostBattleAbAttr {
  /**
   * Break the illusion once the battle ends
   *
   * @param pokemon - The Pokémon with the Illusion ability.
   * @param _passive - Unused
   * @param _args - Unused
   * @returns - Whether the illusion was applied.
   */
  apply({ pokemon }) {
    pokemon.breakIllusion();
  }
}

/**
 * If a Pokémon with this Ability selects a damaging move, it has a 30% chance of going first in its priority bracket. If the Ability activates, this is announced at the start of the turn (after move selection).
 * @sealed
 */
export class BypassSpeedChanceAbAttr extends AbAttr {
  chance;

  /**
   * @param chance - Probability of the ability activating
   */
  constructor(chance) {
    super(true);
    this.chance = chance;
  }

  canApply({ simulated, pokemon }) {
    // TODO: Consider whether we can move the simulated check to the `apply` method
    // May be difficult as we likely do not want to modify the randBattleSeed
    const turnCommand = globalScene.currentBattle.turnCommands[pokemon.getBattlerIndex()];
    const move = turnCommand?.move?.move ? allMoves[turnCommand.move.move] : null;
    const isDamageMove = move?.category === MoveCategory.PHYSICAL || move?.category === MoveCategory.SPECIAL;
    return (
      !simulated
      && pokemon.randBattleSeedInt(100) < this.chance
      && isDamageMove
      && pokemon.canAddTag(BattlerTagType.BYPASS_SPEED)
    );
  }

  /**
   * bypass move order in their priority bracket when pokemon choose damaging move
   */
  apply({ pokemon }) {
    pokemon.addTag(BattlerTagType.BYPASS_SPEED);
  }

  getTriggerMessage({ pokemon }, _abilityName) {
    return i18next.t("abilityTriggers:quickDraw", { pokemonName: getPokemonNameWithAffix(pokemon) });
  }
}

/**
 * This attribute checks if a Pokemon's move meets a provided condition to determine if the Pokemon can use Quick Claw
 * It was created because Pokemon with the ability Mycelium Might cannot access Quick Claw's benefits when using status moves.
 * @sealed
 */
export class PreventBypassSpeedChanceAbAttr extends AbAttr {
  condition;

  /**
   * @param condition - checks if a move meets certain conditions
   */
  constructor(condition) {
    super(true);
    this.condition = condition;
  }

  canApply({ pokemon }) {
    // TODO: Consider having these be passed as parameters instead of being retrieved here
    const turnCommand = globalScene.currentBattle.turnCommands[pokemon.getBattlerIndex()];
    const isCommandFight = turnCommand?.command === Command.FIGHT;
    const move = turnCommand?.move?.move ? allMoves[turnCommand.move.move] : null;
    return isCommandFight && this.condition(pokemon, move);
  }

  apply({ bypass }) {
    bypass.value = false;
  }
}

class ForceSwitchOutHelper {
  switchType;
  constructor(switchType) {
    this.switchType = switchType;
  }

  /**
   * Handles the logic for switching out a Pokémon based on battle conditions, HP, and the switch type.
   *
   * @param pokemon - The Pokémon attempting to switch out.
   * @returns `true` if the switch is successful
   */
  // TODO: Make this cancel pending move phases on the switched out target
  switchOutLogic(pokemon) {
    const switchOutTarget = pokemon;
    /*
     * If the switch-out target is a player-controlled Pokémon, the function checks:
     * - Whether there are available party members to switch in.
     * - If the Pokémon is still alive (hp > 0), and if so, it leaves the field and a new SwitchPhase is initiated.
     */
    if (switchOutTarget.isPlayer()) {
      if (globalScene.getPlayerParty().filter(p => p.isAllowedInBattle() && !p.isOnField()).length === 0) {
        return false;
      }

      if (switchOutTarget.hp > 0) {
        globalScene.phaseManager.queueDeferred(
          "SwitchPhase",
          this.switchType,
          switchOutTarget.getFieldIndex(),
          true,
          true,
        );
        return true;
      }
      /*
       * For non-wild battles, it checks if the opposing party has any available Pokémon to switch in.
       * If yes, the Pokémon leaves the field and a new SwitchSummonPhase is initiated.
       */
    } else if (globalScene.currentBattle.battleType !== BattleType.WILD) {
      if (globalScene.getEnemyParty().filter(p => p.isAllowedInBattle() && !p.isOnField()).length === 0) {
        return false;
      }
      if (switchOutTarget.hp > 0) {
        const summonIndex = globalScene.currentBattle.trainer
          ? globalScene.currentBattle.trainer.getNextSummonIndex((switchOutTarget).trainerSlot)
          : 0;
        globalScene.phaseManager.queueDeferred(
          "SwitchSummonPhase",
          this.switchType,
          switchOutTarget.getFieldIndex(),
          summonIndex,
          false,
          false,
        );
        return true;
      }
      /*
       * For wild Pokémon battles, the Pokémon will flee if the conditions are met (waveIndex and double battles).
       * It will not flee if it is a Mystery Encounter with fleeing disabled (checked in `getSwitchOutCondition()`) or if it is a wave 10x wild boss
       */
    } else {
      const allyPokemon = switchOutTarget.getAlly();

      if (!globalScene.currentBattle.waveIndex || globalScene.currentBattle.waveIndex % 5 === 0) {
        return false;
      }

      if (switchOutTarget.hp > 0) {
        switchOutTarget.leaveField(false);
        globalScene.phaseManager.queueMessage(
          i18next.t("moveTriggers:fled", { pokemonName: getPokemonNameWithAffix(switchOutTarget) }),
          null,
          true,
          500,
        );
      }

      if (!allyPokemon?.isActive(true)) {
        globalScene.clearEnemyHeldItemModifiers();

        if (switchOutTarget.hp) {
          globalScene.phaseManager.pushNew("BattleEndPhase", false);

          if (globalScene.gameMode.hasRandomBiomes || globalScene.isNewBiome()) {
            globalScene.phaseManager.pushNew("SelectBiomePhase");
          }

          globalScene.phaseManager.pushNew("NewBattlePhase");
        }
      }
    }
    return false;
  }

  /**
   * Determines if a Pokémon can switch out based on its status, the opponent's status, and battle conditions.
   *
   * @param pokemon - The Pokémon attempting to switch out
   * @param opponent - The opponent Pokémon
   * @returns `true` if the switch-out condition is met
   */
  getSwitchOutCondition(pokemon, opponent) {
    const switchOutTarget = pokemon;
    const player = switchOutTarget.isPlayer();

    if (player) {
      const blockedByAbility = new BooleanHolder(false);
      applyAbAttrs("ForceSwitchOutImmunityAbAttr", { pokemon: opponent, cancelled: blockedByAbility });
      return !blockedByAbility.value;
    }

    if (
      !player
      && globalScene.currentBattle.battleType === BattleType.WILD
      && !globalScene.currentBattle.waveIndex
      && globalScene.currentBattle.waveIndex % 10 === 0
    ) {
      return false;
    }

    if (
      !player
      && globalScene.currentBattle.isBattleMysteryEncounter()
      && !globalScene.currentBattle.mysteryEncounter?.fleeAllowed
    ) {
      return false;
    }

    const party = player ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
    return (
      (!player && globalScene.currentBattle.battleType === BattleType.WILD)
      || party.filter(
        p =>
          p.isAllowedInBattle()
          && !p.isOnField()
          && (player || (p).trainerSlot === (switchOutTarget).trainerSlot),
      ).length > 0
    );
  }

  /**
   * Returns a message if the switch-out attempt fails due to ability effects.
   *
   * @param target The target Pokémon.
   * @returns The failure message, or `null` if no failure.
   */
  getFailedText(target) {
    const blockedByAbility = new BooleanHolder(false);
    applyAbAttrs("ForceSwitchOutImmunityAbAttr", { pokemon: target, cancelled: blockedByAbility });
    return blockedByAbility.value
      ? i18next.t("moveTriggers:cannotBeSwitchedOut", { pokemonName: getPokemonNameWithAffix(target) })
      : null;
  }
}

/**
 * Ability attribute for modifying move stats during AI move generation.
 * Modifies the power and accuracy multiplier of the move, agnostic of the move's target.
 *
 * ⚠️ Should not be added for abilities that already have any `VariableMovePowerAbAttr`
 *
 * @remarks
 * Meant to be used for things like Drizzle (which gives water moves a 1.5x power boost)
 * or things like compound eyes / victory star (which are treated as increasing move accuracy).
 *
 * @see {@linkcode AiMovegenMoveStatsAbAttrParams}
 */
export class AiMovegenMoveStatsAbAttr extends AbAttr {
  effect;
  constructor(effect) {
    super(false);
    this.effect = effect;
  }

  canApply(_params) {
    return globalScene.movesetGenInProgress;
  }
  apply(params) {
    this.effect(params);
  }
}

/** Used for No Guard. */
export class AlwaysHitAbAttr extends AiMovegenMoveStatsAbAttr {
  constructor() {
    super(({ accMult }) => {
      accMult.value = Number.POSITIVE_INFINITY;
    });
  }
}

/**
 * Calculate the amount of recovery from the Shell Bell item.
 * @remarks
 * If the Pokémon is holding a Shell Bell, this function computes the amount of health
 * recovered based on the damage dealt in the current turn. \
 * The recovery is multiplied by the Shell Bell's modifier (if any).
 *
 * @param pokemon - The Pokémon whose Shell Bell recovery is being calculated.
 * @returns The amount of health recovered by Shell Bell.
 */
function calculateShellBellRecovery(pokemon) {
  const shellBellModifier = pokemon.getHeldItems().find(m => m instanceof HitHealModifier);
  if (shellBellModifier) {
    return toDmgValue(pokemon.turnData.totalDamageDealt / 8) * shellBellModifier.stackCount;
  }
  return 0;
}

/** Triggers after the Pokemon takes any damage */
export class PostDamageAbAttr extends AbAttr {
  canApply(_params) {
    return true;
  }

  apply(_params) {}
}

/**
 * Ability attribute for forcing a Pokémon to switch out after its health drops below half.
 * This attribute checks various conditions related to the damage received, the moves used by the Pokémon
 * and its opponents, and determines whether a forced switch-out should occur.
 *
 * Used by Wimp Out and Emergency Exit
 * @sealed
 */
export class PostDamageForceSwitchAbAttr extends PostDamageAbAttr {
  helper = new ForceSwitchOutHelper(SwitchType.SWITCH);
  hpRatio;

  constructor(hpRatio = 0.5) {
    super();
    this.hpRatio = hpRatio;
  }

  // TODO: Refactor to use more early returns
  canApply({ pokemon, source, damage }) {
    // Will not activate when the Pokémon's HP is lowered by cutting its own HP
    const forbiddenAttackingMoves = [MoveId.BELLY_DRUM, MoveId.SUBSTITUTE, MoveId.CURSE, MoveId.PAIN_SPLIT];
    const lastMoveUsed = pokemon.getLastXMoves()[0];
    if (forbiddenAttackingMoves.includes(lastMoveUsed?.move)) {
      return false;
    }

    // Dragon Tail and Circle Throw switch out Pokémon before the Ability activates.
    const forbiddenDefendingMoves = [MoveId.DRAGON_TAIL, MoveId.CIRCLE_THROW];
    if (source) {
      const enemyLastMoveUsed = source.getLastXMoves()[0];
      if (enemyLastMoveUsed) {
        // Will not activate if the Pokémon's HP falls below half while it is in the air during Sky Drop.
        if (
          forbiddenDefendingMoves.includes(enemyLastMoveUsed.move)
          || (enemyLastMoveUsed.move === MoveId.SKY_DROP && enemyLastMoveUsed.result === MoveResult.OTHER)
        ) {
          return false;
          // Will not activate if the Pokémon's HP falls below half by a move affected by Sheer Force.
          // TODO: Make this use the sheer force disable condition
        }
        if (allMoves[enemyLastMoveUsed.move].chance >= 0 && source.hasAbility(AbilityId.SHEER_FORCE)) {
          return false;
        }
        // Activate only after the last hit of multistrike moves
        if (source.turnData.hitsLeft > 1) {
          return false;
        }
        if (source.turnData.hitCount > 1) {
          damage = pokemon.turnData.damageTaken;
        }
      }
    }

    if (pokemon.hp + damage >= pokemon.getMaxHp() * this.hpRatio) {
      const shellBellHeal = calculateShellBellRecovery(pokemon);
      if (pokemon.hp - shellBellHeal < pokemon.getMaxHp() * this.hpRatio) {
        for (const opponent of pokemon.getOpponents()) {
          if (!this.helper.getSwitchOutCondition(pokemon, opponent)) {
            return false;
          }
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Applies the switch-out logic after the Pokémon takes damage.
   * Checks various conditions based on the moves used by the Pokémon, the opponents' moves, and
   * the Pokémon's health after damage to determine whether the switch-out should occur.
   */
  apply({ pokemon }) {
    // TODO: Consider respecting the `simulated` flag here
    this.helper.switchOutLogic(pokemon);
  }
}

/**
 * @returns all Pokémon on field that have weather-based forms
 */
function getPokemonWithWeatherBasedForms() {
  return globalScene
    .getField(true)
    .filter(
      p =>
        (p.hasAbility(AbilityId.FORECAST) && p.species.speciesId === SpeciesId.CASTFORM)
        || (p.hasAbility(AbilityId.FLOWER_GIFT) && p.species.speciesId === SpeciesId.CHERRIM),
    );
}

export function getWeatherCondition(...weatherTypes) {
  return () => {
    if (globalScene.arena.weather?.isEffectSuppressed()) {
      return false;
    }
    return weatherTypes.includes(globalScene.arena.weatherType);
  };
}

/** Map of all ability attribute constructors, for use with the `.is` method. */
export const AbilityAttrs = Object.freeze({
  AddSecondStrikeAbAttr,
  AlliedFieldDamageReductionAbAttr,
  AllyMoveCategoryPowerBoostAbAttr,
  AllyStatMultiplierAbAttr,
  AlwaysHitAbAttr,
  ArenaTrapAbAttr,
  AttackTypeImmunityAbAttr,
  BattlerTagImmunityAbAttr,
  BlockCritAbAttr,
  BlockItemTheftAbAttr,
  BlockNonDirectDamageAbAttr,
  BlockOneHitKOAbAttr,
  BlockRecoilDamageAttr,
  BlockRedirectAbAttr,
  BlockStatusDamageAbAttr,
  BonusCritAbAttr,
  BypassBurnDamageReductionAbAttr,
  BypassSpeedChanceAbAttr,
  ChangeMovePriorityAbAttr,
  ChangeMovePriorityInBracketAbAttr,
  CheckTrappedAbAttr,
  ConditionalCritAbAttr,
  ConditionalUserFieldBattlerTagImmunityAbAttr,
  ConditionalUserFieldProtectStatAbAttr,
  ConditionalUserFieldStatusEffectImmunityAbAttr,
  ConfusionOnStatusEffectAbAttr,
  CopyFaintedAllyAbilityAbAttr,
  CudChewConsumeBerryAbAttr,
  CudChewRecordBerryAbAttr,
  DoubleBerryEffectAbAttr,
  DownloadAbAttr,
  EffectSporeAbAttr,
  ExecutedMoveAbAttr,
  FieldMovePowerBoostAbAttr,
  FieldMoveTypePowerBoostAbAttr,
  FieldMultiplyStatAbAttr,
  FieldPreventExplosiveMovesAbAttr,
  FieldPriorityMoveImmunityAbAttr,
  FlinchEffectAbAttr,
  FlinchStatStageChangeAbAttr,
  ForceSwitchOutImmunityAbAttr,
  ForewarnAbAttr,
  FormBlockDamageAbAttr,
  FriskAbAttr,
  FullHpResistTypeAbAttr,
  GorillaTacticsAbAttr,
  HealFromBerryUseAbAttr,
  IgnoreContactAbAttr,
  IgnoreMoveEffectsAbAttr,
  IgnoreOpponentStatStagesAbAttr,
  IgnoreProtectOnContactAbAttr,
  IgnoreTypeImmunityAbAttr,
  IgnoreTypeStatusEffectImmunityAbAttr,
  IllusionBreakAbAttr,
  IllusionPostBattleAbAttr,
  IllusionPreSummonAbAttr,
  IncreasePpAbAttr,
  InfiltratorAbAttr,
  IntimidateImmunityAbAttr,
  LowHpMoveTypePowerBoostAbAttr,
  MaxMultiHitAbAttr,
  MoneyAbAttr,
  MoodyAbAttr,
  MoveAbilityBypassAbAttr,
  MoveDamageBoostAbAttr,
  MoveEffectChanceMultiplierAbAttr,
  MoveImmunityAbAttr,
  MoveImmunityStatStageChangeAbAttr,
  MovePowerBoostAbAttr,
  MoveTypeChangeAbAttr,
  MoveTypePowerBoostAbAttr,
  MultCritAbAttr,
  NoFusionAbilityAbAttr,
  NoTransformAbilityAbAttr,
  NonSuperEffectiveImmunityAbAttr,
  PokemonTypeChangeAbAttr,
  PostAttackAbAttr,
  PostAttackApplyBattlerTagAbAttr,
  PostAttackApplyStatusEffectAbAttr,
  PostAttackContactApplyStatusEffectAbAttr,
  PostAttackStealHeldItemAbAttr,
  PostBattleAbAttr,
  PostBattleInitAbAttr,
  PostBattleInitFormChangeAbAttr,
  PostBattleLootAbAttr,
  PostBiomeChangeAbAttr,
  PostBiomeChangeWeatherChangeAbAttr,
  PostDamageAbAttr,
  PostDamageForceSwitchAbAttr,
  PostDancingMoveAbAttr,
  PostDefendAbAttr,
  PostDefendAbilityGiveAbAttr,
  PostDefendAbilitySwapAbAttr,
  PostDefendApplyArenaTrapTagAbAttr,
  PostDefendApplyBattlerTagAbAttr,
  PostDefendContactApplyStatusEffectAbAttr,
  PostDefendContactApplyTagChanceAbAttr,
  PostDefendContactDamageAbAttr,
  PostDefendHpGatedStatStageChangeAbAttr,
  PostDefendIllusionBreakAbAttr,
  PostDefendMoveDisableAbAttr,
  PostDefendPerishSongAbAttr,
  PostDefendStatStageChangeAbAttr,
  PostDefendStealHeldItemAbAttr,
  PostDefendTypeChangeAbAttr,
  PostDefendWeatherChangeAbAttr,
  PostFaintAbAttr,
  PostFaintContactDamageAbAttr,
  PostFaintHPDamageAbAttr,
  PostFaintUnsuppressedWeatherFormChangeAbAttr,
  PostIntimidateStatStageChangeAbAttr,
  PostItemLostAbAttr,
  PostItemLostApplyBattlerTagAbAttr,
  PostKnockOutAbAttr,
  PostKnockOutStatStageChangeAbAttr,
  PostMoveUsedAbAttr,
  PostReceiveCritStatStageChangeAbAttr,
  PostSetStatusAbAttr,
  PostStatStageChangeAbAttr,
  PostStatStageChangeStatStageChangeAbAttr,
  PostSummonAbAttr,
  PostSummonAddArenaTagAbAttr,
  PostSummonAddBattlerTagAbAttr,
  PostSummonAllyHealAbAttr,
  PostSummonClearAllyStatStagesAbAttr,
  PostSummonCopyAbilityAbAttr,
  PostSummonCopyAllyStatsAbAttr,
  PostSummonFormChangeAbAttr,
  PostSummonFormChangeByWeatherAbAttr,
  PostSummonHealStatusAbAttr,
  PostSummonMessageAbAttr,
  PostSummonRemoveArenaTagAbAttr,
  PostSummonRemoveBattlerTagAbAttr,
  PostSummonRemoveEffectAbAttr,
  PostSummonStatStageChangeAbAttr,
  PostSummonStatStageChangeOnArenaAbAttr,
  PostSummonTransformAbAttr,
  PostSummonUnnamedMessageAbAttr,
  PostSummonUserFieldRemoveStatusEffectAbAttr,
  PostSummonWeatherChangeAbAttr,
  PostSummonWeatherSuppressedFormChangeAbAttr,
  PostTurnAbAttr,
  PostTurnFormChangeAbAttr,
  PostTurnHealAbAttr,
  PostTurnHurtIfSleepingAbAttr,
  PostTurnResetStatusAbAttr,
  PostTurnRestoreBerryAbAttr,
  PostTurnStatusHealAbAttr,
  PostVictoryAbAttr,
  PostVictoryFormChangeAbAttr,
  PostWeatherChangeAbAttr,
  PostWeatherChangeFormChangeAbAttr,
  IceFaceFormChangeAbAttr,
  PostWeatherLapseAbAttr,
  PostWeatherLapseDamageAbAttr,
  PostWeatherLapseHealAbAttr,
  PreApplyBattlerTagAbAttr,
  PreApplyBattlerTagImmunityAbAttr,
  PreAttackAbAttr,
  PreAttackFieldMoveTypePowerBoostAbAttr,
  PreDefendAbAttr,
  PreDefendFullHpEndureAbAttr,
  PreLeaveFieldAbAttr,
  PreLeaveFieldClearWeatherAbAttr,
  PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr,
  PreSetStatusAbAttr,
  PreSetStatusEffectImmunityAbAttr,
  PreStatStageChangeAbAttr,
  PreSummonAbAttr,
  PreSwitchOutAbAttr,
  PreSwitchOutFormChangeAbAttr,
  PreSwitchOutHealAbAttr,
  PreSwitchOutResetStatusAbAttr,
  PreWeatherDamageAbAttr,
  PreWeatherEffectAbAttr,
  PreventBerryUseAbAttr,
  PreventBypassSpeedChanceAbAttr,
  ProtectStatAbAttr,
  ReceivedMoveDamageMultiplierAbAttr,
  ReceivedTypeDamageMultiplierAbAttr,
  RedirectMoveAbAttr,
  RedirectTypeMoveAbAttr,
  ReduceBerryUseThresholdAbAttr,
  ReduceBurnDamageAbAttr,
  ReduceStatusEffectDurationAbAttr,
  ReflectStatStageChangeAbAttr,
  ReflectStatusMoveAbAttr,
  ReverseDrainAbAttr,
  RunSuccessAbAttr,
  SpeedBoostAbAttr,
  StabBoostAbAttr,
  StatMultiplierAbAttr,
  StatStageChangeCopyAbAttr,
  StatStageChangeMultiplierAbAttr,
  StatusEffectImmunityAbAttr,
  SuppressWeatherEffectAbAttr,
  SyncEncounterNatureAbAttr,
  SynchronizeStatusAbAttr,
  TypeImmunityAbAttr,
  TypeImmunityHealAbAttr,
  UserFieldBattlerTagImmunityAbAttr,
  UserFieldMoveTypePowerBoostAbAttr,
  UserFieldStatusEffectImmunityAbAttr,
  VariableMovePowerAbAttr,
  VariableMovePowerBoostAbAttr,
  WeightMultiplierAbAttr,
  WonderSkinAbAttr,
  AiMovegenMoveStatsAbAttr,
});