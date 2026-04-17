import { globalScene } from "../global-scene.js";
import { Phase } from "../phase.js";

export class ReloadSessionPhase extends Phase {
  phaseName = "ReloadSessionPhase";
  systemDataStr;

  constructor(systemDataStr) {
    super();

    this.systemDataStr = systemDataStr;
  }

  start() {
    globalScene.ui.setMode(UiMode.SESSION_RELOAD);

    let delayElapsed = false;
    let loaded = false;

    globalScene.time.delayedCall(fixedInt(1500), () => {
      if (loaded) {
        this.end();
      } else {
        delayElapsed = true;
      }
    });

    globalScene.gameData.clearLocalData();

    (this.systemDataStr ? globalScene.gameData.initSystem(this.systemDataStr) : globalScene.gameData.loadSystem()).then(
      () => {
        if (delayElapsed) {
          this.end();
        } else {
          loaded = true;
        }
      },
    );
  }
}