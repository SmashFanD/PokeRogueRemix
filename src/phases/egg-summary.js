import { globalScene } from "../global-scene.js";
import { Phase } from "../phase.js";

/**
 * Class that represents the egg summary phase
 * It does some of the function for updating egg data
 * Phase is handled mostly by the egg-hatch-scene-handler UI
 */
export class EggSummaryPhase extends Phase {
  phaseName = "EggSummaryPhase";
  constructor(eggHatchData) {
    super();
    this.eggHatchData = eggHatchData;
  }

  start() {
    super.start();

    // updates next pokemon once the current update has been completed
    const updateNextPokemon = (i) => {
      if (i >= this.eggHatchData.length) {
        globalScene.ui.setModeForceTransition(UiMode.EGG_HATCH_SUMMARY, this.eggHatchData).then(() => {
          globalScene.fadeOutBgm(undefined, false);
        });
      } else {
        this.eggHatchData[i].setDex();
        this.eggHatchData[i].updatePokemon().then(() => {
          if (i < this.eggHatchData.length) {
            updateNextPokemon(i + 1);
          }
        });
      }
    };
    updateNextPokemon(0);
  }

  end() {
    this.eggHatchData.forEach(data => {
      data.pokemon?.destroy();
    });
    this.eggHatchData = [];
    globalScene.time.delayedCall(250, () => globalScene.setModifiersVisible(true));
    globalScene.ui.setModeForceTransition(UiMode.MESSAGE).then(() => {
      super.end();
    });
  }
}