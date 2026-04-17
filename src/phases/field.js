import { BattlePhase } from "./battle.js";

export class FieldPhase extends BattlePhase {
  executeForAll(func) {
    for (const pokemon of inSpeedOrder(ArenaTagSide.BOTH)) {
      func(pokemon);
    }
  }
}