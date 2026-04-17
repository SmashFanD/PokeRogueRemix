import {
  AddSecondStrikeAbAttr,
  AiMovegenMoveStatsAbAttr,
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
  BlockWeatherDamageAttr,
  BonusCritAbAttr,
  BypassBurnDamageReductionAbAttr,
  BypassSpeedChanceAbAttr,
  ChangeMovePriorityAbAttr,
  ChangeMovePriorityInBracketAbAttr,
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
  FieldMoveTypePowerBoostAbAttr,
  FieldMultiplyStatAbAttr,
  FieldPreventExplosiveMovesAbAttr,
  FieldPriorityMoveImmunityAbAttr,
  FlinchStatStageChangeAbAttr,
  ForceSwitchOutImmunityAbAttr,
  ForewarnAbAttr,
  FormBlockDamageAbAttr,
  FriskAbAttr,
  FullHpResistTypeAbAttr,
  GorillaTacticsAbAttr,
  getWeatherCondition,
  HealFromBerryUseAbAttr,
  IceFaceFormChangeAbAttr,
  IgnoreContactAbAttr,
  IgnoreMoveEffectsAbAttr,
  IgnoreOpponentStatStagesAbAttr,
  IgnoreProtectOnContactAbAttr,
  IgnoreTypeImmunityAbAttr,
  IgnoreTypeStatusEffectImmunityAbAttr,
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
  NonSuperEffectiveImmunityAbAttr,
  NoTransformAbilityAbAttr,
  PokemonTypeChangeAbAttr,
  PostAttackApplyBattlerTagAbAttr,
  PostAttackApplyStatusEffectAbAttr,
  PostAttackContactApplyStatusEffectAbAttr,
  PostAttackStealHeldItemAbAttr,
  PostBattleInitFormChangeAbAttr,
  PostBattleLootAbAttr,
  PostBiomeChangeWeatherChangeAbAttr,
  PostDamageForceSwitchAbAttr,
  PostDancingMoveAbAttr,
  PostDefendAbilityGiveAbAttr,
  PostDefendAbilitySwapAbAttr,
  PostDefendApplyArenaTrapTagAbAttr,
  PostDefendApplyBattlerTagAbAttr,
  PostDefendContactApplyStatusEffectAbAttr,
  PostDefendContactApplyTagChanceAbAttr,
  PostDefendContactDamageAbAttr,
  PostDefendHpGatedStatStageChangeAbAttr,
  PostDefendMoveDisableAbAttr,
  PostDefendPerishSongAbAttr,
  PostDefendStatStageChangeAbAttr,
  PostDefendStealHeldItemAbAttr,
  PostDefendTypeChangeAbAttr,
  PostDefendWeatherChangeAbAttr,
  PostFaintContactDamageAbAttr,
  PostFaintFormChangeAbAttr,
  PostFaintHPDamageAbAttr,
  PostFaintUnsuppressedWeatherFormChangeAbAttr,
  PostIntimidateStatStageChangeAbAttr,
  PostItemLostApplyBattlerTagAbAttr,
  PostKnockOutStatStageChangeAbAttr,
  PostReceiveCritStatStageChangeAbAttr,
  PostStatStageChangeStatStageChangeAbAttr,
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
  PostSummonStatStageChangeAbAttr,
  PostSummonStatStageChangeOnArenaAbAttr,
  PostSummonTransformAbAttr,
  PostSummonUnnamedMessageAbAttr,
  PostSummonUserFieldRemoveStatusEffectAbAttr,
  PostSummonWeatherChangeAbAttr,
  PostSummonWeatherSuppressedFormChangeAbAttr,
  PostTurnFormChangeAbAttr,
  PostTurnHurtIfSleepingAbAttr,
  PostTurnResetStatusAbAttr,
  PostTurnRestoreBerryAbAttr,
  PostTurnStatusHealAbAttr,
  PostVictoryFormChangeAbAttr,
  PostVictoryStatStageChangeAbAttr,
  PostWeatherChangeAddBattlerTagAbAttr,
  PostWeatherChangeFormChangeAbAttr,
  PostWeatherLapseDamageAbAttr,
  PostWeatherLapseHealAbAttr,
  PreDefendFullHpEndureAbAttr,
  PreLeaveFieldClearWeatherAbAttr,
  PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr,
  PreSwitchOutFormChangeAbAttr,
  PreSwitchOutHealAbAttr,
  PreSwitchOutResetStatusAbAttr,
  PreventBerryUseAbAttr,
  PreventBypassSpeedChanceAbAttr,
  ProtectStatAbAttr,
  ReceivedMoveDamageMultiplierAbAttr,
  ReceivedTypeDamageMultiplierAbAttr,
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
  TypeImmunityAddBattlerTagAbAttr,
  TypeImmunityHealAbAttr,
  TypeImmunityStatStageChangeAbAttr,
  UserFieldBattlerTagImmunityAbAttr,
  UserFieldMoveTypePowerBoostAbAttr,
  UserFieldStatusEffectImmunityAbAttr,
  WeightMultiplierAbAttr,
  WonderSkinAbAttr,
} from "./ab-attrs.js";
import { AbilityId } from "../../enums/ability-id.js";
import { ArenaTagType } from "../../enums/arena-tag-type.js";
import { BattlerTagType } from "../../enums/battler-tag-type.js";
import { MoveCategory } from "../../enums/move-category.js";
import { MoveFlags } from "../../enums/move-flags.js";
import { MoveId } from "../../enums/move-id.js";
import { PokemonType } from "../../enums/pokemon-type.js";
import { Stat } from "../../enums/stat.js";
import { StatusEffect } from "../../enums/status-effect.js";
import { WeatherType } from "../../enums/weather-type.js";
import { i18next } from "../../i18next.js";
import { allAbilities } from "../data-list.js";
import { AbBuilder } from "./ability.js";
import { MovePriorityInBracket } from "../../enums/move-priority-in-bracket.js";

