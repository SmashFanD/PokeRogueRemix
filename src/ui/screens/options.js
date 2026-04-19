import { SND_Background } from "../../constant/sound/bgm.js"
import { Button } from "../../enums/button.js"
import { drawBox, setText } from "../../game/draw.js"
import { updateIndexX, updateIndexY } from "../../game/manage-input.js"
import { musicPlayer } from "../../game/music.js"
import { globalScene } from "../../global-scene.js"
import { i18next } from "../../i18next.js"
import { getKeyByValue } from "../../utils.js"

class OptionScreen {
    constructor() {
      this.cursorIndex = 0
    }
    async setup() {
      this.boxData = {
        BG: {
            COLOR: [130, 20, 20],
            COLOR_OUTLINE: [185, 80, 80],
            SIZE_OUTLINE: 7,
            X: 6,
            Y: 6, 
            SIZE_X: 1908,
            SIZE_Y: 1068
        },
        TYPE: {
            COLOR: [130, 20, 20],
            COLOR_OUTLINE: [185, 80, 80],
            SIZE_OUTLINE: 7,
            X: 6,
            Y: 6, 
            SIZE_X: 256,
            SIZE_Y: 1068
        }
      }
      this.texts = {
        SOUND: "menu:sound"
      }
      this.textsOptions = {
        SOUND: {
            BGM_CHOICE: "menu:bgmChoice",
            BGM_FORCED_ON: "menu:bgmForcedOn",
            BGM_FORCED_OFF: "menu:bgmForcedOff",
            BGM_CACHE: "menu:bgmCache"
        }
      }
      this.textData = {
        TYPE: {
            COLOR: 255,
            COLOR_OUTLINE: 0,
            SIZE_OUTLINE: 9,
            X: 70,
            Y: 94,
            SIZE: 96,
        },
        OPTION: {
            COLOR: 255,
            COLOR_OUTLINE: 0,
            SIZE_OUTLINE: 8,
            X: 314,
            Y: 84,
            SIZE: 76,
        },
        OPTION_GRAY: {
            COLOR: 40,
            COLOR_OUTLINE: 0,
            SIZE_OUTLINE: 8,
            X: 314,
            Y: 84,
            SIZE: 76,
        }
      }
      this.options = {
        SOUND: 0
      }
      this.optionSound = {
        BGM_CHOICE: 10,
        BGM_FORCED: 11,
        BGM_CACHE: 12
      }
      this.cursorX = this.textData.TYPE.X - 50
      this.cursorOptionX = this.textData.OPTION.X - 42
      this.selectedMusic = globalScene.musicBg

      for (const t in this.texts) {
        this.texts[t] = await i18next.t(this.texts[t])
      }
      for (const text in this.textsOptions) {
        for (const t in this.textsOptions[text]) {
          this.textsOptions[text][t] = await i18next.t(this.textsOptions[text][t])
        }
      }
    }
    update(p) {
      drawBox(p, this.boxData.BG);
      drawBox(p, this.boxData.TYPE)
      let textId = 0
      for (const t in this.texts) {
        setText(p, this.texts[t], this.textData.TYPE, textId)
        textId++
      }
      if (this.cursorIndex === this.options.SOUND || this.cursorIndex >= this.optionSound.BGM_CHOICE) {
        textId = 0;
        for (const k in this.textsOptions.SOUND) {
          if (k === "BGM_FORCED_OFF" && globalScene.musicForced) continue
          if (k === "BGM_FORCED_ON" && !globalScene.musicForced) continue
          if (k === "BGM_CHOICE") {
            const data = globalScene.musicForced ? this.textData.OPTION_GRAY : this.textData.OPTION
            setText(p, this.textsOptions.SOUND[k] + this.selectedMusic.NAME, data, textId)
            textId++
            continue
          }
          if (k === "BGM_CACHE") {
            setText(p, this.textsOptions.SOUND[k] + musicPlayer.bgmMaxCache, this.textData.OPTION, textId)
            textId++
            continue
          }
          setText(p, this.textsOptions.SOUND[k], this.textData.OPTION, textId);
          textId++;
        }
      }
      if (this.cursorIndex >= this.optionSound.BGM_CHOICE) {
        const idx = this.cursorIndex - this.optionSound.BGM_CHOICE
        p.image(globalScene.load.imgCursor, this.cursorOptionX, idx * 74 + 42, 30, 30)
      } else {
        p.image(globalScene.load.imgCursor, this.cursorX, this.cursorIndex * 62 + 42, 36, 36)
      }
    }
    keyPressed(key) {
      if (key === Button.MENU) {
        return "MENU"
      }
      if (key === Button.CANCEL) {
        if (this.cursorIndex >= this.optionSound.BGM_CHOICE) {
          this.cursorIndex = this.options.SOUND
          return null
        }
        return "MENU"
      }
      if (key === Button.ACTION) {
        if (this.cursorIndex === this.options.SOUND) {
          this.cursorIndex = this.optionSound.BGM_CHOICE
          return null
        }
        if (this.cursorIndex === this.optionSound.BGM_CHOICE) {
          globalScene.music.playBgm(this.selectedMusic)
          return null
        }
        if (this.cursorIndex === this.optionSound.BGM_FORCED) {
          globalScene.musicForced = !globalScene.musicForced
          return null
        }
        return null
      }
      if (this.cursorIndex >= this.optionSound.BGM_CHOICE) {
        if (this.cursorIndex === this.optionSound.BGM_CHOICE) {
          const keysBgm = Object.keys(SND_Background)
          let currentBgmIndex = keysBgm.indexOf(getKeyByValue(SND_Background, this.selectedMusic))
          currentBgmIndex = updateIndexX(currentBgmIndex, 0, keysBgm.length - 1, key)
          this.selectedMusic = SND_Background[keysBgm[currentBgmIndex]]
          console.log(this.selectedMusic.NAME)
        }
        if (this.cursorIndex === this.optionSound.BGM_CACHE) {
          musicPlayer.bgmMaxCache = updateIndexX(musicPlayer.bgmMaxCache, 0, 255, key)
        }
        this.cursorIndex = updateIndexY(this.cursorIndex, this.optionSound.BGM_CHOICE, this.optionSound.BGM_CACHE, key)
        return null
      }
      this.cursorIndex = updateIndexY(this.cursorIndex, this.options.SOUND, this.options.SOUND, key)
      return null
    }
    reset() {
      this.isSetup = null
      this.boxData = null
      this.texts = null
      this.textsOptions = null
      this.textData = null
      this.options = null
      this.optionSound = null
      this.cursorX = null
      this.cursorOptionX = null
      this.selectedMusic = null
    }
}
export const optionScreen = new OptionScreen()