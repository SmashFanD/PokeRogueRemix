import { globalScene } from "../global-scene.js";
import { PokemonPhase } from "./pokemon.js";

export class ShinySparklePhase extends PokemonPhase {
  phaseName = "ShinySparklePhase";
  constructor(battlerIndex) {
    super(battlerIndex);
  }

  start() {
    super.start();

    this.getPokemon().sparkle();
    globalScene.time.delayedCall(1000, () => this.end());
  }
}