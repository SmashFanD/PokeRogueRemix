/**
 * The phase where Pokemon reflect moves from {@linkcode MoveId.MAGIC_COAT | Magic Coat}
 * or {@linkcode AbilityId.MAGIC_BOUNCE | Magic Bounce}.
 */

import { PokemonPhase } from "./pokemon.js";

// TODO: This shouldn't need to inherit from `PokemonPhase` just to become dynamic
export class MoveReflectPhase extends PokemonPhase {
  phaseName = "MoveReflectPhase";

  /** The {@linkcode Pokemon} doing the reflecting. */
  pokemon
  /** The pokemon having originally used the move. */
  opponent
  /** The {@linkcode Move} being reflected. */
  move

  constructor(pokemon, opponent, move) {
    super(pokemon.getBattlerIndex());
    this.pokemon = pokemon;
    this.opponent = opponent;
    this.move = move;
  }

  start() {
    const { pokemon, opponent, move } = this;
    // Magic Coat takes precedence over Magic Bounce if both apply at once
    const magicCoatTag = pokemon.getTag(BattlerTagType.MAGIC_COAT);
    if (magicCoatTag) {
      magicCoatTag.apply(pokemon, opponent, move);
    } else {
      applyAbAttrs("ReflectStatusMoveAbAttr", { pokemon, opponent, move });
    }
    super.end();
  }

  /**
   * Dummy method to make this phase dynamic.
   */
  getPokemon() {
    return this.pokemon;
  }
}