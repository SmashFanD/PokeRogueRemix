import { globalScene } from "../global-scene.js";
import { PokemonPhase } from "./pokemon.js";

/**
 * Transforms a Pokemon into another Pokemon on the field.
 * Used for Transform (move) and Imposter (ability)
 */
export class PokemonTransformPhase extends PokemonPhase {
  phaseName = "PokemonTransformPhase";
  targetIndex;
  playSound;

  constructor(userIndex, targetIndex, playSound = false) {
    super(userIndex);

    this.targetIndex = targetIndex;
    this.playSound = playSound;
  }

  start() {
    const user = this.getPokemon();
    const target = globalScene.getField()[this.targetIndex];

    if (!target) {
      this.end();
      return;
    }

    user.summonData.speciesForm = target.getSpeciesForm();
    user.summonData.ability = target.getAbility().id;
    user.summonData.gender = target.getGender();

    // Power Trick's effect is removed after using Transform
    user.removeTag(BattlerTagType.POWER_TRICK);

    // Copy all stats (except HP)
    for (const s of EFFECTIVE_STATS) {
      user.setStat(s, target.getStat(s, false), false);
    }

    // Copy all stat stages
    for (const s of BATTLE_STATS) {
      user.setStatStage(s, target.getStatStage(s));
    }

    user.summonData.moveset = target.getMoveset().map(m => {
      if (m) {
        //Transformed pokemon cooldowns must be two times the normal cooldown
        return new PokemonMove(m.moveId, 0, 0, Math.min(m.getMove().pp, 5));
      }
      console.warn(`Transform: somehow iterating over a ${m} value when copying moveset!`);
      return new PokemonMove(MoveId.NONE);
    });

    // TODO: This should fallback to the target's original typing if none are left (from Burn Up, etc.)
    user.summonData.types = target.getTypes();

    const promises = [user.updateInfo()];

    if (this.playSound) {
      globalScene.playSound("battle_anims/PRSFX- Transform");
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("abilityTriggers:postSummonTransform", {
        pokemonNameWithAffix: getPokemonNameWithAffix(user),
        targetName: target.name,
      }),
    );

    promises.push(
      user.loadAssets(false).then(() => {
        user.playAnim();
        user.updateInfo();
        // If the new ability activates immediately, it needs to happen after all the transform animations
        user.setTempAbility(target.getAbility());
      }),
    );

    Promise.allSettled(promises).then(() => this.end());
  }
}