import { globalScene } from "../global-scene.js";
import { BattlePhase } from "./battle.js";

export class ShowTrainerPhase extends BattlePhase {
  phaseName = "ShowTrainerPhase";
  start() {
    super.start();

    globalScene.trainer
      .setVisible(true)
      .setTexture(`trainer_${globalScene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`);

    globalScene.tweens.add({
      targets: globalScene.trainer,
      x: 106,
      duration: 1000,
      onComplete: () => this.end(),
    });
  }
}