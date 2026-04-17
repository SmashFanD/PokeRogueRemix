import { Button } from "../../enums/button.js"
import { drawBox, setText } from "../../game/draw.js"
import { updateIndexY } from "../../game/manage-input.js"
import { globalScene } from "../../global-scene.js"
import { i18next } from "../../i18next.js"

class TitleScreen {
    constructor() {
      this.cursorIndex = 0
      this.isSetup = false
      this.boxData = {
        COLOR: [130, 20, 20],
        COLOR_OUTLINE: [185, 80, 80],
        SIZE_OUTLINE: 7,
        X: 1682,
        Y: 886, 
        SIZE_X: 234,
        SIZE_Y: 188,
      }
      this.texts = {
        NEW_RUN: "menu:newGame",
        CONTINUE: "menu:continue",
        MENU: "menu:menu"
      }
      this.textData = {
        COLOR: 255,
        COLOR_OUTLINE: 0,
        SIZE_OUTLINE: 7,
        X: 1734,
        Y: 938,
        SIZE: 60,
      }
      this.options = {
        STARTER: 0,
        CONTINUE: 1,
        MENU: 2
      }
      this.cursorX = this.textData.X - 40
    }
    async setup() {
      for (const text in this.texts) {
        this.texts[text] = await i18next.t(this.texts[text])
      }
      this.isSetup = true
    }
    update(p) {
      drawBox(p, this.boxData);
      let textId = 0
      for (const text in this.texts) {
        setText(p, this.texts[text], this.textData, textId)
        textId++
      }
      p.image(globalScene.load.imgCursor, this.cursorX, this.cursorIndex * 62 + 902, 30, 30)
    }
    keyPressed(key) {
      if (key === Button.MENU) {
        return "MENU"
      }
      if (key === Button.ACTION) {
        if (this.cursorIndex === this.options.STARTER) {
          return "STARTER"
        }
        if (this.cursorIndex === this.options.CONTINUE) {
          return "CONTINUE"
        }
        if (this.cursorIndex === this.options.MENU) {
          return "MENU"
        }
      }
      this.cursorIndex = updateIndexY(this.cursorIndex, this.options.STARTER, this.options.MENU, key)
      return null
    }
}
export const titleScreen = new TitleScreen()