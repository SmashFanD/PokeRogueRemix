import { globalScene } from "../global-scene.js";
import { BattlePhase } from "./battle.js";

export class NewBattlePhase extends BattlePhase {
  phaseName = "NewBattlePhase";
  start() {
    super.start();

    globalScene.phaseManager.removeAllPhasesOfType("NewBattlePhase");

    globalScene.newBattle();

    this.end();
  }
}