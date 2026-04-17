import { globalScene } from "../global-scene.js";
import { PokemonPhase } from "./pokemon.js";

export class SelectTargetPhase extends PokemonPhase {
  phaseName = "SelectTargetPhase";
  constructor(fieldIndex) {
    super(fieldIndex);
  }

  start() {
    super.start();

    const turnCommand = globalScene.currentBattle.turnCommands[this.fieldIndex];
    const moveId = turnCommand?.move?.move;
    if (!moveId) {
      this.end();
      return;
    }

    // TODO: Move the logic for computing default targets here instead of `target-select-ui-handler`
    const move = allMoves[moveId];
    const fieldSide = globalScene.getField();

    const user = fieldSide[this.fieldIndex];
    const defaultTargets = undefined;

    globalScene.ui.setMode(
      UiMode.TARGET_SELECT,
      this.fieldIndex,
      move.id,
      (targets) => {
        globalScene.ui.setMode(UiMode.MESSAGE);
        // Find any tags blocking this target from being selected
        // TODO: Denest and make less jank

        // TODO: when would this occur?
        if (targets[0]) {
          const restrictingTag = user.getTargetRestrictingTag(moveId, fieldSide[targets[0]]);
          if (restrictingTag) {
            globalScene.phaseManager.queueMessage(restrictingTag.selectionDeniedText(user, moveId));
            targets = [];
          }
        }

        if (targets.length === 0) {
          globalScene.currentBattle.turnCommands[this.fieldIndex] = null;
          globalScene.phaseManager.unshiftNew("CommandPhase", this.fieldIndex);
        } else {
          turnCommand.targets = targets;
        }
        //keep this and change this later for use of items in battle
        //if (turnCommand.command === Command.BALL && this.fieldIndex) {
        //  globalScene.currentBattle.turnCommands[this.fieldIndex - 1].skip = true;
        //}
        this.end();
      },
      defaultTargets,
    );
  }
}