export function initAbilities() {
  (allAbilities).push(
    new AbBuilder(AbilityId.NONE, 3).build(),
    new AbBuilder(AbilityId.STENCH, 3) //
      .attr(
        PostAttackApplyBattlerTagAbAttr,
        false,
        (user, target, move) => (!move.hasAttr("FlinchAttr") && !move.hitsSubstitute(user, target) ? 10 : 0),
        BattlerTagType.FLINCHED,
      )
      .build(),
    new AbBuilder(AbilityId.DRIZZLE, 3) //
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.RAIN)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.RAIN)
      .attr(AiMovegenMoveStatsAbAttr, drizzleAiMovegenEffect)
      .build(),
    new AbBuilder(AbilityId.SPEED_BOOST, 3) //
      .attr(SpeedBoostAbAttr)
      .build(),
    new AbBuilder(AbilityId.BATTLE_ARMOR, 3) //
      .attr(BlockCritAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.STURDY, 3) //
      .attr(PreDefendFullHpEndureAbAttr)
      .attr(BlockOneHitKOAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.DAMP, 3) //
      .attr(FieldPreventExplosiveMovesAbAttr)
      .attr(AiMovegenMoveStatsAbAttr, params => {
        if (params.move.hasCondition(failIfDampCondition)) {
          params.powerMult.value = 0;
        }
      })
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.LIMBER, 3) //
      .attr(StatusEffectImmunityAbAttr, StatusEffect.PARALYSIS)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.PARALYSIS)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SAND_VEIL, 3) //
      .attr(StatMultiplierAbAttr, Stat.EVA, 1.2)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM))
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.STATIC, 3) //
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.PARALYSIS)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.VOLT_ABSORB, 3) //
      .attr(TypeImmunityHealAbAttr, PokemonType.ELECTRIC)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.WATER_ABSORB, 3) //
      .attr(TypeImmunityHealAbAttr, PokemonType.WATER)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.OBLIVIOUS, 3) //
      .attr(BattlerTagImmunityAbAttr, [BattlerTagType.INFATUATED, BattlerTagType.TAUNT])
      .attr(PostSummonRemoveBattlerTagAbAttr, BattlerTagType.INFATUATED, BattlerTagType.TAUNT)
      .attr(IntimidateImmunityAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.CLOUD_NINE, 3) //
      .attr(SuppressWeatherEffectAbAttr, true)
      .attr(PostSummonUnnamedMessageAbAttr, i18next.t("abilityTriggers:weatherEffectDisappeared"))
      .attr(PostSummonWeatherSuppressedFormChangeAbAttr)
      .attr(PostFaintUnsuppressedWeatherFormChangeAbAttr)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.COMPOUND_EYES, 3) //
      .attr(StatMultiplierAbAttr, Stat.ACC, 1.3)
      .attr(AiMovegenMoveStatsAbAttr, ({ accMult }) => {
        accMult.value *= 1.3;
      })
      .build(),
    new AbBuilder(AbilityId.INSOMNIA, 3) //
      .attr(StatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.SLEEP)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.COLOR_CHANGE, 3) //
      .attr(PostDefendTypeChangeAbAttr)
      .condition(sheerForceHitDisableAbCondition)
      .build(),
    new AbBuilder(AbilityId.IMMUNITY, 3) //
      .attr(StatusEffectImmunityAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.FLASH_FIRE, 3) //
      .attr(TypeImmunityAddBattlerTagAbAttr, PokemonType.FIRE, BattlerTagType.FIRE_BOOST, 1)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SHIELD_DUST, 3) //
      .attr(IgnoreMoveEffectsAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.OWN_TEMPO, 3) //
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.CONFUSED)
      .attr(PostSummonRemoveBattlerTagAbAttr, BattlerTagType.CONFUSED)
      .attr(IntimidateImmunityAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SUCTION_CUPS, 3) //
      .attr(ForceSwitchOutImmunityAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.INTIMIDATE, 3) //
      .attr(PostSummonStatStageChangeAbAttr, [Stat.ATK], -1, false, true)
      .build(),
    new AbBuilder(AbilityId.SHADOW_TAG, 3) //
      .attr(ArenaTrapAbAttr, (_user, target) => !target.hasAbility(AbilityId.SHADOW_TAG))
      .build(),
    new AbBuilder(AbilityId.ROUGH_SKIN, 3) //
      .attr(PostDefendContactDamageAbAttr, 8)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.WONDER_GUARD, 3) //
      .attr(NonSuperEffectiveImmunityAbAttr)
      .uncopiable()
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.LEVITATE, 3) //
      .attr(
        AttackTypeImmunityAbAttr,
        PokemonType.GROUND,
        (pokemon) => !pokemon.getTag(GroundedTag) && !globalScene.arena.getTag(ArenaTagType.GRAVITY),
      )
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.EFFECT_SPORE, 3) //
      .attr(EffectSporeAbAttr)
      .build(),
    new AbBuilder(AbilityId.SYNCHRONIZE, 3) //
      .attr(SyncEncounterNatureAbAttr)
      .attr(SynchronizeStatusAbAttr)
      .build(),
    new AbBuilder(AbilityId.CLEAR_BODY, 3) //
      .attr(ProtectStatAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.NATURAL_CURE, 3) //
      .attr(PreSwitchOutResetStatusAbAttr)
      .build(),
    new AbBuilder(AbilityId.LIGHTNING_ROD, 3) //
      .attr(RedirectTypeMoveAbAttr, PokemonType.ELECTRIC)
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.ELECTRIC, Stat.SPATK, 1)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SERENE_GRACE, 3) //
      .attr(MoveEffectChanceMultiplierAbAttr, 2)
      .build(),
    new AbBuilder(AbilityId.SWIFT_SWIM, 3) //
      .attr(StatMultiplierAbAttr, Stat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.RAIN, WeatherType.HEAVY_RAIN))
      .build(),
    new AbBuilder(AbilityId.CHLOROPHYLL, 3) //
      .attr(StatMultiplierAbAttr, Stat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN))
      .build(),
    new AbBuilder(AbilityId.ILLUMINATE, 3) //
      .attr(ProtectStatAbAttr, Stat.ACC)
      .attr(IgnoreOpponentStatStagesAbAttr, [Stat.EVA])
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.TRACE, 3) //
      .attr(PostSummonCopyAbilityAbAttr)
      .uncopiable()
      .build(),
    new AbBuilder(AbilityId.HUGE_POWER, 3) //
      .attr(StatMultiplierAbAttr, Stat.ATK, 2)
      .attr(AiMovegenMoveStatsAbAttr, ({ move, powerMult }) => {
        if (move.category === MoveCategory.PHYSICAL) {
          powerMult.value *= 2;
        }
      })
      .build(),
    new AbBuilder(AbilityId.POISON_POINT, 3) //
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.POISON)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.INNER_FOCUS, 3) //
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.FLINCHED)
      .attr(IntimidateImmunityAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.MAGMA_ARMOR, 3) //
      .attr(StatusEffectImmunityAbAttr, StatusEffect.FREEZE)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.FREEZE)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.WATER_VEIL, 3) //
      .attr(StatusEffectImmunityAbAttr, StatusEffect.BURN)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.BURN)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.MAGNET_PULL, 3) //
      .attr(ArenaTrapAbAttr, (_user, target) => {
        return (
          target.getTypes(true).includes(PokemonType.STEEL)
          || (target.getTypes(true).includes(PokemonType.STELLAR) && target.getTypes().includes(PokemonType.STEEL))
        );
      })
      .build(),
    new AbBuilder(AbilityId.SOUNDPROOF, 3) //
      .attr(
        MoveImmunityAbAttr,
        (pokemon, attacker, move) => pokemon !== attacker && move.hasFlag(MoveFlags.SOUND_BASED),
      )
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.RAIN_DISH, 3) //
      .attr(PostWeatherLapseHealAbAttr, 1, WeatherType.RAIN, WeatherType.HEAVY_RAIN)
      .build(),
    new AbBuilder(AbilityId.SAND_STREAM, 3) //
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SANDSTORM)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SANDSTORM)
      .build(),
    new AbBuilder(AbilityId.PRESSURE, 3) //
      .attr(IncreasePpAbAttr)
      .attr(PostSummonMessageAbAttr, (pokemon) =>
        i18next.t("abilityTriggers:postSummonPressure", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }),
      )
      .build(),
    new AbBuilder(AbilityId.THICK_FAT, 3) //
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.FIRE, 0.5)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.ICE, 0.5)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.EARLY_BIRD, 3) //
      .attr(ReduceStatusEffectDurationAbAttr, StatusEffect.SLEEP)
      .build(),
    new AbBuilder(AbilityId.FLAME_BODY, 3) //
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.BURN)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.RUN_AWAY, 3) //
      .attr(RunSuccessAbAttr)
      .build(),
    new AbBuilder(AbilityId.KEEN_EYE, 3) //
      .attr(ProtectStatAbAttr, Stat.ACC)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.HYPER_CUTTER, 3) //
      .attr(ProtectStatAbAttr, Stat.ATK)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.PICKUP, 3) //
      .attr(PostBattleLootAbAttr)
      .unsuppressable()
      .build(),
    new AbBuilder(AbilityId.TRUANT, 3) //
      .attr(PostSummonAddBattlerTagAbAttr, BattlerTagType.TRUANT, 1, false)
      .build(),
    new AbBuilder(AbilityId.HUSTLE, 3) //
      .attr(StatMultiplierAbAttr, Stat.ATK, 1.5)
      .attr(StatMultiplierAbAttr, Stat.ACC, 0.8, (_user, _target, move) => move.category === MoveCategory.PHYSICAL)
      .attr(AiMovegenMoveStatsAbAttr, ({ move, accMult, powerMult }) => {
        if (move.category === MoveCategory.PHYSICAL) {
          accMult.value *= 0.8;
          powerMult.value *= 1.5;
        }
      })
      .build(),
    new AbBuilder(AbilityId.CUTE_CHARM, 3) //
      .attr(PostDefendContactApplyTagChanceAbAttr, 30, BattlerTagType.INFATUATED)
      .build(),
    new AbBuilder(AbilityId.PLUS, 3) //
      //Only check if an ally on the team has Plus or Minus since no double battle, may need to nerf
      .conditionalAttr(
        p =>
          [AbilityId.PLUS, AbilityId.MINUS].some(a => p.getAlly()?.hasAbility(a) ?? false),
        StatMultiplierAbAttr,
        Stat.SPATK,
        1.5,
      )
      .build(),
    new AbBuilder(AbilityId.MINUS, 3) //
      .conditionalAttr(
        p =>
          [AbilityId.PLUS, AbilityId.MINUS].some(a => p.getAlly()?.hasAbility(a) ?? false),
        StatMultiplierAbAttr,
        Stat.SPATK,
        1.5,
      )
      .build(),
    new AbBuilder(AbilityId.FORECAST, 3, -2) //
      .uncopiable()
      .unreplaceable()
      .attr(NoFusionAbilityAbAttr)
      .attr(PostSummonFormChangeByWeatherAbAttr)
      .attr(PostWeatherChangeFormChangeAbAttr, AbilityId.FORECAST, [
        WeatherType.NONE,
        WeatherType.SANDSTORM,
        WeatherType.STRONG_WINDS,
        WeatherType.FOG,
      ])
      .build(),
    new AbBuilder(AbilityId.STICKY_HOLD, 3) //
      .attr(BlockItemTheftAbAttr)
      .bypassFaint()
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SHED_SKIN, 3) //
      .conditionalAttr(_pokemon => !randSeedInt(3), PostTurnResetStatusAbAttr)
      .build(),
    new AbBuilder(AbilityId.GUTS, 3) //
      .attr(BypassBurnDamageReductionAbAttr)
      .conditionalAttr(
        pokemon => !!pokemon.status || pokemon.hasAbility(AbilityId.COMATOSE),
        StatMultiplierAbAttr,
        Stat.ATK,
        1.5,
      )
      .build(),
    new AbBuilder(AbilityId.MARVEL_SCALE, 3) //
      .conditionalAttr(
        pokemon => !!pokemon.status || pokemon.hasAbility(AbilityId.COMATOSE),
        StatMultiplierAbAttr,
        Stat.DEF,
        1.5,
      )
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.LIQUID_OOZE, 3) //
      .attr(ReverseDrainAbAttr)
      .build(),
    new AbBuilder(AbilityId.OVERGROW, 3) //
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.GRASS)
      .build(),
    new AbBuilder(AbilityId.BLAZE, 3) //
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.FIRE)
      .build(),
    new AbBuilder(AbilityId.TORRENT, 3) //
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.WATER)
      .build(),
    new AbBuilder(AbilityId.SWARM, 3) //
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.BUG)
      .build(),
    new AbBuilder(AbilityId.ROCK_HEAD, 3) //
      .attr(BlockRecoilDamageAttr)
      .build(),
    new AbBuilder(AbilityId.DROUGHT, 3) //
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SUNNY)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SUNNY)
      .attr(AiMovegenMoveStatsAbAttr, droughtAiMovegenEffect)
      .build(),
    new AbBuilder(AbilityId.ARENA_TRAP, 3) //
      .attr(ArenaTrapAbAttr, (_user, target) => target.isGrounded())
      .build(),
    new AbBuilder(AbilityId.VITAL_SPIRIT, 3) //
      .attr(StatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.SLEEP)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.WHITE_SMOKE, 3) //
      .attr(ProtectStatAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.PURE_POWER, 3) //
      .attr(StatMultiplierAbAttr, Stat.ATK, 2)
      .attr(AiMovegenMoveStatsAbAttr, ({ move, powerMult }) => {
        if (move.category === MoveCategory.PHYSICAL) {
          powerMult.value *= 2;
        }
      })
      .build(),
    new AbBuilder(AbilityId.SHELL_ARMOR, 3) //
      .attr(BlockCritAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.AIR_LOCK, 3) //
      .attr(SuppressWeatherEffectAbAttr, true)
      .attr(PostSummonUnnamedMessageAbAttr, i18next.t("abilityTriggers:weatherEffectDisappeared"))
      .attr(PostSummonWeatherSuppressedFormChangeAbAttr)
      .attr(PostFaintUnsuppressedWeatherFormChangeAbAttr)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.TANGLED_FEET, 4) //
      .conditionalAttr(pokemon => !!pokemon.getTag(BattlerTagType.CONFUSED), StatMultiplierAbAttr, Stat.EVA, 2)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.MOTOR_DRIVE, 4) //
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.ELECTRIC, Stat.SPD, 1)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.RIVALRY, 4) //
      .attr(
        MovePowerBoostAbAttr,
        (user, target, _move) =>
          user.gender !== Gender.GENDERLESS && target?.gender !== Gender.GENDERLESS && user.gender === target?.gender,
        1.25,
      )
      .attr(
        MovePowerBoostAbAttr,
        (user, target, _move) =>
          user.gender !== Gender.GENDERLESS && target?.gender !== Gender.GENDERLESS && user.gender !== target?.gender,
        0.75,
      )
      .build(),
    new AbBuilder(AbilityId.STEADFAST, 4) //
      .attr(FlinchStatStageChangeAbAttr, [Stat.SPD], 1)
      .build(),
    new AbBuilder(AbilityId.SNOW_CLOAK, 4) //
      .attr(StatMultiplierAbAttr, Stat.EVA, 1.2)
      .attr(BlockWeatherDamageAttr, WeatherType.HAIL)
      .condition(getWeatherCondition(WeatherType.HAIL, WeatherType.SNOW))
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.GLUTTONY, 4) //
      .attr(ReduceBerryUseThresholdAbAttr)
      .build(),
    new AbBuilder(AbilityId.ANGER_POINT, 4) //
      .attr(PostReceiveCritStatStageChangeAbAttr, Stat.ATK, 12)
      .build(),
    new AbBuilder(AbilityId.UNBURDEN, 4) //
      .attr(PostItemLostApplyBattlerTagAbAttr, BattlerTagType.UNBURDEN)
      .bypassFaint() // Allows reviver seed to activate Unburden
      .edgeCase() // Should not restore Unburden boost if Pokemon loses then regains Unburden ability
      .build(),
    new AbBuilder(AbilityId.HEATPROOF, 4) //
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.FIRE, 0.5)
      .attr(ReduceBurnDamageAbAttr, 0.5)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SIMPLE, 4) //
      .attr(StatStageChangeMultiplierAbAttr, 2)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.DRY_SKIN, 4) //
      .attr(PostWeatherLapseDamageAbAttr, 2, WeatherType.SUNNY, WeatherType.HARSH_SUN)
      .attr(PostWeatherLapseHealAbAttr, 2, WeatherType.RAIN, WeatherType.HEAVY_RAIN)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.FIRE, 1.25)
      .attr(TypeImmunityHealAbAttr, PokemonType.WATER)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.DOWNLOAD, 4) //
      .attr(DownloadAbAttr)
      .build(),
    new AbBuilder(AbilityId.IRON_FIST, 4) //
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.PUNCHING_MOVE), 1.2)
      .build(),
    new AbBuilder(AbilityId.POISON_HEAL, 4) //
      .attr(PostTurnStatusHealAbAttr, StatusEffect.TOXIC, StatusEffect.POISON)
      .attr(BlockStatusDamageAbAttr, StatusEffect.TOXIC, StatusEffect.POISON)
      .build(),
    new AbBuilder(AbilityId.ADAPTABILITY, 4) //
      .attr(StabBoostAbAttr)
      .build(),
    new AbBuilder(AbilityId.SKILL_LINK, 4) //
      .attr(MaxMultiHitAbAttr)
      .attr(AiMovegenMoveStatsAbAttr, ({ maxMultiHit }) => {
        maxMultiHit.value = true;
      })
      .build(),
    new AbBuilder(AbilityId.HYDRATION, 4) //
      .attr(PostTurnResetStatusAbAttr)
      .condition(getWeatherCondition(WeatherType.RAIN, WeatherType.HEAVY_RAIN))
      .build(),
    new AbBuilder(AbilityId.SOLAR_POWER, 4) //
      .attr(PostWeatherLapseDamageAbAttr, 2, WeatherType.SUNNY, WeatherType.HARSH_SUN)
      .attr(StatMultiplierAbAttr, Stat.SPATK, 1.5)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN))
      .build(),
    new AbBuilder(AbilityId.QUICK_FEET, 4) //
      // TODO: This should ignore the speed drop, not manually undo it
      .conditionalAttr(
        pokemon => (pokemon.status ? pokemon.status.effect === StatusEffect.PARALYSIS : false),
        StatMultiplierAbAttr,
        Stat.SPD,
        2,
      )
      .conditionalAttr(
        pokemon => !!pokemon.status || pokemon.hasAbility(AbilityId.COMATOSE),
        StatMultiplierAbAttr,
        Stat.SPD,
        1.5,
      )
      .build(),
    new AbBuilder(AbilityId.NORMALIZE, 4) //
      .attr(MoveTypeChangeAbAttr, PokemonType.NORMAL, anyTypeMoveConversionCondition)
      .attr(MovePowerBoostAbAttr, anyTypeMoveConversionCondition, 1.2)
      .build(),
    new AbBuilder(AbilityId.SNIPER, 4) //
      .attr(MultCritAbAttr, 1.5)
      .attr(AiMovegenMoveStatsAbAttr, ({ move, powerMult }) => {
        if (move.hasAttr("CritOnlyAttr")) {
          powerMult.value *= 1.5;
        }
      })
      .build(),
    new AbBuilder(AbilityId.MAGIC_GUARD, 4) //
      .attr(BlockNonDirectDamageAbAttr)
      .build(),
    new AbBuilder(AbilityId.NO_GUARD, 4) //
      .attr(AlwaysHitAbAttr)
      .build(),
    new AbBuilder(AbilityId.STALL, 4) //
      .attr(ChangeMovePriorityInBracketAbAttr, (_pokemon, _move) => true, MovePriorityInBracket.LAST)
      .build(),
    new AbBuilder(AbilityId.TECHNICIAN, 4) //
      .attr(
        MovePowerBoostAbAttr,
        (user, target, move) => {
          const power = new NumberHolder(move.power);
          applyMoveAttrs("VariablePowerAttr", user, target, move, power);
          return power.value <= 60;
        },
        1.5,
      )
      .build(),
    new AbBuilder(AbilityId.LEAF_GUARD, 4) //
      .attr(StatusEffectImmunityAbAttr)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN))
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.KLUTZ, 4, 1) //
      .unimplemented()
      .build(),
    new AbBuilder(AbilityId.MOLD_BREAKER, 4) //
      .attr(PostSummonMessageAbAttr, (pokemon) =>
        i18next.t("abilityTriggers:postSummonMoldBreaker", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }),
      )
      .attr(MoveAbilityBypassAbAttr)
      .build(),
    new AbBuilder(AbilityId.SUPER_LUCK, 4) //
      .attr(BonusCritAbAttr)
      .build(),
    new AbBuilder(AbilityId.AFTERMATH, 4) //
      .attr(PostFaintContactDamageAbAttr, 4)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.ANTICIPATION, 4) //
      .conditionalAttr(anticipationCondition, PostSummonMessageAbAttr, (pokemon) =>
        i18next.t("abilityTriggers:postSummonAnticipation", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }),
      )
      .build(),
    new AbBuilder(AbilityId.FOREWARN, 4) //
      .attr(ForewarnAbAttr)
      .build(),
    new AbBuilder(AbilityId.UNAWARE, 4) //
      .attr(IgnoreOpponentStatStagesAbAttr, [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.ACC, Stat.EVA])
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.TINTED_LENS, 4) //
      .attr(MoveDamageBoostAbAttr, 2, (user, target, move) => (target?.getMoveEffectiveness(user, move) ?? 1) <= 0.5)
      .build(),
    new AbBuilder(AbilityId.FILTER, 4) //
      .attr(
        ReceivedMoveDamageMultiplierAbAttr,
        (target, user, move) => target.getMoveEffectiveness(user, move) >= 2,
        0.75,
      )
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SLOW_START, 4) //
      .attr(PostSummonAddBattlerTagAbAttr, BattlerTagType.SLOW_START, 5)
      .build(),
    new AbBuilder(AbilityId.SCRAPPY, 4) //
      .attr(IgnoreTypeImmunityAbAttr, PokemonType.GHOST, [PokemonType.NORMAL, PokemonType.FIGHTING])
      .attr(IntimidateImmunityAbAttr)
      .build(),
    new AbBuilder(AbilityId.STORM_DRAIN, 4) //
      .attr(RedirectTypeMoveAbAttr, PokemonType.WATER)
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.WATER, Stat.SPATK, 1)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.ICE_BODY, 4) //
      .attr(BlockWeatherDamageAttr, WeatherType.HAIL)
      .attr(PostWeatherLapseHealAbAttr, 1, WeatherType.HAIL, WeatherType.SNOW)
      .build(),
    new AbBuilder(AbilityId.SOLID_ROCK, 4) //
      .attr(
        ReceivedMoveDamageMultiplierAbAttr,
        (target, user, move) => target.getMoveEffectiveness(user, move) >= 2,
        0.75,
      )
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SNOW_WARNING, 4) //
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SNOW)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SNOW)
      .attr(AiMovegenMoveStatsAbAttr, ({ move, powerMult, accMult, instantCharge }) => {
        if (move.id === MoveId.WEATHER_BALL) {
          // double power in addition to weather boost
          powerMult.value *= 2;
          return;
        }
        if (move.hasAttr("BlizzardAccuracyAttr")) {
          accMult.value = Number.POSITIVE_INFINITY;
        }
        if (move.hasAttr("AntiSunlightPowerDecreaseAttr")) {
          powerMult.value *= 0.5;
        }
        if (
          move.isChargingMove()
          && move.getChargeAttrs("WeatherInstantChargeAttr").some(attr => attr.weatherTypes.includes(WeatherType.SNOW))
        ) {
          instantCharge.value = true;
        }
      })
      .build(),
    new AbBuilder(AbilityId.HONEY_GATHER, 4) //
      .attr(MoneyAbAttr)
      .unsuppressable()
      .build(),
    new AbBuilder(AbilityId.FRISK, 4) //
      .attr(FriskAbAttr)
      .build(),
    new AbBuilder(AbilityId.RECKLESS, 4) //
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.RECKLESS_MOVE), 1.2)
      .build(),
    new AbBuilder(AbilityId.MULTITYPE, 4) //
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unsuppressable()
      .unreplaceable()
      .build(),
    new AbBuilder(AbilityId.FLOWER_GIFT, 4, -2) //
      .conditionalAttr(
        getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN),
        StatMultiplierAbAttr,
        Stat.ATK,
        1.5,
      )
      .conditionalAttr(
        getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN),
        StatMultiplierAbAttr,
        Stat.SPDEF,
        1.5,
      )
      .conditionalAttr(
        getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN),
        AllyStatMultiplierAbAttr,
        Stat.ATK,
        1.5,
      )
      .conditionalAttr(
        getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN),
        AllyStatMultiplierAbAttr,
        Stat.SPDEF,
        1.5,
      )
      .attr(NoFusionAbilityAbAttr)
      .attr(PostSummonFormChangeByWeatherAbAttr)
      .attr(PostWeatherChangeFormChangeAbAttr, AbilityId.FLOWER_GIFT, [
        WeatherType.NONE,
        WeatherType.SANDSTORM,
        WeatherType.STRONG_WINDS,
        WeatherType.FOG,
        WeatherType.HAIL,
        WeatherType.HEAVY_RAIN,
        WeatherType.SNOW,
        WeatherType.RAIN,
      ])
      .uncopiable()
      .unreplaceable()
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.BAD_DREAMS, 4) //
      .attr(PostTurnHurtIfSleepingAbAttr)
      .build(),
    new AbBuilder(AbilityId.PICKPOCKET, 5) //
      .attr(PostDefendStealHeldItemAbAttr, (target, user, move) =>
        move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user, target }),
      )
      .condition(sheerForceHitDisableAbCondition)
      .build(),
    new AbBuilder(AbilityId.SHEER_FORCE, 5) //
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.chance >= 1, 1.3)
      .attr(MoveEffectChanceMultiplierAbAttr, 0) // This attribute does not seem to function - Should disable life orb, eject button, red card, kee/maranga berry if they get implemented
      .build(),
    new AbBuilder(AbilityId.CONTRARY, 5) //
      .attr(StatStageChangeMultiplierAbAttr, -1)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.UNNERVE, 5, 1) //
      .attr(PreventBerryUseAbAttr)
      .build(),
    new AbBuilder(AbilityId.DEFIANT, 5) //
      .attr(PostStatStageChangeStatStageChangeAbAttr, (_target, _statsChanged, stages) => stages < 0, [Stat.ATK], 2)
      .build(),
    new AbBuilder(AbilityId.DEFEATIST, 5) //
      .attr(StatMultiplierAbAttr, Stat.ATK, 0.5)
      .attr(StatMultiplierAbAttr, Stat.SPATK, 0.5)
      .condition(pokemon => pokemon.getHpRatio() <= 0.5)
      .build(),
    new AbBuilder(AbilityId.CURSED_BODY, 5) //
      .attr(PostDefendMoveDisableAbAttr, 30)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.HEALER, 5) //
      .conditionalAttr(pokemon => pokemon.getAlly() != null && randSeedInt(10) < 3, PostTurnResetStatusAbAttr, true)
      .build(),
    new AbBuilder(AbilityId.FRIEND_GUARD, 5) //
      .attr(AlliedFieldDamageReductionAbAttr, 0.75)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.WEAK_ARMOR, 5) //
      .attr(
        PostDefendStatStageChangeAbAttr,
        (_target, _user, move) => move.category === MoveCategory.PHYSICAL,
        Stat.DEF,
        -1,
      )
      .attr(
        PostDefendStatStageChangeAbAttr,
        (_target, _user, move) => move.category === MoveCategory.PHYSICAL,
        Stat.SPD,
        2,
      )
      .build(),
    new AbBuilder(AbilityId.HEAVY_METAL, 5) //
      .attr(WeightMultiplierAbAttr, 2)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.LIGHT_METAL, 5) //
      .attr(WeightMultiplierAbAttr, 0.5)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.MULTISCALE, 5) //
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, _user, _move) => target.isFullHp(), 0.5)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.TOXIC_BOOST, 5) //
      .attr(
        MovePowerBoostAbAttr,
        (user, _target, move) =>
          move.category === MoveCategory.PHYSICAL
          && (user.status?.effect === StatusEffect.POISON || user.status?.effect === StatusEffect.TOXIC),
        1.5,
      )
      .build(),
    new AbBuilder(AbilityId.FLARE_BOOST, 5) //
      .attr(
        MovePowerBoostAbAttr,
        (user, _target, move) => move.category === MoveCategory.SPECIAL && user.status?.effect === StatusEffect.BURN,
        1.5,
      )
      .build(),
    new AbBuilder(AbilityId.HARVEST, 5) //
      .attr(
        PostTurnRestoreBerryAbAttr,
        // Rate is doubled when under sun, cf https://dex.pokemonshowdown.com/abilities/harvest
        pokemon => (getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN)(pokemon) ? 1 : 0.5),
      )
      .edgeCase() // Cannot recover berries used up by fling or natural gift (unimplemented)
      .build(),
    new AbBuilder(AbilityId.TELEPATHY, 5) //
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) => pokemon.getAlly() === attacker && move.is("AttackMove"))
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.MOODY, 5) //
      .attr(MoodyAbAttr)
      .build(),
    new AbBuilder(AbilityId.OVERCOAT, 5) //
      .attr(BlockWeatherDamageAttr)
      .attr(
        MoveImmunityAbAttr,
        (pokemon, attacker, move) => pokemon !== attacker && move.hasFlag(MoveFlags.POWDER_MOVE),
      )
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.POISON_TOUCH, 5) //
      .attr(PostAttackContactApplyStatusEffectAbAttr, 30, StatusEffect.POISON)
      .build(),
    new AbBuilder(AbilityId.REGENERATOR, 5) //
      .attr(PreSwitchOutHealAbAttr)
      .build(),
    new AbBuilder(AbilityId.BIG_PECKS, 5) //
      .attr(ProtectStatAbAttr, Stat.DEF)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SAND_RUSH, 5) //
      .attr(StatMultiplierAbAttr, Stat.SPD, 2)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM))
      .build(),
    new AbBuilder(AbilityId.WONDER_SKIN, 5) //
      .attr(WonderSkinAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.ANALYTIC, 5) //
      .attr(
        MovePowerBoostAbAttr,
        user =>
          // Boost power if all other Pokemon have already moved (no other moves are slated to execute)
          !globalScene.phaseManager.hasPhaseOfType("MovePhase", phase => phase.pokemon.id !== user.id),
        1.3,
      )
      .attr(AiMovegenMoveStatsAbAttr, ({ move, powerMult }) => {
        if (move.priority < 0) {
          powerMult.value *= 1.3;
        }
      })
      .build(),
    new AbBuilder(AbilityId.ILLUSION, 5) //
      // // The Pokemon generate an illusion if it's available
      // .attr(IllusionPreSummonAbAttr, false)
      // .attr(IllusionBreakAbAttr)
      // // The Pokemon loses its illusion when damaged by a move
      // .attr(PostDefendIllusionBreakAbAttr, true)
      // // Disable Illusion in fusions
      // .attr(NoFusionAbilityAbAttr)
      // // Illusion is available again after a battle
      // .conditionalAttr((pokemon) => pokemon.isAllowedInBattle(), IllusionPostBattleAbAttr, false)
      .uncopiable()
      // .bypassFaint()
      .unimplemented() // TODO: reimplement Illusion properly
      .build(),
    new AbBuilder(AbilityId.IMPOSTER, 5) //
      .attr(PostSummonTransformAbAttr)
      .uncopiable()
      .edgeCase() // Should copy rage fist hit count, etc (see Transform edge case for full list)
      .build(),
    new AbBuilder(AbilityId.INFILTRATOR, 5) //
      .attr(InfiltratorAbAttr)
      .partial() // does not bypass Mist
      .build(),
    new AbBuilder(AbilityId.MUMMY, 5) //
      .attr(PostDefendAbilityGiveAbAttr, AbilityId.MUMMY)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.MOXIE, 5) //
      .attr(PostVictoryStatStageChangeAbAttr, Stat.ATK, 1)
      .build(),
    new AbBuilder(AbilityId.JUSTIFIED, 5) //
      .attr(
        PostDefendStatStageChangeAbAttr,
        (_target, user, move) => user.getMoveType(move) === PokemonType.DARK && move.category !== MoveCategory.STATUS,
        Stat.ATK,
        1,
      )
      .build(),
    new AbBuilder(AbilityId.RATTLED, 5) //
      .attr(
        PostDefendStatStageChangeAbAttr,
        (_target, user, move) => {
          const moveType = user.getMoveType(move);
          return (
            move.category !== MoveCategory.STATUS
            && (moveType === PokemonType.DARK || moveType === PokemonType.BUG || moveType === PokemonType.GHOST)
          );
        },
        Stat.SPD,
        1,
      )
      .attr(PostIntimidateStatStageChangeAbAttr, [Stat.SPD], 1)
      .build(),
    new AbBuilder(AbilityId.MAGIC_BOUNCE, 5) //
      .attr(ReflectStatusMoveAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SAP_SIPPER, 5) //
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.GRASS, Stat.ATK, 1)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.PRANKSTER, 5) //
      .attr(ChangeMovePriorityAbAttr, (_pokemon, move) => move.category === MoveCategory.STATUS, 1)
      .build(),
    new AbBuilder(AbilityId.SAND_FORCE, 5) //
      .attr(MoveTypePowerBoostAbAttr, PokemonType.ROCK, 1.3, true)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.GROUND, 1.3, true)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.STEEL, 1.3, true)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM))
      .build(),
    new AbBuilder(AbilityId.IRON_BARBS, 5) //
      .attr(PostDefendContactDamageAbAttr, 8)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.ZEN_MODE, 5) //
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .attr(PostSummonFormChangeAbAttr, p => (p.getHpRatio() <= 0.5 ? 1 : 0))
      .attr(PostTurnFormChangeAbAttr, p => (p.getHpRatio() <= 0.5 ? 1 : 0))
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.VICTORY_STAR, 5) //
      .attr(StatMultiplierAbAttr, Stat.ACC, 1.1)
      .attr(AllyStatMultiplierAbAttr, Stat.ACC, 1.1, false)
      .attr(AiMovegenMoveStatsAbAttr, ({ accMult }) => {
        accMult.value *= 1.1;
      })
      .build(),
    new AbBuilder(AbilityId.TURBOBLAZE, 5) //
      .attr(PostSummonMessageAbAttr, (pokemon) =>
        i18next.t("abilityTriggers:postSummonTurboblaze", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }),
      )
      .attr(MoveAbilityBypassAbAttr)
      .build(),
    new AbBuilder(AbilityId.TERAVOLT, 5) //
      .attr(PostSummonMessageAbAttr, (pokemon) =>
        i18next.t("abilityTriggers:postSummonTeravolt", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }),
      )
      .attr(MoveAbilityBypassAbAttr)
      .build(),
  );
}

