import { globalScene } from "../global-scene.js";
import { BattlePhase } from "./battle.js";

export class PartyHealPhase extends BattlePhase {
  phaseName = "PartyHealPhase";
  resumeBgm;

  constructor(resumeBgm) {
    super();

    this.resumeBgm = resumeBgm;
  }

  start() {
    super.start();

    const bgmPlaying = globalScene.isBgmPlaying();
    if (bgmPlaying) {
      globalScene.fadeOutBgm(1000, false);
    }
    globalScene.ui.fadeOut(1000).then(() => {
      for (const pokemon of globalScene.getPlayerParty()) {
        pokemon.hp = pokemon.getMaxHp();
        pokemon.resetStatus(true, false, false, true);
        for (const move of pokemon.moveset) {
          move.ppUsed = 0; //remove this in favor of cooldown
        }
        pokemon.updateInfo(true);
      }
      const healSong = globalScene.playSoundWithoutBgm("heal");
      if (healSong) {
        globalScene.time.delayedCall(fixedInt(healSong.totalDuration * 1000), () => {
          healSong.destroy();
          if (this.resumeBgm && bgmPlaying) {
            globalScene.playBgm();
          }
          globalScene.ui.fadeIn(500).then(() => this.end());
        });
      }
    });
  }
}