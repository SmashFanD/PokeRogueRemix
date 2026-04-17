import { initAbilities } from "../data/abilities/init-abilities.js";
import { initSpecies } from "../data/balance/pokemon-species.js";
import { initMoves } from "../data/moves/move.js";
import { initPokemonPrevolutions, initPokemonStarters } from "../data/pokemon-evolution.js";

export function initializeGame() {
  //initModifierTypes();
  //initModifierPools();
  initPokemonPrevolutions();
  initPokemonStarters();
  //initBiomes();
  //initBiomeDepths();
  initSpecies();
  initMoves();
  initAbilities();
}