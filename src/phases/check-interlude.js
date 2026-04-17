import { globalScene } from "../global-scene.js";
import { Phase } from "../phase.js";

export class CheckInterludePhase extends Phase {
  phaseName = "CheckInterludePhase";

  start() {
    super.start();
    const { phaseManager } = globalScene;
    const { waveIndex } = globalScene.currentBattle;

    if (waveIndex % 5 === 0 && globalScene.getEnemyParty().every(p => p.isFainted())) {
      phaseManager.onInterlude();
    }

    this.end();
  }
}