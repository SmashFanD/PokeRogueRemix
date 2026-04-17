import { globalScene } from "../global-scene.js";
import { NextEncounterPhase } from "./next-encounter.js";

export class NewBiomeEncounterPhase extends NextEncounterPhase {
  phaseName = "NewBiomeEncounterPhase";
  doEncounter() {
    globalScene.playBgm(undefined, true);

    // Reset all battle and wave data, perform form changes, etc.
    // We do this because new biomes are considered "arena transitions" akin to trainer battles
    for (const pokemon of globalScene.getPlayerParty()) {
      if (pokemon) {
        pokemon.resetBattleAndWaveData();
        if (pokemon.isOnField()) {
          applyAbAttrs("PostBiomeChangeAbAttr", { pokemon });
        }
      }
    }

    const enemyField = globalScene.getEnemyField();
    const moveTargets = [globalScene.arenaEnemy, enemyField];

    globalScene.tweens.add({
      targets: moveTargets.flat(),
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        this.doEncounterCommon();
      },
    });
  }
}