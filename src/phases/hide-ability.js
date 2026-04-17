import { Phase } from "../phase.js";
import { globalScene } from "../global-scene.js";

export class HideAbilityPhase extends Phase {
  phaseName = "HideAbilityPhase";
  start() {
    super.start();

    globalScene.abilityBar.hide().then(() => {
      this.end();
    });
  }
}