/**
 * Creates an ability condition that causes the ability to fail if that ability
 * has already been used by that pokemon that battle. It requires an ability to
 * be specified due to current limitations in how conditions on abilities work.
 * @param ability The ability to check if it's already been applied
 * @returns The condition
 */
function getOncePerBattleCondition(ability) {
  return (pokemon) => {
    return !pokemon.waveData.abilitiesApplied.has(ability);
  };
}

/**
 * Condition used by {@link https://bulbapedia.bulbagarden.net/wiki/Anticipation_(Ability) | Anticipation}
 * to show a message if any opponent knows a "dangerous" move.
 * @param pokemon - The {@linkcode Pokemon} with this ability
 * @returns Whether the message should be shown
 */
const anticipationCondition = (pokemon) =>
  pokemon.getOpponents().some(opponent =>
    opponent.moveset.some(movesetMove => {
      const move = movesetMove.getMove();
      if (!move.is("AttackMove")) {
        return false;
      }

      if (move.hasAttr("OneHitKOAttr")) {
        return true;
      }

      // Check whether the move's base type (not accounting for variable type changes) is super effective
      // Edge case for hidden power, type is computed
      const typeHolder = new NumberHolder(move.type);
      applyMoveAttrs("HiddenPowerTypeAttr", opponent, pokemon, move, typeHolder);

      const eff = pokemon.getAttackTypeEffectiveness(typeHolder.value, {
        source: opponent,
        ignoreStrongWinds: true,
        move,
      });
      return eff >= 2;
    }),
  );

