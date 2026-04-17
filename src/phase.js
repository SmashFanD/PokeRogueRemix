import { globalScene } from "./global-scene.js";

export class Phase {
  start() {}

  end() {
    globalScene.phaseManager.shiftPhase();
  }

  is(phaseName) {
    return this.phaseName === phaseName;
  }
}