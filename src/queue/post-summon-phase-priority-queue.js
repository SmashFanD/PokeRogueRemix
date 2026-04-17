import { globalScene } from "../global-scene.js";
import { PokemonPhasePriorityQueue } from "./pokemon-phase-priority-queue.js";

/**
 * Priority Queue for {@linkcode PostSummonPhase} and {@linkcode PostSummonActivateAbilityPhase}
 *
 * Orders phases first by ability priority, then by the {@linkcode Pokemon}'s effective speed
 */
export class PostSummonPhasePriorityQueue extends PokemonPhasePriorityQueue {
  reorder() {
    this.queue = sortInSpeedOrder(this.queue);
    this.queue.sort((phaseA, phaseB) => phaseB.getPriority() - phaseA.getPriority());
  }

  push(phase) {
    super.push(phase);
    this.queueAbilityPhase(phase);
  }

  /**
   * Queues all necessary {@linkcode PostSummonActivateAbilityPhase}s for each pushed {@linkcode PostSummonPhase}
   * @param phase - The {@linkcode PostSummonPhase} that was pushed onto the queue
   */
  queueAbilityPhase(phase) {
    if (phase instanceof PostSummonActivateAbilityPhase) {
      return;
    }

    const phasePokemon = phase.getPokemon();

    phasePokemon.getAbilityPriorities().forEach((priority, idx) => {
      const activateAbilityPhase = new PostSummonActivateAbilityPhase(
        phasePokemon.getBattlerIndex(),
        priority,
        idx !== 0,
      );
      globalScene.phaseManager.unshiftPhase(activateAbilityPhase);
    });
  }
}