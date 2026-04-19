import { i18next } from "../../i18next.js";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../utils.js";
import { menuScreen } from "../screens/menu.js";
import { optionScreen } from "../screens/options.js";
import { starterSelectScreen } from "../screens/startersSelect.js";
import { titleScreen } from "../screens/title.js";


export class TitleUiHandler {
  //logo = {src: "../../img/ui/logo.png", x: CANVAS_WIDTH / 2, y: 8, originX: 0.5, originY: 0}
  constructor() {
    this.screens = {
      TITLE: titleScreen,
      STARTER: starterSelectScreen,
      MENU: menuScreen,
      OPTIONS: optionScreen,
      //CONTINUE: ContinueFromSaveScreen
    }
    this.screen = this.screens.TITLE
    this.areSetup = false
  }
  async setup() {
    for (const screen of Object.values(this.screens)) {
      if (screen.isSetup) continue
      await screen.setup() //setup the option box values for all screens
      screen.isSetup = true
    }
    this.areSetup = true
  }
  async update(p) {
    if (!this.areSetup) {
      await this.setup()
    }
    this.screen.update(p) //show the option box for this screen
  }
  keyPressed(key) {
    if (!this.areSetup) return null //do we need everything to be setup to accept input?
    const nextScreen = this.screen.keyPressed(key);
    console.log(nextScreen)
    if (nextScreen && this.screens[nextScreen]) {
      this.screen = this.screens[nextScreen];
      return null
    }
    return null
  }
  resetScreens() {
    for (const [name, screen] of Object.entries(this.screens)) {
      if (typeof screen.reset === 'function') {
        screen.reset();
      }
    }
    this.areSetup = false
  }
}