import { globalScene } from "../global-scene.js";
import { EncounterPhase } from "./encounter.js";

/**
 * The phase between defeating an encounter and starting another wild wave.
 * Handles generating, loading and preparing for it.
 */
export class NextEncounterPhase extends EncounterPhase {
  phaseName = "NextEncounterPhase";
  start() {
    super.start();
  }

  doEncounter() {
    globalScene.playBgm(undefined, true);

    // Reset all player transient wave data/intel before starting a new wild encounter.
    // We exclusively reset wave data here as wild waves are considered one continuous "battle"
    // for lack of an arena transition.
    for (const pokemon of globalScene.getPlayerParty()) {
      if (pokemon) {
        pokemon.resetWaveData();
      }
    }

    globalScene.arenaNextEnemy.setBiome(globalScene.arena.biomeId);
    globalScene.arenaNextEnemy.setVisible(true);

    const enemyField = globalScene.getEnemyField();
    const moveTargets = [
      globalScene.arenaEnemy,
      globalScene.arenaNextEnemy,
      globalScene.currentBattle.trainer,
      enemyField,
      globalScene.lastEnemyTrainer,
    ];

    globalScene.tweens.add({
      targets: moveTargets.flat(),
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        globalScene.arenaEnemy.setBiome(globalScene.arena.biomeId);
        globalScene.arenaEnemy.setX(globalScene.arenaNextEnemy.x);
        globalScene.arenaEnemy.setAlpha(1);
        globalScene.arenaNextEnemy.setX(globalScene.arenaNextEnemy.x - 300);
        globalScene.arenaNextEnemy.setVisible(false);
        if (globalScene.lastEnemyTrainer) {
          globalScene.lastEnemyTrainer.destroy();
        }
        this.doEncounterCommon();
      },
    });
  }

  /** Do nothing (since this is simply the next wave in the same biome). */
  trySetWeatherIfNewBiome() {}

  /** Do nothing (since this is simply the next wave in the same biome). */
  trySetTerrainIfNewBiome() {}
}