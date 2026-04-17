/**
 * Phase handling mid-battle form changes that do not occur in the Party modal
 * and do not show an evolution dialogue.
 */

import { globalScene } from "../global-scene.js";
import { BattlePhase } from "./battle.js";

// TODO: Rename as the term "quiet" can be confusing
export class QuietFormChangePhase extends BattlePhase {
  phaseName = "QuietFormChangePhase";

  pokemon;
  formChange;
  /** The Pokemon's prior name before changing forms. */
  preName;

  constructor(pokemon, formChange) {
    super();

    this.pokemon = pokemon;
    this.formChange = formChange;
  }

  async start() {
    super.start();

    this.preName = getPokemonNameWithAffix(this.pokemon);

    // Don't do anything if the user is already in the same form.
    if (this.pokemon.formIndex === this.pokemon.species.forms.findIndex(f => f.formKey === this.formChange.formKey)) {
      super.end();
      return;
    }

    if (!this.pokemon.visible) {
      await this.checkInactive();
      return;
    }

    if (this.pokemon.isActive(true)) {
      await this.playFormChangeTween();
    } else {
      await this.doChangeForm();
      this.showFormChangeTextAndEnd();
    }
  }

  /**
   * Helper function to show text upon changing forms and end the phase.
   * @remarks
   * Does not actually change the user's form.
   */
  showFormChangeTextAndEnd() {
    const { pokemon, formChange, preName } = this;
    const { ui } = globalScene;
    ui.showText(getSpeciesFormChangeMessage(pokemon, formChange, preName), null, () => this.end(), 1500);
  }

  /**
   * Handle queueing messages for form changing a currently invisible player Pokemon.
   */
  async checkInactive() {
    // End immediately for off-field enemy pokemon
    // TODO: This avoids actually doing the form change, is this intended?
    if (!this.pokemon.isPlayer() && !this.pokemon.isActive(true)) {
      super.end();
      return;
    }

    await this.doChangeForm();
    this.showFormChangeTextAndEnd();
  }

  /**
   * Wrapper function to queue effects related to a Pokemon changing forms.
   */
  async doChangeForm() {
    const { pokemon, formChange } = this;

    // TODO: This will have ordering issues with on lose abilities' trigger messages showing after this Phase ends
    // if any are given to a Pokemon with mid-battle form changes.
    // If this is desired later on, the animation/textual part of `QuietFormChangePhase` will need to be pulled out
    // into a separate Phase, though I doubt balence team will want to do this for a while...

    applyOnLoseAbAttrs({ pokemon });
    await pokemon.changeForm(formChange);
    applyPostFormChangeAbAttrs({ pokemon });
  }

  async playFormChangeTween() {
    const [pokemonTintSprite, pokemonFormTintSprite] = [this.getPokemonSprite(), this.getPokemonSprite()];

    // TODO: This is never deregistered
    this.pokemon.getSprite().on("animationupdate", (_anim, frame) => {
      if (frame.textureKey === pokemonTintSprite.texture.key) {
        pokemonTintSprite.setFrame(frame.textureFrame);
      } else {
        pokemonFormTintSprite.setFrame(frame.textureFrame);
      }
    });

    pokemonTintSprite // formatting
      .setAlpha(0)
      .setTintFill(0xffffff);
    pokemonFormTintSprite // formatting
      .setVisible(false)
      .setTintFill(0xffffff);

    globalScene.playSound("battle_anims/PRSFX- Transform");

    await playTween({
      targets: pokemonTintSprite,
      alpha: 1,
      duration: 1000,
      ease: "Cubic.easeIn",
    });

    this.pokemon.setVisible(false);
    await this.doChangeForm();

    pokemonFormTintSprite.setScale(0.01);
    const spriteKey = this.pokemon.getBattleSpriteKey();
    // TODO: Why do we play and then immediately stop the form tint sprite?
    // The thing isn't even visible anyways at this point in the code
    try {
      pokemonFormTintSprite.play(spriteKey).stop();
    } catch (err) {
      console.error(`Failed to play animation for ${spriteKey}`, err);
    }

    pokemonFormTintSprite.setVisible(true);
    globalScene.tweens.add({
      targets: pokemonTintSprite,
      delay: 250,
      scale: 0.01,
      ease: "Cubic.easeInOut",
      duration: 500,
      onComplete: () => pokemonTintSprite.destroy(),
    });
    await playTween({
      targets: pokemonFormTintSprite,
      delay: 250,
      scale: this.pokemon.getSpriteScale(),
      ease: "Cubic.easeInOut",
      duration: 500,
    });

    this.pokemon.setVisible(true);
    await playTween({
      targets: pokemonFormTintSprite,
      delay: 250,
      alpha: 0,
      ease: "Cubic.easeOut",
      duration: 1000,
    });
    pokemonTintSprite.setVisible(false);

    this.showFormChangeTextAndEnd();
  }

  getPokemonSprite() {
    const sprite = globalScene.addPokemonSprite(
      this.pokemon,
      this.pokemon.x + this.pokemon.getSprite().x,
      this.pokemon.y + this.pokemon.getSprite().y,
      "pkmn__sub",
    );
    sprite.setOrigin(0.5, 1);
    const spriteKey = this.pokemon.getBattleSpriteKey();
    // TODO: Move error handling elsewhere
    try {
      sprite.play(spriteKey).stop();
    } catch (err) {
      console.error(`Failed to play animation for ${spriteKey}`, err);
    }
    sprite.setPipeline(globalScene.spritePipeline, {
      tone: [0.0, 0.0, 0.0, 0.0],
      hasShadow: false,
      teraColor: getTypeRgb(this.pokemon.getTeraType()),
      isTerastallized: this.pokemon.isTerastallized,
    });
    ["spriteColors"].forEach(k => {
      if (this.pokemon.summonData.speciesForm) {
        k += "Base";
      }
    });
    globalScene.field.add(sprite);
    return sprite;
  }

  end() {
    // Autotomize's weight reduction is reset when form changing
    this.pokemon.removeTag(BattlerTagType.AUTOTOMIZED);
    super.end();
  }
}