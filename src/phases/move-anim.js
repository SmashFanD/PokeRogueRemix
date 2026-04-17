import { Phase } from "../phase.js";

/**
 * Plays the given {@linkcode MoveAnim} sequentially.
 */
export class MoveAnimPhase extends Phase {
  phaseName = "MoveAnimPhase";

  constructor(
    anim,
    onSubstitute = false,
  ) {
    super();
  }

  start() {
    super.start();

    this.anim.play(this.onSubstitute, () => this.end());
  }
}