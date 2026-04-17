import { globalScene } from "../global-scene.js";
import { Phase } from "../phase.js";

export class CheckStatusEffectPhase extends Phase {
  phaseName = "CheckStatusEffectPhase";

  start() {
    for (const p of inSpeedOrder(ArenaTagSide.BOTH)) {
      if (p.status?.isPostTurn()) {
        globalScene.phaseManager.unshiftNew("PostTurnStatusEffectPhase", p.getBattlerIndex());
      }
    }
    this.end();
  }
}