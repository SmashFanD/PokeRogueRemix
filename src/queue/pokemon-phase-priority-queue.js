import { PriorityQueue } from "./priority-queue.js";

/** A generic speed-based priority queue of {@linkcode DynamicPhase}s. */
export class PokemonPhasePriorityQueue extends PriorityQueue {
  reorder() {
    this.queue = sortInSpeedOrder(this.queue);
  }
}