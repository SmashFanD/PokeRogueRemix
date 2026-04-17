import { BattleType } from "../enums/battle-type.js";
import { UiMode } from "../enums/ui-mode.js";
import { globalScene } from "../global-scene.js";
import { i18next } from "../i18next.js";
import { Phase } from "../phase.js";
import { loggedInUser, updateUserInfo } from "../save.js";

const NO_SAVE_SLOT = -1;

export class TitlePhase extends Phase {
  phaseName = "TitlePhase";
  loaded = false;

  async start() {
    super.start();
    globalScene.music.playBgm(globalScene.load.musicBg);

    await updateUserInfo();
    await globalScene.ui.setMode(UiMode.TITLE);
  }
  end() {
    if (!this.loaded) {
      globalScene.loadBgm(globalScene.arena.bgm);
      globalScene.phaseManager.pushNew("SelectStarterPhase");
      globalScene.newArena(globalScene.gameMode.getStartingBiome()); //check this
    } else {
      globalScene.playBgm();
    }

    globalScene.phaseManager.pushNew("EncounterPhase", this.loaded);

    if (this.loaded) {
      const availablePartyMembers = globalScene.getPokemonAllowedInBattle().length;

      globalScene.phaseManager.pushNew("SummonPhase", 0, true, true);

      if (globalScene.currentBattle.battleType !== BattleType.TRAINER) {
        const minPartySize = 1;
        if (availablePartyMembers > minPartySize) {
          globalScene.phaseManager.pushNew("CheckSwitchPhase", 0, false);
        }
      }
    }

    super.end();
  }
}