import { BattlePhase } from "./battle.js";

/**
 * Phase which handles resetting a Pokemon's status to none
 *
 * This is necessary to perform in a phase primarly to ensure that the status icon disappears at the correct time in the battle
 */
export class ResetStatusPhase extends BattlePhase {
  phaseName = "ResetStatusPhase";
  pokemon;
  affectConfusion;
  reloadAssets;

  constructor(pokemon, affectConfusion, reloadAssets) {
    super();

    this.pokemon = pokemon;
    this.affectConfusion = affectConfusion;
    this.reloadAssets = reloadAssets;
  }

  start() {
    this.pokemon.clearStatus(this.affectConfusion, this.reloadAssets);
    this.end();
  }
}