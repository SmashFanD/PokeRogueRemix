import { globalScene } from "../global-scene.js";
import { BattlePhase } from "./battle.js";

export class SelectBiomePhase extends BattlePhase {
  phaseName = "SelectBiomePhase";

  start() {
    super.start();

    const currentBiome = globalScene.arena.biomeId;
    const currentWaveIndex = globalScene.currentBattle.waveIndex;
    const nextWaveIndex = currentWaveIndex + 1;

    if (!(nextWaveIndex % 25)
    ) {
      this.setNextBiomeAndEnd(BiomeId.END);
      return;
    }

    this.setNextBiomeAndEnd(this.generateNextBiome(nextWaveIndex));
    return;
  }

  generateNextBiome(waveIndex) {
    return waveIndex % 25 === 0 ? BiomeId.END : globalScene.generateRandomBiome(waveIndex);
  }

  setNextBiomeAndEnd(nextBiome) {
    const currentWaveIndex = globalScene.currentBattle.waveIndex;
    const nextWaveIndex = currentWaveIndex + 1;

    if (nextWaveIndex % 5 === 1) {
      globalScene.applyModifiers(MoneyInterestModifier, true);
      const healStatus = new BooleanHolder(true);
      if (healStatus.value) {
        globalScene.phaseManager.unshiftNew("PartyHealPhase", false);
      }
    }
    globalScene.phaseManager.unshiftNew("SwitchBiomePhase", nextBiome);
    this.end();
  }
}