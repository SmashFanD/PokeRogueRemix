import { globalScene } from "../global-scene.js";
import { Phase } from "../phase.js";

/**
 * Phase to trigger all pending post-turn {@linkcode PositionalTag}s.
 * Occurs before {@linkcode TurnEndPhase} to allow for proper electrify timing.
 */
export class PositionalTagPhase extends Phase {
  phaseName = "PositionalTagPhase";

  start() {
    globalScene.arena.positionalTagManager.activateAllTags();
    super.end();
    return;
  }
}