import { globalScene } from "../global-scene.js";
import { FieldPhase } from "./field.js";

export class PokemonPhase extends FieldPhase {
  /**
   * The battler index this phase refers to
   */
    constructor(battlerIndex) {
    super();

    battlerIndex =
      battlerIndex
      ?? globalScene
        .getField()
        .find(p => p?.isActive())
        ?.getBattlerIndex();
    if (battlerIndex === undefined) {
      // TODO: figure out a suitable fallback behavior
      console.warn("There are no Pokemon on the field!");
      battlerIndex = BattlerIndex.PLAYER;
    }

    this.battlerIndex = battlerIndex;
    this.player = battlerIndex < 2;
    this.fieldIndex = battlerIndex % 2;
  }

  getPokemon() {
    if (this.battlerIndex > BattlerIndex.ENEMY_2) {
      return globalScene.getPokemonById(this.battlerIndex);
    }
    return globalScene.getField()[this.battlerIndex];
  }
}