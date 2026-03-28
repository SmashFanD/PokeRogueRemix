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

export const PokemonGeneration = {
  GEN1: 1,
  GEN2: 2,
  GEN3: 3,
  GEN4: 4,
  GEN5: 5,
  GEN6: 6,
  GEN7: 7,
  GEN8: 8,
  GEN: 9
}