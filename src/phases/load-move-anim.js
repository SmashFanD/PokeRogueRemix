import { Phase } from "../phase.js";

/**
 * Phase for synchronous move animation loading.
 * Should be used when a move invokes another move that
 * isn't already loaded (e.g. for Metronome)
 */
export class LoadMoveAnimPhase extends Phase {
  phaseName = "LoadMoveAnimPhase";
  constructor(moveId) {
    super();
  }

  start() {
    initMoveAnim(this.moveId)
      .then(() => loadMoveAnimAssets([this.moveId], true))
      .then(() => this.end());
  }
}