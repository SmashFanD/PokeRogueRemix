import { defaultStarterSpecies } from "../../data/constant.js"
import { Button } from "../../enums/button.js"
import { drawBox, setText } from "../../game/draw.js"
import { updateIndexX, updateIndexY } from "../../game/manage-input.js"
import { globalScene } from "../../global-scene.js"
import { i18next } from "../../i18next.js"
import { getKeyByValue } from "../../utils.js"

class StarterSelectScreen {
    constructor() {
      this.cursorIndex = 0
      this.isSetup = false
      this.boxData = {
        BG: {
            COLOR: [25, 135, 25],
            COLOR_OUTLINE: [30, 90, 30],
            SIZE_OUTLINE: 7,
            X: 4,
            Y: 4, 
            SIZE_X: 1912,
            SIZE_Y: 1072
        },
        OPTIONS: {
            COLOR: [20, 95, 20],
            COLOR_OUTLINE: [185, 80, 80],
            SIZE_OUTLINE: 7,
            X: 4,
            Y: 4, 
            SIZE_X: 312,
            SIZE_Y: 1072
        },
        START: {
            COLOR: [130, 20, 20],
            COLOR_OUTLINE: [185, 80, 80],
            SIZE_OUTLINE: 7,
            X: 4,
            Y: 4, 
            SIZE_X: 312,
            SIZE_Y: 1072
        }
      }
      this.texts = {
        GENERATION: {
          GEN1: "menu:gen1"
        }
      }
      this.textsStart = {
        START: "menu:startWithThisTeam?",
        ANSWER: {
            YES: "menu:yes",
            NO: "menu:no"
        }
      }
      this.textData = {
        OPTIONS: {
            COLOR: 255,
            COLOR_OUTLINE: 0,
            SIZE_OUTLINE: 9,
            X: 70,
            Y: 94,
            SIZE: 96,
        },
        START: {
            COLOR: 255,
            COLOR_OUTLINE: 0,
            SIZE_OUTLINE: 8,
            X: 314,
            Y: 84,
            SIZE: 76,
        },
        ANSWER: {
            COLOR: 255,
            COLOR_OUTLINE: 0,
            SIZE_OUTLINE: 8,
            X: 314,
            Y: 84,
            SIZE: 76,
        }
      }
      //this should be starters options i think
      //this.options = starterSelection
      this.optionsStart = {
        YES: 0,
        NO: 1
      }
      this.cursorX = this.textData.OPTIONS.X - 50
      this.cursorAnswerX = this.textData.ANSWER.X - 42
      this.selectedPkm = 0
      this.selectedIndexes = [] 
      this.checkStart = false
    }
    async setup() {
      this.selectedPkm = 0
      for (const t in this.texts) {
        this.texts[t] = await i18next.t(this.texts[t])
      }
      for (const text in this.textsStart) {
        for (const t in this.textsStart[text]) {
          this.textsStart[text][t] = await i18next.t(this.textsStart[text][t])
        }
      }
      this.isSetup = true
    }
    update(p) {
      drawBox(p, this.boxData.BG);
      drawBox(p, this.boxData.OPTIONS)
      let textId = 0
      for (const t in this.texts) {
        setText(p, this.texts[t], this.textData.OPTIONS, textId)
        textId++
      }
      //Should draw each of the pokemon stats here


      if (this.checkStart) {
        setText(p, this.textsStart.START, this.textData.START)
        textId = 0;
        for (const k in this.textsStart.ANSWER) {
          setText(p, this.textsStart.ANSWER[k], this.textData.ANSWER, textId)
          textId++;
        }
        p.image(globalScene.load.imgCursor, this.cursorAnswerX, this.cursorIndex * 74 + 42, 30, 30)
        return
      }
      //should be drawn in the starter handler ?
      //p.image(globalScene.load.imgCursor, this.cursorX, this.cursorIndex * 62 + 42, 36, 36)
    }
    keyPressed(key) {
      if (key === Button.MENU) {
        if (this.checkStart) {
          return "BATTLE"
        }
        if (this.selectedIndexes.length >= 1) this.checkStart = true
        return null
      }
      if (key === Button.CANCEL) {
        if (this.checkStart) {
          this.checkStart = false
          return null
        }
        if (this.selectedIndexes.length) {
          this.selectedIndexes.pop()
          return null
        }
        return "TITLE"
      }
      if (key === Button.ACTION) {
        if (this.checkStart && this.cursorIndex === this.optionsStart.YES) {
          return "BATTLE"
        }
        if (this.checkStart && this.cursorIndex === this.optionsStart.NO) {
          this.checkStart = false
          return null
        }
        this.selectedIndexes.push(this.selectedPkm)
        if (this.selectedIndexes.length === 6) this.checkStart = true
        return null
      }

      if (this.checkStart) {
        this.cursorIndex = updateIndexX(this.cursorIndex, this.optionsStart.YES, this.optionsStart.NO, key)
        return
      }
      const keysStarters = Object.keys(defaultStarterSpecies)
      let currentStrIndex = keysBgm.indexOf(getKeyByValue(defaultStarterSpecies, this.selectedPkm))
      currentStrIndex = updateIndexX(currentStrIndex, 0, keysStarters.length - 1, key)
      currentStrIndex = updateIndexY(currentStrIndex, 0, keysStarters.length - 1, key, 15)
      
      this.selectedPkm = defaultStarterSpecies[keysStarters[currentStrIndex]]
      console.log(this.selectedPkm)
      return null
    }
}
export const starterSelectScreen = new StarterSelectScreen()