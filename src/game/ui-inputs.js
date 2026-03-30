import { Button } from "../enums/button.js";


export function UiInputs() {
  return {
    /**
   * @param key, the key that was pressed
   * @returns return the Type of button pressed based on the input
   */
    listenInputs(key) {
      const actions = {
        [Button.UP]: () => this.buttonNormal(Button.UP),
        [Button.DOWN]: () => this.buttonNormal(Button.DOWN),
        [Button.LEFT]: () => this.buttonNormal(Button.LEFT),
        [Button.RIGHT]: () => this.buttonNormal(Button.RIGHT),
        [Button.ACTION]: () => this.buttonNormal(Button.ACTION),
        [Button.CANCEL]: () => this.buttonNormal(Button.CANCEL),
        [Button.MENU]: () => this.buttonMenu(),
        [Button.STATS]: () => this.buttonGoToFilter(Button.STATS),
        [Button.CYCLE_SHINY]: () => this.buttonCycleOption(Button.CYCLE_SHINY),
        [Button.CYCLE_FORM]: () => this.buttonCycleOption(Button.CYCLE_FORM),
        [Button.CYCLE_GENDER]: () => this.buttonCycleOption(Button.CYCLE_GENDER),
        [Button.CYCLE_ABILITY]: () => this.buttonCycleOption(Button.CYCLE_ABILITY),
        [Button.CYCLE_NATURE]: () => this.buttonCycleOption(Button.CYCLE_NATURE),
        [Button.CYCLE_TERA]: () => this.buttonCycleOption(Button.CYCLE_TERA),
      };
      return actions;
    },

    buttonNormal(button) {
      globalScene.ui.processInput(button);
    },

    buttonStats(pressed) {
      // allow access to Button.STATS as a toggle for other elements
      for (const t of globalScene.getInfoToggles(true)) {
        t.toggleInfo(pressed);
      }
      // handle normal pokemon battle ui
      for (const p of globalScene.getField().filter(p => p?.isActive(true))) {
        p.toggleStats(pressed);
      }
    },

    buttonGoToFilter(button) {
      const whitelist = [StarterSelectUiHandler];
      const uiHandler = globalScene.ui?.getHandler();
      if (whitelist.some(handler => uiHandler instanceof handler)) {
        globalScene.ui.processInput(button);
      } else {
        this.buttonStats(true);
      }
    },

    buttonInfo(pressed) {
      if (globalScene.showMovesetFlyout) {
        for (const p of globalScene.getEnemyField().filter(p => p?.isActive(true))) {
          p.toggleFlyout(pressed);
        }
      }

      if (globalScene.showArenaFlyout) {
        globalScene.ui.processInfoButton(pressed);
      }
    },

    buttonMenu() {
      if (globalScene.disableMenu) {
        return;
      }
      switch (globalScene.ui?.getMode()) {
        case UiMode.MESSAGE: {
          const messageHandler = globalScene.ui.getHandler();
          if (!messageHandler.pendingPrompt || messageHandler.isTextAnimationInProgress()) {
            return;
          }
        }
        case UiMode.TITLE:
        case UiMode.COMMAND:
        case UiMode.MODIFIER_SELECT:
          globalScene.ui.setOverlayMode(UiMode.MENU);
          break;
        case UiMode.STARTER_SELECT:
          this.buttonTouch();
          break;
        case UiMode.MENU:
          globalScene.ui.revertMode();
          globalScene.playSound("ui/select");
          break;
        default:
          return;
      }
    },

    buttonCycleOption(button) {
      const whitelist = [
        StarterSelectUiHandler,
        SettingsUiHandler,
        SettingsDisplayUiHandler,
        SettingsAudioUiHandler,
      ];
      const uiHandler = globalScene.ui?.getHandler();
      if (whitelist.some(handler => uiHandler instanceof handler)) {
        globalScene.ui.processInput(button);
      } else if (button === Button.CYCLE_TERA) {
        this.buttonInfo(true);
      }
    }
  }
}