import { globalScene } from "../global-scene.js";
import { SwitchSummonPhase } from "./switch-summon.js";

export class ReturnPhase extends SwitchSummonPhase {
  phaseName = "ReturnPhase";
  constructor(fieldIndex) {
    super(SwitchType.SWITCH, fieldIndex, -1, true);
  }

  switchAndSummon() {
    this.end();
  }

  summon() {}

  onEnd() {
    const pokemon = this.getPokemon();

    pokemon.resetSprite();
    pokemon.resetTurnData();
    pokemon.resetSummonData();

    globalScene.updateFieldScale();

    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger);
  }
}