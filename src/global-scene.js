import { IMG_Background } from "./constant/image/ui.js"
import { SND_Background } from "./constant/sound/bgm.js"
import { BattleMsgBoxType } from "./enums/battle-msg-box-type.js"
import { Animation } from "./game/animation.js"
import { translateInput } from "./game/manage-input.js"
import { musicPlayer } from "./game/music.js"
import { GameData } from "./gamedata.js"
import { loadingScene } from "./loading-scene.js"
import { PhaseManager } from "./phase-manager.js"
import { saveData } from "./save.js"
import { ui } from "./ui.js"

/** Instance responssible for all non visible game logic */
class GlobalScene {
    imgBg = IMG_Background.END
    musicBg = SND_Background.END
    musicForced = false
    musicOff = []
    //all loaded assets may be stored here
    load = loadingScene
    music = musicPlayer
    ui = null
    battle = null
    battleMsgBoxType = BattleMsgBoxType.VISIBLE
    overlay = null //This should be an invisible black box for transitions, but for now it's unused
    getGlobalSave() {
        const data = localStorage.getItem('PokeRogueRemixGlobal');
        if (data) {
            const assignData = JSON.parse(data)
            Object.assign(this, assignData);
            console.log(this, assignData)
            return true;
        }
        return null;
    }
    doGlobalSave() {
      const data = {
        imgBg: this.imgBg,
        musicBg: this.musicBg,
        musicForced: this.musicForced,
        musicOff: this.musicOff
      }
      localStorage.setItem('PokeRogueRemixGlobal', JSON.stringify(data));
    }
    /**
   * Create game objects with loaded assets.
   */
    setup() {
      this.music.playBgm(this.musicBg);
      this.ui = ui

      //this.gameData = new GameData();
    }
    async update(p) {
      
      await this.ui?.update(p)
    }

    keyPressed(key) {
      console.log(key)
      key = translateInput(key)
      this.ui?.keyPressed(key)
      console.log(key)
    }
}

export const globalScene = new GlobalScene();