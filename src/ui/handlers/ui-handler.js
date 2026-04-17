import { globalScene } from "../../global-scene.js";

export class UiHandler {
  mode = null
  cursor = 0
  active = false

  /**
   * @param mode The mode of the UI element. These should be unique.
   */
  constructor(mode = null) {
    this.mode = mode;
  }

  setup() {}

  show(_args) {
    this.active = true;

    return true;
  }

  processInput(button) {}

  getUi() {
    return globalScene.ui;
  }

  getCursor() {
    return this.cursor;
  }

  setCursor(cursor) {
    const changed = this.cursor !== cursor;
    if (changed) {
      this.cursor = cursor;
    }

    return changed;
  }
  clear() {
    this.active = false;
  }
  /**
   * To be implemented by individual handlers when necessary to free memory
   * Called when {@linkcode BattleScene} is reset
   */
  destroy() {}
}