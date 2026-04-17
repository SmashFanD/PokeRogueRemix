import { globalScene } from "../global-scene.js";
import { Phase } from "../phase.js";

/**
 * Phase to handle actions on a new encounter that must take place after other setup
 * (i.e. queue {@linkcode PostSummonPhase}s)
 */
export class InitEncounterPhase extends Phase {
  phaseName = "InitEncounterPhase";

  start() {
    for (const pokemon of globalScene.getField(true)) {
      if (pokemon.isEnemy() || pokemon.turnData.summonedThisTurn) {
        globalScene.phaseManager.unshiftNew("PostSummonPhase", pokemon.getBattlerIndex());
      }
    }

    super.end();
  }
}