import { globalScene } from "../global-scene.js";
import { BattlePhase } from "./battle.js";

export class HidePartyExpBarPhase extends BattlePhase {
  phaseName = "HidePartyExpBarPhase";
  start() {
    super.start();

    globalScene.partyExpBar.hide().then(() => this.end());
  }
}