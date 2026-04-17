import { BattlePhase } from "./battle.js";


export class MoveHeaderPhase extends BattlePhase {
  phaseName = "MoveHeaderPhase";
  move
  pokemon

  constructor(pokemon, move) {
    super();

    this.pokemon = pokemon;
    this.move = move;
  }

  getPokemon() {
    return this.pokemon;
  }

  canMove() {
    return this.pokemon.isActive(true) && this.move.isUsable(this.pokemon)[0];
  }

  start() {
    super.start();

    if (this.canMove()) {
      applyMoveAttrs("MoveHeaderAttr", this.pokemon, null, this.move.getMove());
    }
    this.end();
  }
}