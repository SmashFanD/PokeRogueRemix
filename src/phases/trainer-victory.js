import { globalScene } from "../global-scene.js";
import { BattlePhase } from "./battle.js";

export class TrainerVictoryPhase extends BattlePhase {
  phaseName = "TrainerVictoryPhase";
  start() {
    globalScene.disableMenu = true;

    globalScene.playBgm(globalScene.currentBattle.trainer?.config.victoryBgm);

    globalScene.phaseManager.unshiftNew("MoneyRewardPhase", globalScene.currentBattle.trainer?.config.moneyMultiplier); // TODO: is this bang correct?

    const modifierRewardFuncs = globalScene.currentBattle.trainer?.config.modifierRewardFuncs; // TODO: is this bang correct?
    for (const modifierRewardFunc of modifierRewardFuncs) {
      globalScene.phaseManager.unshiftNew("ModifierRewardPhase", modifierRewardFunc);
    }

    const trainerType = globalScene.currentBattle.trainer?.config.trainerType; // TODO: is this bang correct?

    globalScene.ui.showText(
      i18next.t("battle:trainerDefeated", {
        trainerName: globalScene.currentBattle.trainer?.getName(TrainerSlot.NONE, true),
      }),
      null,
      () => {
        const victoryMessages = globalScene.currentBattle.trainer?.getVictoryMessages(); // TODO: is this bang correct?
        let message = randSeedItem(victoryMessages)

        const showMessage = () => {
          const originalFunc = showMessageOrEnd;
          showMessageOrEnd = () =>
            globalScene.ui.showDialogue(
              message,
              globalScene.currentBattle.trainer?.getName(TrainerSlot.TRAINER, true),
              null,
              originalFunc,
            );

          showMessageOrEnd();
        };
        let showMessageOrEnd = () => this.end();
        if (victoryMessages?.length > 0) {
          if (globalScene.currentBattle.trainer?.config.hasCharSprite && !globalScene.ui.shouldSkipDialogue(message)) {
            const originalFunc = showMessageOrEnd;
            showMessageOrEnd = () =>
              globalScene.charSprite.hide().then(() => globalScene.hideFieldOverlay(250).then(() => originalFunc()));
            globalScene
              .showFieldOverlay(500)
              .then(() =>
                globalScene.charSprite
                  .showCharacter(
                    globalScene.currentBattle.trainer?.getKey(),
                    getCharVariantFromDialogue(victoryMessages[0]),
                  )
                  .then(() => showMessage()),
              ); // TODO: is this bang correct?
          } else {
            showMessage();
          }
        } else {
          showMessageOrEnd();
        }
      },
      null,
      true,
    );

    this.showEnemyTrainer();
  }
}