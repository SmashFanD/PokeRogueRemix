import { globalScene } from "../global-scene.js";
import { FieldPhase } from "./field.js";

export class BerryPhase extends FieldPhase {
  phaseName = "BerryPhase";
  start() {
    super.start();

    this.executeForAll(pokemon => {
      this.eatBerries(pokemon);
      applyAbAttrs("CudChewConsumeBerryAbAttr", { pokemon });
    });

    this.end();
  }

  /**
   * Need Rework, check if pkmn has a usable berry and eat it
   */
  eatBerries(pokemon) {
    const hasUsableBerry = !!globalScene.findModifier(
      m => m instanceof BerryModifier && m.shouldApply(pokemon),
      pokemon.isPlayer(),
    );

    if (!hasUsableBerry) {
      return;
    }

    const cancelled = new BooleanHolder(false);
    pokemon.getOpponents().forEach(opp => applyAbAttrs("PreventBerryUseAbAttr", { pokemon: opp, cancelled }));
    if (cancelled.value) {
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:preventBerryUse", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      );
      return;
    }

    globalScene.phaseManager.unshiftNew(
      "CommonAnimPhase",
      pokemon.getBattlerIndex(),
      pokemon.getBattlerIndex(),
      CommonAnim.USE_ITEM,
    );

    //Since only one item can be given to a pokemon, edit the apply modifier function
    for (const berryModifier of globalScene.applyModifiers(BerryModifier, pokemon.isPlayer(), pokemon)) {
      // No need to track berries being eaten; already done inside applyModifiers
      if (berryModifier.consumed) {
        berryModifier.consumed = false;
        pokemon.loseHeldItem(berryModifier);
      }
      globalScene.eventTarget.dispatchEvent(new BerryUsedEvent(berryModifier));
    }
    globalScene.updateModifiers(pokemon.isPlayer());

    // AbilityId.CHEEK_POUCH only works once per round of nom noms
    applyAbAttrs("HealFromBerryUseAbAttr", { pokemon });
  }
}