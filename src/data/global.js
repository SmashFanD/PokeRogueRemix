import { ConfigGame } from "../system.js"

function GlobalGameData() {
    return {
      newScene: ConfigGame.GameState.MENU_SCENE,
      eraseData: null,
      startersSelected: [],
      changeScene(scene) {
        this.newScene = scene
      },
      eraseSave(erase) {
        this.eraseData = erase;
      }
    }
}

export const globalGameData = GlobalGameData()