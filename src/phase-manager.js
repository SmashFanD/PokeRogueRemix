import { DynamicQueueManager } from "./dynamic-queue-manager.js";
import { PhaseTree } from "./phase-tree.js";
import { AddEnemyBuffModifierPhase } from "./phases/add-enemy-buff-modifier.js";
import { AttemptRunPhase } from "./phases/attempt-run.js";
import { BattleEndPhase } from "./phases/battle-end.js";
import { BerryPhase } from "./phases/berry.js";
import { CheckInterludePhase } from "./phases/check-interlude.js";
import { CheckStatusEffectPhase } from "./phases/check-status.js";
import { CheckSwitchPhase } from "./phases/check-switch.js";
import { CommandPhase } from "./phases/command.js";
import { CommonAnimPhase } from "./phases/common-anim.js";
import { DamageAnimPhase } from "./phases/dmg-anim.js";
import { DynamicPhaseMarker } from "./phases/dynamic-phase-marker.js";
import { EggHatchPhase } from "./phases/egg-hatch.js";
import { EggLapsePhase } from "./phases/egg-lapse.js";
import { EggSummaryPhase } from "./phases/egg-summary.js";
import { EncounterPhase } from "./phases/encounter.js";
import { EndEvolutionPhase } from "./phases/end-evolution.js";
import { EnemyCommandPhase } from "./phases/enemy-command.js";
import { EvolutionPhase } from "./phases/evolution.js";
import { ExpPhase } from "./phases/exp.js";
import { FaintPhase } from "./phases/faint.js";
import { FormChangePhase } from "./phases/form-change.js";
import { FriendPhase } from "./phases/friend.js";
import { GameOverModifierRewardPhase } from "./phases/gameover-modifier-reward.js";
import { GameOverPhase } from "./phases/gameover.js";
import { HideAbilityPhase } from "./phases/hide-ability.js";
import { HidePartyExpBarPhase } from "./phases/hide-party-expbar.js";
import { InitEncounterPhase } from "./phases/init-encounter.js";
import { LearnMovePhase } from "./phases/learn-move.js";
import { LevelUpPhase } from "./phases/levelup.js";
import { LoadMoveAnimPhase } from "./phases/load-move-anim.js";
import { MessagePhase } from "./phases/message.js";
import { ModifierRewardPhase } from "./phases/modifier-reward.js";
import { MoneyRewardPhase } from "./phases/money-reward.js";
import { MoveAnimPhase } from "./phases/move-anim.js";
import { MoveChargePhase } from "./phases/move-charge.js";
import { MoveEffectPhase } from "./phases/move-effect.js";
import { MoveEndPhase } from "./phases/move-end.js";
import { MoveHeaderPhase } from "./phases/move-header.js";
import { MoveReflectPhase } from "./phases/move-reflect.js";
import { MovePhase } from "./phases/move.js";
import { NewBattlePhase } from "./phases/new-battle.js";
import { NewBiomeEncounterPhase } from "./phases/new-biome-encounter.js";
import { NextEncounterPhase } from "./phases/next-encounter.js";
import { ObtainStatusEffectPhase } from "./phases/obtain-status-effect.js";
import { PartyExpPhase } from "./phases/party-exp.js";
import { PartyHealPhase } from "./phases/party-heal.js";
import { PokemonAnimPhase } from "./phases/pokemon-anim.js";
import { PokemonHealPhase } from "./phases/pokemon-heal.js";
import { PokemonTransformPhase } from "./phases/pokemon-transform.js";
import { PositionalTagPhase } from "./phases/positional-tag.js";
import { PostGameOverPhase } from "./phases/post-gameover.js";
import { PostSummonPhase } from "./phases/post-summon.js";
import { PostTurnStatusEffectPhase } from "./phases/post-turn-status-effect.js";
import { QuietFormChangePhase } from "./phases/quiet-form-change.js";
import { ReloadSessionPhase } from "./phases/reload-session.js";
import { ResetStatusPhase } from "./phases/reset-status.js";
import { ReturnPhase } from "./phases/return.js";
import { SelectBiomePhase } from "./phases/select-biome.js";
import { SelectModifierPhase } from "./phases/select-modifier.js";
import { SelectStarterPhase } from "./phases/select-starter.js";
import { SelectTargetPhase } from "./phases/select-target.js";
import { ShinySparklePhase } from "./phases/shiny-sparkle.js";
import { ShowAbilityPhase } from "./phases/show-ability.js";
import { ShowPartyExpBarPhase } from "./phases/show-party-expbar.js";
import { ShowTrainerPhase } from "./phases/show-trainer.js";
import { StatStageChangePhase } from "./phases/stat-stage-change.js";
import { SummonMissingPhase } from "./phases/summon-missing.js";
import { SummonPhase } from "./phases/summon.js";
import { SwitchBiomePhase } from "./phases/switch-biome.js";
import { SwitchSummonPhase } from "./phases/switch-summon.js";
import { SwitchPhase } from "./phases/switch.js";
import { TitlePhase } from "./phases/title.js";
import { TrainerVictoryPhase } from "./phases/trainer-victory.js";
import { TurnEndPhase } from "./phases/turn-end.js";
import { TurnInitPhase } from "./phases/turn-init.js";
import { TurnStartPhase } from "./phases/turn-start.js";
import { UnavailablePhase } from "./phases/unavailable.js";
import { VictoryPhase } from "./phases/victory.js";
import { WeatherEffectPhase } from "./phases/weather-effect.js";

