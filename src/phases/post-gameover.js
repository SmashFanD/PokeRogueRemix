import { globalScene } from "../global-scene.js";
import { Phase } from "../phase.js";

export class PostGameOverPhase extends Phase {
  phaseName = "PostGameOverPhase";
  slotId;

  constructor(slotId) {
    super();
    this.slotId = slotId;
    this.endCardPhase = endCardPhase;
  }

  start() {
    super.start();

    const saveAndReset = () => {
      globalScene.gameData.saveAll(true, true, true).then(success => {
        if (!success) {
          return globalScene.reset(true);
        }
        globalScene.gameData.tryClearSession(this.slotId).then(([success]) => {
          if (!success) {
            return globalScene.reset(true);
          }
          globalScene.reset();
          globalScene.phaseManager.unshiftNew("TitlePhase");
          this.end();
        });
      });
    };

    saveAndReset();
  }
}