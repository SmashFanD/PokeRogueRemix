import { PokemonPhasePriorityQueue } from "./pokemon-phase-priority-queue.js";
import { globalScene } from "../global-scene.js";
/** A priority queue responsible for the ordering of {@linkcode MovePhase}s
 * however this should apply to command phase here
 */
export class MovePhasePriorityQueue extends PokemonPhasePriorityQueue {
  lastTurnOrder = [];

  reorder() {
    super.reorder();
    this.sortPostSpeed();
  }

  /**
   * Sort queued {@linkcode MovePhase}s after speed order has been applied. \
   * Checks for timing modifiers (Quash/etc), innate move priority and
   * priority modifiers (Quick Claw/etc) in that order.
   */
  sortPostSpeed() {
    this.queue.sort((a, b) => {
      if (b.timingModifier !== a.timingModifier) {
        return b.timingModifier - a.timingModifier;
      }

      const aPriority = getPriorityForMP(a);
      const bPriority = getPriorityForMP(b);
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return getPriorityModifiersForMP(b) - getPriorityModifiersForMP(a);
    });
  }

  cancelMove(condition) {
    this.queue.find(condition)?.cancel();
  }

  setTimingModifier(condition, modifier) {
    const phase = this.queue.find(condition);
    if (phase != null) {
      phase.timingModifier = modifier;
    }
  }

  pop() {
    this.reorder();
    const phase = this.queue.shift();
    if (phase) {
      this.lastTurnOrder.push(phase.pokemon);
    }
    return phase;
  }

  getTurnOrder() {
    return this.lastTurnOrder;
  }

  clearTurnOrder() {
    this.lastTurnOrder = [];
  }

  clear() {
    this.lastTurnOrder = [];
    super.clear();
  }
}

/**
 * Helper function to retrieve the priority modifier for a given move phase.
 * @param mp - The `MovePhase` to check
 * @returns The phase's priority modifier
 */
function getPriorityModifiersForMP(mp) {
  const move = mp.move.getMove();
  return move.getPriorityModifier(mp.pokemon, true);
}

/**
 * Helper function to retrieve the priority for a given move phase.
 * @param mp - The `MovePhase` to check
 * @returns The phase's priority
 */
function getPriorityForMP(mp) {
  const move = mp.move.getMove();
  return move.getPriority(mp.pokemon, true);
}