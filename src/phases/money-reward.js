import { globalScene } from "../global-scene.js";
import { BattlePhase } from "./battle.js";

export class MoneyRewardPhase extends BattlePhase {
  phaseName = "MoneyRewardPhase";
  moneyMultiplier

  constructor(moneyMultiplier) {
    super();

    this.moneyMultiplier = moneyMultiplier;
  }

  start() {
    const moneyAmount = new NumberHolder(globalScene.getWaveMoneyAmount(this.moneyMultiplier));

    globalScene.applyModifiers(MoneyMultiplierModifier, true, moneyAmount);

    if (globalScene.arena.getTag(ArenaTagType.HAPPY_HOUR)) {
      moneyAmount.value *= 2;
    }

    globalScene.addMoney(moneyAmount.value);

    const formattedMoneyAmount = moneyAmount.value.toLocaleString("en-US");
    const message = i18next.t("battle:moneyWon", {
      moneyAmount: formattedMoneyAmount,
    });

    globalScene.ui.showText(message, null, () => this.end(), null, true);
  }
}