/**
 * Condition function checking whether a move can have its type changed by an ability.
 * - Variable-type moves (e.g. {@linkcode MoveId.MULTI_ATTACK}) can't have their type changed.
 * - Tera-based moves can't have their type changed if the move's type would be changed due to the user being Terastallized.
 * @returns Whether the move can have its type changed by an ability
 * @remarks
 * Used for {@link https://bulbapedia.bulbagarden.net/wiki/Normalize_(Ability) | Normalize}
 * and as part of the conditions for similar type-changing abilities
 */
const anyTypeMoveConversionCondition = (user, _target, move) => {
  if (noAbilityTypeOverrideMoves.has(move.id)) {
    return false;
  }

  return true;
};

/**
 * Similar to {@linkcode anyTypeMoveConversionCondition}, except that the given move must also be Normal-type.
 * @remarks
 * Used for {@link https://bulbapedia.bulbagarden.net/wiki/Pixilate_(Ability) | Pixilate} et al.
 */
const normalTypeMoveConversionCondition = (user, target, move) =>
  move.type === PokemonType.NORMAL && anyTypeMoveConversionCondition(user, target, move);

/**
 * Condition function to applied to abilities related to Sheer Force.
 * Checks if last move used against target was affected by a Sheer Force user and:
 * Disables: Color Change, Pickpocket, Berserk, Anger Shell, Wimp Out, Emergency Exit
 * @returns An {@linkcode AbAttrCondition} to disable the ability under the proper conditions.
 */