//need to import all phases
const PHASES = Object.freeze({
  AddEnemyBuffModifierPhase,
  FriendPhase,
  AttemptRunPhase,
  BattleEndPhase,
  BerryPhase,
  CheckInterludePhase,
  CheckStatusEffectPhase,
  CheckSwitchPhase,
  CommandPhase,
  CommonAnimPhase,
  DamageAnimPhase,
  DynamicPhaseMarker,
  EggHatchPhase,
  EggLapsePhase,
  EggSummaryPhase,
  EncounterPhase,
  EndEvolutionPhase,
  EnemyCommandPhase,
  EvolutionPhase,
  ExpPhase,
  FaintPhase,
  FormChangePhase,
  GameOverPhase,
  GameOverModifierRewardPhase,
  HideAbilityPhase,
  HidePartyExpBarPhase,
  InitEncounterPhase,
  LearnMovePhase,
  LevelUpPhase,
  LoadMoveAnimPhase,
  MessagePhase,
  ModifierRewardPhase,
  MoneyRewardPhase,
  MoveAnimPhase,
  MoveChargePhase,
  MoveEffectPhase,
  MoveEndPhase,
  MoveHeaderPhase,
  MoveReflectPhase,
  MovePhase,
  NewBattlePhase,
  NewBiomeEncounterPhase,
  NextEncounterPhase,
  ObtainStatusEffectPhase,
  PartyExpPhase,
  PartyHealPhase,
  PokemonAnimPhase,
  PokemonHealPhase,
  PokemonTransformPhase,
  PositionalTagPhase,
  PostGameOverPhase,
  PostSummonPhase,
  PostTurnStatusEffectPhase,
  QuietFormChangePhase,
  ReloadSessionPhase,
  ResetStatusPhase,
  ReturnPhase,
  SelectBiomePhase,
  SelectModifierPhase,
  SelectStarterPhase,
  SelectTargetPhase,
  ShinySparklePhase,
  ShowAbilityPhase,
  ShowPartyExpBarPhase,
  ShowTrainerPhase,
  StatStageChangePhase,
  SummonMissingPhase,
  SummonPhase,
  SwitchBiomePhase,
  SwitchPhase,
  SwitchSummonPhase,
  TitlePhase,
  TrainerVictoryPhase,
  TurnEndPhase,
  TurnInitPhase,
  TurnStartPhase,
  UnavailablePhase,
  VictoryPhase,
  WeatherEffectPhase,
});

const turnEndPhases = [
  "WeatherEffectPhase",
  "PositionalTagPhase",
  "BerryPhase",
  "CheckStatusEffectPhase",
  "TurnEndPhase",
];

