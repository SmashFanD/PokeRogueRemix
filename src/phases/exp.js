import { globalScene } from "../global-scene.js";
import { PlayerPartyMemberPokemonPhase } from "./player-party-member-pokemon.js";

export class ExpPhase extends PlayerPartyMemberPokemonPhase {
  phaseName = "ExpPhase";
  expValue

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
    globalScene.ui.showText(
      i18next.t("battle:expGain", {
        pokemonName: getPokemonNameWithAffix(pokemon),
        exp: exp.value,
      }),
      null,
      () => {
        const lastLevel = pokemon.level;
        pokemon.addExp(exp.value);
        const newLevel = pokemon.level;
        if (newLevel > lastLevel) {
          globalScene.phaseManager.unshiftNew("LevelUpPhase", this.partyMemberIndex, lastLevel, newLevel);
        }
        pokemon.updateInfo().then(() => this.end());
      },
      null,
      true,
    );
  }
}