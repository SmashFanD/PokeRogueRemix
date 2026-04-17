import { IMG_Background, IMG_UI } from "./constant/image/ui.js"
import { SND_Background } from "./constant/sound/bgm.js"
import { globalScene } from "./global-scene.js"
import { i18next } from "./i18next.js"
import { initializeGame } from "./init/init.js"
import { saveData } from "./save.js"

//Load what need to stay loaded (basic ui, sound or text data)
class LoadingScene {

    async setup(p) {
        globalScene.music.loadBgAudioBuffer(globalScene.musicBg.SRC)
        globalScene.music.loadBgAudioBuffer(SND_Background.LEVEL_UP.SRC)
        globalScene.music.loadBgAudioBuffer(SND_Background.ITEM_OBTAIN.SRC)
        globalScene.music.loadBgAudioBuffer(SND_Background.EVOLUTION_MINOR_FANFARE.SRC)
        globalScene.music.loadBgAudioBuffer(SND_Background.EVOLUTION.SRC)
        globalScene.music.loadBgAudioBuffer(SND_Background.EVOLUTION_FANFARE.SRC)

        //load Snd

        globalScene.imgBg = p.loadImage(globalScene.imgBg)
        this.imgCursor = p.loadImage(IMG_UI.CURSOR)
        this.imgSelector = p.loadImage(IMG_UI.SELECTOR)

        let files = [
          "ability.json",
          "ability-trigger.json",
          "arena-flyout.json",
          "battle.json",
          "battle-info.json",
          "battle-message-ui-handler.json",
          "battler-tags.json",
          "battle-scene.json",
          "berry.json",
          "bgm-name.json",
          "biomes.json",
          "command-ui-handler.json",
          "common.json",
          "dialogue.json",
          "dialogue-misc.json",
          "egg.json",
          "fight-ui-handler.json",
          "game-data.json",
          "growth.json",
          "menu.json",
          "menu-ui-handler.json",
          "modifier.json",
          "modifier-select-ui-handler.json",
          "modifier-type.json",
          "move.json",
          "move-trigger.json",
          "nature.json",
          "party-ui-handler.json",
          "pokemon.json",
          "pokemon-category.json",
          "pokemon-evolutions.json",
          "pokemon-info.json",
          "pokemon-info-container.json",
          "pokemon-summary.json",
          "save-slot-select-ui-handler.json",
          "settings.json",
          "starter-select-ui-handler.json",
          "status-effect.json",
          "terrain.json",
          "trainer-classes.json",
          "trainer-names.json",
          "trainers-common.json",
          "trainer-titles.json",
          "weather.json"
        ]
        await i18next.loadFromJSON(files, 'locale/en')


        initializeGame();
    }

}
export const loadingScene = new LoadingScene()