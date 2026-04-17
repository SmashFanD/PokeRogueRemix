import { globalScene } from "../global-scene.js";
import { Phase } from "../phase.js";

export class UnavailablePhase extends Phase {
  phaseName = "UnavailablePhase";
  start() {
    globalScene.ui.setMode(UiMode.UNAVAILABLE, () => {
      globalScene.phaseManager.unshiftNew("LoginPhase", true);
      this.end();
    });
  }
}