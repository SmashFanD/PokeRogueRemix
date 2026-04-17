import { globalScene } from "../global-scene.js";
import { PlayerPartyMemberPokemonPhase } from "./player-party-member-pokemon.js";

export class ShowPartyExpBarPhase extends PlayerPartyMemberPokemonPhase {
  phaseName = "ShowPartyExpBarPhase";
  expValue;

  constructor(partyMemberIndex, expValue) {
    super(partyMemberIndex);

    this.expValue = expValue;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    const exp = new NumberHolder(this.expValue);
    globalScene.applyModifiers(ExpBoosterModifier, true, exp);
    exp.value = Math.floor(exp.value);

    const lastLevel = pokemon.level;
    pokemon.addExp(exp.value);
    const newLevel = pokemon.level;
    if (newLevel > lastLevel) {
      globalScene.phaseManager.unshiftNew("LevelUpPhase", this.partyMemberIndex, lastLevel, newLevel);
    }
    globalScene.phaseManager.unshiftNew("HidePartyExpBarPhase");
    pokemon.updateInfo();

    globalScene.partyExpBar.showPokemonExp(pokemon, exp.value, false, newLevel).then(() => {
      setTimeout(() => this.end(), 500 / Math.pow(2, globalScene.expGainsSpeed));
    });
  }
}