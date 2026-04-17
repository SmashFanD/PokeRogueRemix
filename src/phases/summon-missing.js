import { globalScene } from "../global-scene.js";
import { SummonPhase } from "./summon.js";

export class SummonMissingPhase extends SummonPhase {
  phaseName = "SummonMissingPhase";
  preSummon() {
    globalScene.ui.showText(
      i18next.t("battle:sendOutPokemon", {
        pokemonName: getPokemonNameWithAffix(this.getPokemon()),
      }),
    );
    globalScene.time.delayedCall(250, () => this.summon());
  }
}