import { globalScene } from "../global-scene.js";
import { FieldPhase } from "./field.js";

export class TurnInitPhase extends FieldPhase {
  phaseName = "TurnInitPhase";
  start() {
    super.start();

    globalScene.getPlayerField().forEach(p => {
      // If this pokemon is in play and evolved into something illegal under the current challenge, force a switch
      if (p.isOnField() && !p.isAllowedInBattle()) {
        globalScene.phaseManager.queueMessage(
          i18next.t("challenges:illegalEvolution", { pokemon: p.name }),
          null,
          true,
        );

        const allowedPokemon = globalScene.getPokemonAllowedInBattle();

        if (allowedPokemon.length === 0) {
          // If there are no longer any legal pokemon in the party, game over.
          globalScene.phaseManager.clearPhaseQueue();
          globalScene.phaseManager.unshiftNew("GameOverPhase");
        } else if (
          allowedPokemon.length >= globalScene.currentBattle.getBattlerCount()
          || (globalScene.currentBattle.double && !allowedPokemon[0].isActive(true))
        ) {
          // If there is at least one pokemon in the back that is legal to switch in, force a switch.
          p.switchOut();
        } else {
          // If there are no pokemon in the back but we're not game overing, just hide the pokemon.
          // This should only happen in double battles.
          p.leaveField();
        }
      }
    });

    globalScene.eventTarget.dispatchEvent(new TurnInitEvent());

    globalScene.getField().forEach((pokemon, i) => {
      if (pokemon?.isActive()) {
        if (pokemon.isPlayer()) {
          globalScene.currentBattle.addParticipant(pokemon);
        }

        pokemon.resetTurnData();

        //Command phase should not be before turn start phase
        if (pokemon.isPlayer()) {
          globalScene.phaseManager.pushNew("CommandPhase", i);
        } else {
          globalScene.phaseManager.pushNew("EnemyCommandPhase", i - BattlerIndex.ENEMY);
        }
      }
    });

    globalScene.phaseManager.pushNew("TurnStartPhase");

    this.end();
  }
}