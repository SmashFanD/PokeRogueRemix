import { Button } from "../../enums/button.js"
import { drawBox, setText } from "../../game/draw.js"
import { updateIndexY } from "../../game/manage-input.js"
import { globalScene } from "../../global-scene.js"
import { i18next } from "../../i18next.js"

class MenuScreen {
    constructor() {
      this.cursorIndex = 0
      this.isSetup = false
      this.boxData = {
        NAME: {
            COLOR: [130, 20, 20],
            COLOR_OUTLINE: [185, 80, 80],
            SIZE_OUTLINE: 7,
            X: 1658,
            Y: 6, 
            SIZE_X: 256,
            SIZE_Y: 1068
        },
        INFO: {
            COLOR: [130, 20, 20],
            COLOR_OUTLINE: [185, 80, 80],
            SIZE_OUTLINE: 7,
            X: 6,
            Y: 874,
            SIZE_X: 1908,
            SIZE_Y: 200
        }
      }
      this.texts = {
        OPTIONS: {
            name: "menu:options",
            info: ""
        },
        MOVES: {
            name: "menu:moves",
            info: "menu:movesInfo"
        },
        ITEMS: {
            name: "menu:items",
            info: "menu:itemsInfo"
        },
        ABILITIES: {
            name: "menu:abilities",
            info: "menu:abilitiesInfo"
        },
        STATUS: {
            name: "menu:status",
            info: "menu:statusInfo"
        },
        GAME: {
            name: "menu:game",
            info: "menu:gameInfo"
        }
      }
      this.textData = {
        NAME: {
            COLOR: 255,
            COLOR_OUTLINE: 0,
            SIZE_OUTLINE: 7,
            X: 1712,
            Y: 60,
            SIZE: 60
        },
        INFO: {
            COLOR: 255,
            COLOR_OUTLINE: 0,
            SIZE_OUTLINE: 7,
            X: 22,
            Y: 960,
            SIZE: 90,
            MAX_CHAR: 60
        }
      }
      this.options = {
        OPTIONS: 0,
        MOVES: 1,
        ITEMS: 2,
        ABILITIES: 3,
        STATUS: 4,
        GAME: 5
      }
      this.cursorX = this.textData.NAME.X - 40
    }
    async setup() {
      for (const text in this.texts) {
        this.texts[text].name = await i18next.t(this.texts[text].name)
        this.texts[text].info = await i18next.t(this.texts[text].info)
      }
      this.isSetup = true
    }
    update(p) {
      drawBox(p, this.boxData.NAME);
      let textId = 0
      for (const text in this.texts) {
        setText(p, this.texts[text].name, this.textData.NAME, textId)
        textId++
      }
      if (this.cursorIndex > 0) {
        drawBox(p, this.boxData.INFO)
        const keys = Object.keys(this.texts);
        const key = keys[this.cursorIndex];
        setText(p, this.texts[key].info, this.textData.INFO)
      }
      p.image(globalScene.load.imgCursor, this.cursorX, this.cursorIndex * 60 + 24, 30, 30)
    }
    keyPressed(key) {
      if (key === Button.MENU || key === Button.CANCEL) {
        return "TITLE"
      }
      if (key === Button.ACTION) {
        if (this.cursorIndex === this.options.OPTIONS) {
          return "OPTIONS"
        }
        if (this.cursorIndex === this.options.MOVES) {
          //return "MOVES"
        }
        if (this.cursorIndex === this.options.ITEMS) {
          //return "ITEMS"
        }
        if (this.cursorIndex === this.options.ABILITIES) {
          //return "OPTIONS"
        }
        if (this.cursorIndex === this.options.STATUS) {
          //return "STATUS"
        }
        if (this.cursorIndex === this.options.GAME) {
          //return "GAME"
        }
      }
      this.cursorIndex = updateIndexY(this.cursorIndex, this.options.OPTIONS, this.options.GAME, key)
      return null
    }
}
export const menuScreen = new MenuScreen()