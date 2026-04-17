import { globalScene } from "../global-scene.js";
import { BattlePhase } from "./battle.js";

export class GameOverPhase extends BattlePhase {
  phaseName = "GameOverPhase";
  isVictory

  constructor(isVictory = false) {
    super();

    this.isVictory = isVictory;
  }

  start() {
    super.start();

    globalScene.phaseManager.hideAbilityBar();

    this.handleGameOver()
  }

  handleGameOver() {
    const doGameOver = (newClear) => {
      globalScene.disableMenu = true;
      globalScene.time.delayedCall(1000, () => {
        
        const fadeDuration = 5000;
        globalScene.fadeOutBgm(fadeDuration, true);
        const activeBattlers = globalScene.getField().filter(p => p?.isActive(true));
        activeBattlers.map(p => p.hideInfo());
        globalScene.ui.fadeOut(fadeDuration).then(() => {
          activeBattlers.map(a => a.setVisible(false));
          globalScene.setFieldScale(1, true);
          globalScene.phaseManager.clearPhaseQueue();
          globalScene.ui.clearText();

          const clear = (endCardPhase) => {
            this.getRunHistoryEntry().then(runHistoryEntry => {
              globalScene.gameData.saveRunHistory(runHistoryEntry, this.isVictory);
              globalScene.phaseManager.pushNew("PostGameOverPhase", globalScene.sessionSlotId, endCardPhase);
              this.end();
            });
          };

          clear();
        });
      });
    };

    // If Online, execute apiFetch as intended
    // If Offline, execute offlineNewClear() only for victory, a localStorage implementation of newClear daily run checks
    doGameOver(false);
  }

  // TODO: Make function use existing getSessionSaveData() function and then modify the values from there.
  /**
   * Slightly modified version of {@linkcode GameData.getSessionSaveData}.
   * @returns A promise containing the {@linkcode SessionSaveData}
   */
  async getRunHistoryEntry() {
    const preWaveSessionData = await globalScene.gameData.getSession(globalScene.sessionSlotId);
    return {
      party: globalScene.getPlayerParty().map(p => new PokemonData(p)),
      enemyParty: globalScene.getEnemyParty().map(p => new PokemonData(p)),
      modifiers: preWaveSessionData
        ? preWaveSessionData.modifiers
        : globalScene.findModifiers(() => true).map(m => new PersistentModifierData(m, true)),
      enemyModifiers: preWaveSessionData
        ? preWaveSessionData.enemyModifiers
        : globalScene.findModifiers(() => true, false).map(m => new PersistentModifierData(m, false)),
      arena: new ArenaData(globalScene.arena),
      money: Math.floor(globalScene.money),
      waveIndex: globalScene.currentBattle.waveIndex,
      battleType: globalScene.currentBattle.battleType,
      trainer: globalScene.currentBattle.trainer ? new TrainerData(globalScene.currentBattle.trainer) : null,
      playerFaints: globalScene.arena.playerFaints,
    };
  }
}