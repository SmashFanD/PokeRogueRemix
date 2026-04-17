import { globalScene } from "../global-scene.js";
import { BattlePhase } from "./battle.js";

export class BattleEndPhase extends BattlePhase {
  phaseName = "BattleEndPhase";
    constructor(isVictory) {
    super();

    this.isVictory = isVictory;
  }

  start() {
    super.start();

    this.isVictory ||= globalScene.phaseManager.hasPhaseOfType(
      "BattleEndPhase",
      (phase) => phase.isVictory,
    );
    globalScene.phaseManager.removeAllPhasesOfType("BattleEndPhase");

    for (const pokemon of globalScene.getPokemonAllowedInBattle()) {
      applyAbAttrs("PostBattleAbAttr", { pokemon, victory: this.isVictory });
    }

    if (globalScene.currentBattle.moneyScattered) {
      globalScene.currentBattle.pickUpScatteredMoney();
    }

    globalScene.clearEnemyHeldItemModifiers();
    for (const p of globalScene.getEnemyParty()) {
      try {
        p.destroy();
      } catch {
        console.warn("Unable to destroy stale pokemon object in BattleEndPhase:", p);
      }
    }

    const lapsingModifiers = globalScene.findModifiers(
      m => m instanceof LapsingPersistentModifier || m instanceof LapsingPokemonHeldItemModifier
    );
    for (const m of lapsingModifiers) {
      const args = [];
      if (m instanceof LapsingPokemonHeldItemModifier) {
        args.push(globalScene.getPokemonById(m.pokemonId));
      }
      if (!m.lapse(...args)) {
        globalScene.removeModifier(m);
      }
    }

    globalScene.updateModifiers();
    this.end();
  }
}