export class PhaseManager {
  phaseQueue = new PhaseTree();
  dynamicQueueManager = new DynamicQueueManager();
  currentPhase;
  standbyPhase = null;
  toTitleScreen() {
    this.clearAllPhases();
    this.unshiftNew("TitlePhase");
  }
  getCurrentPhase() {
    return this.currentPhase;
  }
  getStandbyPhase() {
    return this.standbyPhase;
  }
  pushPhase(...phases) {
    for (const phase of phases) {
      this.phaseQueue.pushPhase(this.checkDynamic(phase));
    }
  }
  unshiftPhase(...phases) {
    for (const phase of phases) {
      const toAdd = this.checkDynamic(phase);
      if (phase.is("MovePhase")) {
        this.phaseQueue.addAfter(toAdd, "MoveEndPhase");
      } else {
        this.phaseQueue.addPhase(toAdd);
      }
    }
  }
  checkDynamic(phase) {
    if (this.dynamicQueueManager.queueDynamicPhase(phase)) {
      return new DynamicPhaseMarker(phase.phaseName);
    }
    return phase;
  }
  clearPhaseQueue(leaveUnshifted = false) {
    this.phaseQueue.clear(leaveUnshifted);
  }
  clearAllPhases() {
    this.clearPhaseQueue();
    this.dynamicQueueManager.clearQueues();
    this.standbyPhase = null;
  }
  shiftPhase() {
    if (this.standbyPhase) {
      this.currentPhase = this.standbyPhase;
      this.standbyPhase = null;
      return;
    }

    let nextPhase = this.phaseQueue.getNextPhase();
    if (nextPhase?.is("DynamicPhaseMarker")) {
      nextPhase = this.dynamicQueueManager.popNextPhase(nextPhase.phaseType);
    }

    if (nextPhase == null) {
      this.turnStart();
    } else {
      this.currentPhase = nextPhase;
    }

    this.startCurrentPhase();
  }
  startCurrentPhase() {
    console.log(`CURRENT PHASE: ${this.currentPhase.phaseName}`);
    this.currentPhase.start();
  }
  overridePhase(phase) {
    if (this.standbyPhase) {
      return false;
    }

    this.standbyPhase = this.currentPhase;
    this.currentPhase = phase;
    this.startCurrentPhase();

    return true;
  }
  hasPhaseOfType(name, condition) {
    return this.dynamicQueueManager.exists(name, condition) || this.phaseQueue.exists(name, condition);
  }
  tryRemovePhase(name, phaseFilter) {
    return this.dynamicQueueManager.removePhase(name, phaseFilter) || this.phaseQueue.remove(name, phaseFilter);
  }
  removeAllPhasesOfType(name) {
    this.phaseQueue.removeAll(name);
  }
  queueMessage(
    message,
    callbackDelay,
    prompt,
    promptDelay,
    defer,
  ) {
    const phase = new MessagePhase(message, callbackDelay, prompt, promptDelay);
    if (defer) {
      this.pushPhase(phase);
    } else {
      this.unshiftPhase(phase);
    }
  }
  queueAbilityDisplay(pokemon, passive, show) {
    this.unshiftPhase(show ? new ShowAbilityPhase(pokemon.getBattlerIndex(), passive) : new HideAbilityPhase());
  }
  hideAbilityBar() {
    if (globalScene.abilityBar.isVisible()) {
      this.unshiftPhase(new HideAbilityPhase());
    }
  }
  turnStart() {
    this.dynamicQueueManager.clearQueues();
    this.currentPhase = new TurnInitPhase();
  }
  create(phase, ...args) {
    const PhaseClass = PHASES[phase];

    if (!PhaseClass) {
      throw new Error(`Phase ${phase} does not exist in PhaseMap.`);
    }

    return new PhaseClass(...args);
  }
  pushNew(phase, ...args) {
    this.pushPhase(this.create(phase, ...args));
  }
  unshiftNew(phase, ...args) {
    this.unshiftPhase(this.create(phase, ...args));
  }
  queueFaintPhase(...args) {
    this.phaseQueue.addPhase(this.create("FaintPhase", ...args), true);
  }
  queueDeferred(
    phase,
    ...args
  ) {
    this.phaseQueue.addPhase(this.create(phase, ...args), true);
  }
  getMovePhase(phaseCondition) {
    return this.dynamicQueueManager.getMovePhase(phaseCondition);
  }
  cancelMove(phaseCondition) {
    this.dynamicQueueManager.cancelMovePhase(phaseCondition);
  }
  forceMoveNext(phaseCondition) {
    this.dynamicQueueManager.setMoveTimingModifier(phaseCondition, MovePhaseTimingModifier.FIRST);
  }
  forceMoveLast(phaseCondition) {
    this.dynamicQueueManager.setMoveTimingModifier(phaseCondition, MovePhaseTimingModifier.LAST);
  }
  redirectMoves(removedPokemon, allyPokemon) {
    this.dynamicQueueManager.redirectMoves(removedPokemon, allyPokemon);
  }
  queueTurnEndPhases() {
    turnEndPhases.forEach(p => {
      this.pushNew(p);
    });
  }
  onInterlude() {
    const phasesToRemove = [
      "WeatherEffectPhase",
      "BerryPhase",
      "CheckStatusEffectPhase",
    ];
    for (const phaseName of phasesToRemove) {
      this.phaseQueue.removeAll(phaseName);
    }

    const turnEndPhase = this.phaseQueue.find("TurnEndPhase");
    if (turnEndPhase) {
      turnEndPhase.upcomingInterlude = true;
    }
  }
}