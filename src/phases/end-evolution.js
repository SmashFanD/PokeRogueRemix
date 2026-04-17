import { globalScene } from "../global-scene.js";
import { Phase } from "../phase.js";

export class EndEvolutionPhase extends Phase {
  phaseName = "EndEvolutionPhase";
  start() {
    super.start();

    globalScene.ui.setModeForceTransition(UiMode.MESSAGE).then(() => this.end());
  }
}