import { globalScene } from "../global-scene.js";
import { PokemonPhase } from "./pokemon.js";

export class PostSummonPhase extends PokemonPhase {
  phaseName = "PostSummonPhase";

  start() {
    super.start();

    const pokemon = this.getPokemon();
    console.log("Ran PSP for:", pokemon.name);
    //Toxic will not reset its turn counter
    //if (pokemon.status?.effect === StatusEffect.TOXIC) {
    //  pokemon.status.toxicTurnCount = 0;
    //}

    globalScene.arena.applyTags(ArenaTagType.PENDING_HEAL, false, pokemon);
    globalScene.arena.applyTags(EntryHazardTag, false, pokemon);
    for (const p of pokemon.getAlliesGenerator()) {
      applyAbAttrs("CommanderAbAttr", { pokemon: p });
    }

    this.end();
  }

  getPriority() {
    return 0;
  }
}