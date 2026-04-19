import { UiMode } from "./enums/ui-mode.js";
import { globalScene } from "./global-scene.js";
import { TitleUiHandler } from "./ui/handlers/title-ui-handler.js";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./utils.js";

const transitionModes = [
  UiMode.SAVE_SLOT,
  UiMode.PARTY,
  UiMode.SUMMARY,
  UiMode.STARTER_SELECT,
  UiMode.EVOLUTION_SCENE,
  UiMode.EGG_HATCH_SCENE,
  UiMode.EGG_LIST,
  UiMode.EGG_GACHA,
  UiMode.DAYCARE
];

const noTransitionModes = [
  UiMode.TITLE,
  UiMode.CONFIRM,
  UiMode.OPTION_SELECT,
  UiMode.MENU,
  UiMode.MENU_OPTION_SELECT,
  UiMode.SETTINGS,
  UiMode.SETTINGS_AUDIO,
  UiMode.SETTINGS_DISPLAY,
  UiMode.LOADING,
  UiMode.SESSION_RELOAD,
  UiMode.UNAVAILABLE,
  UiMode.AUTO_COMPLETE,
  UiMode.RUN_INFO,
];

//This will be responssible to add or remove UI elements, 
// use the add() method to add a name and its properties (including UI priority), 
// then draw them in UI_Draw in multiple for loop based on their priority (lower priority will be drawn first, so it will be in the background)

export const UiType = {
  TITLE: 0, //load things related to start
  OPTION_TITLE: 1, 
  OPTION_BATTLE: 2,
  BATTLE: 3, //load battle related and shop
  SHOP: 4
}
class UI {
  handlers
  handler
  constructor() {
    this.handlers = {
      TITLE: new TitleUiHandler(),
      //BATTLE: new BattleUiHandler(),
      //POKEMON_SHOP: new PokemonShopUiHandler(),
      //POKEMON_TEAM: new PokemonTeamUiHandler(),
      //MOVE: new MoveUiHandler(),
      //ITEM_SHOP: new ItemShopUiHandler(),
      //ABILITY: new AbilityShopUiHandler(),
      //ITEM: new ItemUiHandler(),
      //OPTION: new OptionUiHandler(),

    }
    this.handler = this.handlers.TITLE
  }
  getHandler(mode) {
    return this.handlers[mode]
  }
  setHandler(mode) {
    this.handler = getHandler(mode)
    this.handler.content = content
  }
  setMode(mode, ...content) {
    return this.setModeInternal(mode, content);
  }
  async setModeInternal(mode, content) {
    return new Promise(resolve => {
      const doSetMode = () => {
        this.setHandler(mode, content)
        resolve()
      };
      doSetMode()
    });
  }
  async update(p) {
    p.image(globalScene.imgBg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    await this.handler.update(p)
  }
  keyPressed(key) {
    const nextHandler = this.handler.keyPressed(key)
    if (nextHandler && this.handlers[nextHandler]) {
      if (nextHandler !== this.handler) this.handler.resetScreens()
      this.handler = this.handlers[nextHandler];
      return null
    }
    return null
  }
}

export const ui = new UI()

function getContentFromUiMode(mode) {
  switch (mode) {
    case UiMode.TITLE:
      let content = {
        logo: {SRC: "../../img/ui/logo.png", X: CANVAS_WIDTH / 2, Y: 8, ORIGIN_X: 0.5, ORIGIN_Y: 0},
        optionBox: { COLOR: [130, 20, 20], COLOR_OUTLINE: [185, 80, 80], SIZE_OUTLINE: 7,
          X: 1682, Y: 886,  SIZE_X: 234, SIZE_Y: 188
        },
        options: {TEXT: "",},
        hasCursor: true
      }
      return content;
    default:
  }
}