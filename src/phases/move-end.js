import { globalScene } from "../global-scene.js";
import { PokemonPhase } from "./pokemon.js";

export class MoveEndPhase extends PokemonPhase {
  phaseName = "MoveEndPhase";
  wasFollowUp

  /** Targets from the preceding MovePhase */
  targets
  constructor(battlerIndex, targets, wasFollowUp = false) {
    super(battlerIndex);

    this.targets = targets;
    this.wasFollowUp = wasFollowUp;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    // Reset hit-related temporary data.
    // TODO: These properties should be stored inside a "move in flight" object,
    // which this Phase would promptly destroy
    if (pokemon) {
      pokemon.turnData.hitsLeft = -1;
    }

    if (!this.wasFollowUp && pokemon?.isActive(true)) {
      pokemon.lapseTags(BattlerTagLapseType.AFTER_MOVE);
    }

    // Remove effects which were set on a Pokemon which removes them on summon (i.e. via Mold Breaker)
    globalScene.arena.setIgnoreAbilities(false);
    for (const target of this.targets) {
      if (target) {
        applyAbAttrs("PostSummonRemoveEffectAbAttr", { pokemon: target });
      }
    }

    // TODO: Unshift a phase to trigger dancer for all active pokemon if at least 1 has the ability.
    this.end();
  }
}