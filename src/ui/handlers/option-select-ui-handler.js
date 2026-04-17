import { UiMode } from "../../enums/ui-mode.js";
import { globalScene } from "../../global-scene.js";
import { AbstractOptionSelectUiHandler } from "./abstract-option-select.js";

export class OptionSelectHandler {
  cursorImg = globalScene.load.imgCursor
  cursorValue = 0
  container;
  textContainer;
  optionSelectBg;
  optionSelectText;
  optionSelectIcons;

  config;

  blockInput;

  scrollCursor = 0;
  fullCursor = 0;

  cursorObj;

  unskippedIndices = [];

  defaultTextStyle;
  textContent;
  constructor(config) {
    this.config = config
    this.background = (0, 0, this.getWindowWidth(), this.getWindowHeight())
  }
  getWindowHeight() {
    const textSize = this.config?.
    return ((this.config?.options?.length) + 1) * 20;
  }
  getWindowWidth() {
    return 64;
  }
}