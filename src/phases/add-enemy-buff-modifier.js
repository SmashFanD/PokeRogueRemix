import { globalScene } from "../global-scene.js";
import { Phase } from "../phase.js";

export class AddEnemyBuffModifierPhase extends Phase {
  phaseName = "AddEnemyBuffModifierPhase";
  start() {
    super.start();

    const waveIndex = globalScene.currentBattle.waveIndex;
    const tier = waveIndex % 1000 ? (waveIndex % 250 ? ModifierTier.COMMON : ModifierTier.GREAT) : ModifierTier.ULTRA;

    regenerateModifierPoolThresholds(globalScene.getEnemyParty(), ModifierPoolType.ENEMY_BUFF);

    const count = Math.ceil(waveIndex / 250);
    for (let i = 0; i < count; i++) {
      globalScene.addEnemyModifier(
        getEnemyBuffModifierForWave(
          tier,
          globalScene.findModifiers(m => m instanceof EnemyPersistentModifier, false),
        ),
        true,
        true,
      );
    }
    globalScene.updateModifiers(false, true);
    this.end();
  }
}