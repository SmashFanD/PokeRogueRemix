import { globalScene } from "../global-scene.js";
import { PlayerPartyMemberPokemonPhase } from "./player-party-member-pokemon.js";

export class LevelUpPhase extends PlayerPartyMemberPokemonPhase {
  phaseName = "LevelUpPhase";
  lastLevel
  level
  pokemon = this.getPlayerPokemon();

  constructor(partyMemberIndex, lastLevel, level) {
    super(partyMemberIndex);

    this.lastLevel = lastLevel;
    this.level = level;
  }

  start() {
    super.start();

    const prevStats = this.pokemon.stats.slice(0);
    this.pokemon.calculateStats();
    this.pokemon.updateInfo();
    if (globalScene.expParty === ExpNotification.DEFAULT) {
      globalScene.playSound("level_up_fanfare");
      globalScene.ui.showText(
        i18next.t("battle:levelUp", {
          pokemonName: getPokemonNameWithAffix(this.pokemon),
          level: this.level,
        }),
        null,
        () =>
          globalScene.ui
            .getMessageHandler()
            .promptLevelUpStats(this.partyMemberIndex, prevStats, false)
            .then(() => this.end()),
        null,
        true,
      );
    } else if (globalScene.expParty === ExpNotification.SKIP) {
      this.end();
    } else {
      // we still want to display the stats if activated
      globalScene.ui
        .getMessageHandler()
        .promptLevelUpStats(this.partyMemberIndex, prevStats, false)
        .then(() => this.end());
    }
  }

  end() {
    if (this.lastLevel < 100) {
      // this feels like an unnecessary optimization
      const levelMoves = this.getPokemon().getLevelMoves(this.lastLevel + 1);
      for (const lm of levelMoves) {
        globalScene.phaseManager.unshiftNew("LearnMovePhase", this.partyMemberIndex, lm[1]);
      }
    }
    if (!this.pokemon.pauseEvolutions) {
      const evolution = this.pokemon.getEvolution();
      if (evolution) {
        this.pokemon.breakIllusion();
        globalScene.phaseManager.unshiftNew("EvolutionPhase", this.pokemon, evolution, this.lastLevel);
      }
    }
    return super.end();
  }
}