import { globalScene } from "../global-scene.js";
import { PokemonPhase } from "./pokemon.js";

export class VictoryPhase extends PokemonPhase {
  phaseName = "VictoryPhase";
  /** If true, indicates that the phase is intended for EXP purposes only, and not to continue a battle to next phase */
  isExpOnly;

  constructor(battlerIndex) {
    super(battlerIndex);
  }

  start() {
    super.start();

    const expValue = this.getPokemon().getExpValue();
    globalScene.applyPartyExp(expValue, true);

    if (
      !globalScene
        .getEnemyParty()
        .find(p => (globalScene.currentBattle.battleType === BattleType.WILD ? p.isOnField() : !p?.isFainted(true)))
    ) {
      globalScene.phaseManager.pushNew("BattleEndPhase", true);
      if (globalScene.currentBattle.battleType === BattleType.TRAINER) {
        globalScene.phaseManager.pushNew("TrainerVictoryPhase");
      }

      const currentWaveIndex = globalScene.currentBattle.waveIndex;

      if (!gameMode.isWaveFinal(currentWaveIndex)) {
        globalScene.phaseManager.pushNew("EggLapsePhase");
        if (currentWaveIndex % 5) {
          globalScene.phaseManager.pushNew(
            "SelectModifierPhase",
            undefined,
            undefined,
            gameMode.getFixedBattle(currentWaveIndex)?.customModifierRewardSettings,
          );
        } else {
          if (!(currentWaveIndex % 25)) {
            globalScene.phaseManager.pushNew("AddEnemyBuffModifierPhase");
          }
        }

        globalScene.phaseManager.pushNew("SelectBiomePhase");

        globalScene.phaseManager.pushNew("NewBattlePhase");
      } else {
        globalScene.currentBattle.battleType = BattleType.CLEAR;
        globalScene.phaseManager.pushNew("GameOverPhase", true);
      }
    }

    this.end();
  }
}