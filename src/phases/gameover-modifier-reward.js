import { globalScene } from "../global-scene.js";
import { ModifierRewardPhase } from "./modifier-reward.js";

export class GameOverModifierRewardPhase extends ModifierRewardPhase {
  phaseName = "GameOverModifierRewardPhase";
  doReward() {
    return new Promise(resolve => {
      const newModifier = this.modifierType.newModifier();
      globalScene.addModifier(newModifier);
      // Sound loaded into game as is
      globalScene.playSound("level_up_fanfare");
      globalScene.ui.setMode(UiMode.MESSAGE);
      globalScene.ui.fadeIn(250).then(() => {
        globalScene.ui.showText(
          i18next.t("battle:rewardGain", {
            modifierName: newModifier?.type.name,
          }),
          null,
          () => {
            globalScene.time.delayedCall(1500, () => globalScene.arenaBg.setVisible(true));
            resolve();
          },
          null,
          true,
          1500,
        );
      });
    });
  }
}