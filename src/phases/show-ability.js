import { globalScene } from "../global-scene.js";
import { PokemonPhase } from "./pokemon.js";

export class ShowAbilityPhase extends PokemonPhase {
  phaseName = "ShowAbilityPhase";
  passive;
  pokemonName;
  abilityName;
  pokemonOnField;

  constructor(battlerIndex, passive = false) {
    super(battlerIndex);

    this.passive = passive;

    const pokemon = this.getPokemon();
    if (pokemon) {
      // Set these now as the pokemon object may change before the queued phase is run
      this.pokemonName = getPokemonNameWithAffix(pokemon);
      this.abilityName = (passive ? this.getPokemon().getPassiveAbility() : this.getPokemon().getAbility()).name;
      this.pokemonOnField = true;
    } else {
      this.pokemonOnField = false;
    }
  }

  start() {
    super.start();

    if (!this.pokemonOnField || !this.getPokemon()) {
      return this.end();
    }

    // If the bar is already out, hide it before showing the new one
    if (globalScene.abilityBar.isVisible()) {
      globalScene.phaseManager.unshiftNew("HideAbilityPhase");
      globalScene.phaseManager.unshiftNew("ShowAbilityPhase", this.battlerIndex, this.passive);
      return this.end();
    }

    const pokemon = this.getPokemon();

    if (pokemon.isPlayer()) {
      //Note: enemy index should start at 10 so it is easier to implement multiples pokemon battles
      globalScene.currentBattle.lastPlayerInvolved = pokemon.getBattlerIndex() % 2;
    } else {
      /** If its an enemy pokemon, list it as last enemy to use ability or move */
      globalScene.currentBattle.lastEnemyInvolved = pokemon.getBattlerIndex() % 2;
    }

    globalScene.abilityBar.showAbility(this.pokemonName, this.abilityName, this.passive, this.player).then(() => {
      pokemon.revealAbility();

      this.end();
    });
  }
}