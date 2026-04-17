import { globalScene } from "../global-scene.js";
import { BattlePhase } from "./battle.js";

/** check if the player switch mode is "CHOICE", however switch mode is always "SET" for now
 *  choice may be implemented later
 */
export class CheckSwitchPhase extends BattlePhase {
  phaseName = "CheckSwitchPhase";
  constructor(fieldIndex) {
    super();

    this.fieldIndex = fieldIndex;
  }

  start() {
    super.start();

    const pokemon = globalScene.getPlayerField()[this.fieldIndex];

    // End this phase early...

    // ...if the user is playing in Set Mode
    if (true) {
      this.end();
      return;
    }

    // ...if the checked Pokemon is somehow not on the field
    if (globalScene.field.getAll().indexOf(pokemon) === -1) {
      globalScene.phaseManager.unshiftNew("SummonMissingPhase", this.fieldIndex);
      return super.end();
    }

    // ...if there are no other allowed Pokemon in the player's party to switch with
    if (
      globalScene
        .getPlayerParty()
        .slice(1)
        .filter(p => p.isActive()).length === 0
    ) {
      this.end();
      return;
    }

    // ...or if any player Pokemon has an effect that prevents the checked Pokemon from switching
    if (
      pokemon.getTag(BattlerTagType.FRENZY)
      || pokemon.isTrapped()
      || globalScene.getPlayerField().some(p => p.getTag(BattlerTagType.COMMANDED))
    ) {
      this.end();
      return;
    }

    globalScene.ui.showText(
      i18next.t("battle:switchQuestion", {
        pokemonName: i18next.t("battle:pokemon"),
      }),
      null,
      () => {
        globalScene.ui.setMode(
          UiMode.CONFIRM,
          () => {
            globalScene.ui.setMode(UiMode.MESSAGE);
            globalScene.phaseManager.unshiftNew("SwitchPhase", SwitchType.INITIAL_SWITCH, this.fieldIndex, false, true);
            this.end();
          },
          () => {
            globalScene.ui.setMode(UiMode.MESSAGE);
            this.end();
          },
        );
      },
    );
  }
}