const sheerForceHitDisableAbCondition = (pokemon) => {
  const lastReceivedAttack = pokemon.turnData.attacksReceived[0];
  if (!lastReceivedAttack) {
    return true;
  }

  const lastAttacker = pokemon.getOpponents().find(p => p.id === lastReceivedAttack.sourceId);
  if (!lastAttacker) {
    return true;
  }

  /** `true` if the last move's chance is above 0 and the last attacker's ability is sheer force */
  const sheerForceAffected =
    allMoves[lastReceivedAttack.move].chance >= 0 && lastAttacker.hasAbility(AbilityId.SHEER_FORCE);

  return !sheerForceAffected;
};

/**
 * DRY implementation for the `AIMovegenMoveStatsAbAttr` effect of harsh-sunlight summoning abilities.
 * @param __namedParameters.move - Needed for proper typedoc rendering
 */
function drizzleAiMovegenEffect({ move, powerMult, accMult }) {
  if (move.id === MoveId.WEATHER_BALL) {
    // double power plus weather boost
    powerMult.value *= 3;
    return;
  }
  switch (move.type) {
    case PokemonType.FIRE:
      powerMult.value *= 0.5;
      break;
    case PokemonType.WATER:
      powerMult.value *= 1.5;
      break;
  }
  if (move.hasAttr("ThunderAccuracyAttr") || move.hasAttr("StormAccuracyAttr")) {
    accMult.value = Number.POSITIVE_INFINITY;
  }
  if (move.hasAttr("AntiSunlightPowerDecreaseAttr")) {
    powerMult.value *= 0.5;
  }
}

/**
 * DRY implementation for the `AIMovegenMoveStatsAbAttr` effect of harsh-sunlight summoning abilities
 * @param __namedParameters.move - Needed for proper typedoc rendering
 */
function droughtAiMovegenEffect({ move, powerMult, accMult, instantCharge }) {
  if (move.id === MoveId.WEATHER_BALL) {
    // double power in addition to weather boost
    powerMult.value *= 3;
    return;
  }

  if (move.id === MoveId.HYDRO_STEAM || move.type === PokemonType.FIRE) {
    powerMult.value *= 1.5;
  } else if (move.type === PokemonType.WATER) {
    powerMult.value *= 0.5;
  }

  if (move.hasAttr("ThunderAccuracyAttr")) {
    accMult.value *= 0.5;
  }

  if (
    move.isChargingMove()
    && move.getChargeAttrs("WeatherInstantChargeAttr").some(attr => attr.weatherTypes.includes(WeatherType.SUNNY))
  ) {
    instantCharge.value = true;
  }
}