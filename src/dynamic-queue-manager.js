
// TODO: might be easier to define which phases should be dynamic instead

import { MovePhasePriorityQueue } from "./queue/move-phase-priority-queue.js";
import { PostSummonPhasePriorityQueue } from "./queue/post-summon-phase-priority-queue.js";

/** All phases which have defined a `getPokemon` method but should not be sorted dynamically */
const nonDynamicPokemonPhases = [
  "SummonPhase",
  "CommandPhase",
  "LearnMovePhase",
  "MoveEffectPhase",
  "MoveEndPhase",
  "FaintPhase",
  "DamageAnimPhase",
  "VictoryPhase",
  "PokemonHealPhase",
  "WeatherEffectPhase",
  "ShowAbilityPhase",
  "HideAbilityPhase",
  "ExpPhase",
  "ShowPartyExpBarPhase",
  "HidePartyExpBarPhase",
]

/**
 * The dynamic queue manager holds priority queues for phases which are queued as dynamic.
 *
 * Dynamic phases are generally those which hold a pokemon and are unshifted, not pushed. \
 * Queues work by sorting their entries in speed order (and possibly with more complex ordering) before each time a phase is popped.
 *
 * As the holder, this structure is also used to access and modify queued phases.
 * This is mostly used in redirection, cancellation, etc. of {@linkcode MovePhase}s.
 */
export class DynamicQueueManager {
  /** A Map matching `Phase` names to their corresponding priority queuess */
  constructor() {
    this.dynamicPhaseMap = new Map();
    // PostSummon and Move phases have specialized queues
    this.dynamicPhaseMap.set("PostSummonPhase", new PostSummonPhasePriorityQueue());
    this.dynamicPhaseMap.set("MovePhase", new MovePhasePriorityQueue());
  }

  /** Remove all phases from the manager. */
  clearQueues(){
    for (const queue of this.dynamicPhaseMap.values()) {
      queue.clear();
    }
  }

  /**
   * Adds a new phase to the manager and creates the priority queue for it if one does not exist.
   * @param phase - The {@linkcode Phase} to add
   * @returns `true` if the phase was added, or `false` if it is not dynamic
   */
  queueDynamicPhase(phase){
    if (!this.isDynamicPhase(phase)) {
      return false;
    }

    if (!this.dynamicPhaseMap.has(phase.phaseName)) {
      this.dynamicPhaseMap.set(phase.phaseName, new PokemonPhasePriorityQueue());
    }
    this.dynamicPhaseMap.get(phase.phaseName)?.push(phase);
    return true;
  }

  /**
   * Remove a {@linkcode Phase} from its corresponding queue and return it.
   * @param name - The {@linkcode PhaseString | name} of the Phase to retrieve
   * @returns The highest-priority `Phase` of the given type, or `undefined` if none of the specified type exist
   */
  popNextPhase(name){
    return this.dynamicPhaseMap.get(name)?.pop();
  }

  /**
   * Determines if there is a queued dynamic {@linkcode Phase} meeting the conditions
   * @param name - The {@linkcode PhaseString | name} of the Phase to search for
   * @param condition - An optional {@linkcode PhaseConditionFunc} to add conditions to the search
   * @returns Whether a matching phase exists
   */
  exists(name, condition = () => true){
    return !!this.dynamicPhaseMap.get(name)?.has(condition);
  }

  /**
   * Finds and removes a single queued {@linkcode Phase}
   * @param name - The {@linkcode PhaseString | name} of the Phase to search for
   * @param phaseFilter - An optional {@linkcode PhaseConditionFunc} to specify conditions for the phase
   * @returns Whether a removal occurred
   */
  removePhase(name, condition = () => true){
    return !!this.dynamicPhaseMap.get(name)?.remove(condition);
  }

  /**
   * Sets the timing modifier of a move (i.e. to force it first or last)
   * @param condition - A {@linkcode PhaseConditionFunc} to specify conditions for the move
   * @param modifier - The {@linkcode MovePhaseTimingModifier} to switch the move to
   */
  setMoveTimingModifier(condition, modifier){
    this.getMovePhaseQueue().setTimingModifier(condition, modifier);
  }

  /**
   * Redirects moves which were targeted at a {@linkcode Pokemon} that has been removed
   * @param removedPokemon - The removed {@linkcode Pokemon}
   * @param allyPokemon - The ally of the removed pokemon
   */
  redirectMoves(removedPokemon, allyPokemon){
    this.getMovePhaseQueue().redirectMoves(removedPokemon, allyPokemon);
  }

  /**
   * Find and return the first {@linkcode MovePhase} meeting the given condition.
   * @param phaseCondition - The {@linkcode PhaseConditionFunc | condition} function used to retrieve the phase
   * @returns The retrieved `MovePhase`, or `undefined` if none meet the criteria.
   */
  getMovePhase(condition){
    return this.getMovePhaseQueue().find(condition);
  }

  /**
   * Find and cancel the first {@linkcode MovePhase} meeting the given condition.
   * @param phaseCondition - The {@linkcode PhaseConditionFunc | condition} function used to retrieve the phase
   */
  cancelMovePhase(condition){
    this.getMovePhaseQueue().cancelMove(condition);
  }

  /**
   * @returns An in-order array of {@linkcode Pokemon}, representing the turn order as played out in the most recent turn
   */
  getLastTurnOrder(){
    return this.getMovePhaseQueue().getTurnOrder();
  }

  /** Clears the stored `Move` turn order */
  clearLastTurnOrder(){
    this.getMovePhaseQueue().clearTurnOrder();
  }

  /** Internal helper to get the {@linkcode MovePhasePriorityQueue} */
  getMovePhaseQueue() {
    return this.dynamicPhaseMap.get("MovePhase");
  }

  /**
   * Internal helper to determine if a phase is dynamic.
   * @param phase - The {@linkcode Phase} to check
   * @returns Whether `phase` is dynamic.
   * @privateRemarks
   * Currently, this checks that `phase` has a `getPokemon` method
   * and is not blacklisted in `nonDynamicPokemonPhases`.
   */
  isDynamicPhase(phase) {
    return typeof (phase).getPokemon === "function" && !nonDynamicPokemonPhases.includes(phase.phaseName);
  }
}