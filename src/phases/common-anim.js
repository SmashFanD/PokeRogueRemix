import { globalScene } from "../global-scene.js";
import { PokemonPhase } from "./pokemon.js";

export class CommonAnimPhase extends PokemonPhase {
  // PokemonHealPhase extends CommonAnimPhase, and to make typescript happy,
  // we need to allow phaseName to be a union of the two
  phaseName = "CommonAnimPhase"

  // TODO: Why can common anim be null?
  // TODO: Pass in pokemon directly instead of operating with unsafe indices
  constructor(battlerIndex, targetIndex, anim = null) {
    super(battlerIndex);

    this.anim = anim;
    this.targetIndex = targetIndex;
  }

  setAnimation(anim) {
    this.anim = anim;
  }

  start() {
    const target =
      this.targetIndex !== undefined
        ? (this.player ? globalScene.getEnemyField() : globalScene.getPlayerField())[this.targetIndex]
        : this.getPokemon();
    new CommonBattleAnim(this.anim, this.getPokemon(), target).play(false, () => {
      this.end();
    });
  }
}