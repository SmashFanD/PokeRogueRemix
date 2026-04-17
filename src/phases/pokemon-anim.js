import { globalScene } from "../global-scene.js";
import { BattlePhase } from "./battle.js";

export class PokemonAnimPhase extends BattlePhase {
  phaseName = "PokemonAnimPhase";
  /** The type of animation to play in this phase */
  key;
  /** The Pokemon to which this animation applies */
  pokemon;
  /** Any other field sprites affected by this animation */
  fieldAssets;

  constructor(key, pokemon, fieldAssets = []) {
    super();

    this.key = key;
    this.pokemon = pokemon;
    this.fieldAssets = fieldAssets;
  }

  start() {
    super.start();

    switch (this.key) {
      case PokemonAnimType.SUBSTITUTE_ADD:
        this.doSubstituteAddAnim();
        break;
      case PokemonAnimType.SUBSTITUTE_PRE_MOVE:
        this.doSubstitutePreMoveAnim();
        break;
      case PokemonAnimType.SUBSTITUTE_POST_MOVE:
        this.doSubstitutePostMoveAnim();
        break;
      case PokemonAnimType.SUBSTITUTE_REMOVE:
        this.doSubstituteRemoveAnim();
        break;
      default:
        this.end();
    }
  }

  doSubstituteAddAnim() {
    const substitute = this.pokemon.getTag(SubstituteTag);
    if (substitute == null) {
      this.end();
      return;
    }

    const getSprite = () => {
      const sprite = globalScene.addFieldSprite(
        this.pokemon.x + this.pokemon.getSprite().x,
        this.pokemon.y + this.pokemon.getSprite().y,
        `pkmn${this.pokemon.isPlayer() ? "__back" : ""}__sub`,
      );
      sprite.setOrigin(0.5, 1);
      globalScene.field.add(sprite);
      return sprite;
    };

    const [subSprite, subTintSprite] = [getSprite(), getSprite()];
    const subScale = this.pokemon.getSpriteScale() * (this.pokemon.isPlayer() ? 0.5 : 1);

    subSprite.setVisible(false);
    subSprite.setScale(subScale);
    subTintSprite.setTintFill(0xffffff);
    subTintSprite.setScale(0.01);

    if (this.pokemon.isPlayer()) {
      globalScene.field.bringToTop(this.pokemon);
    }

    globalScene.playSound("PRSFX- Transform");

    globalScene.tweens.add({
      targets: this.pokemon,
      duration: 500,
      x: this.pokemon.x + this.pokemon.getSubstituteOffset()[0],
      y: this.pokemon.y + this.pokemon.getSubstituteOffset()[1],
      alpha: 0.5,
      ease: "Sine.easeIn",
    });

    globalScene.tweens.add({
      targets: subTintSprite,
      delay: 250,
      scale: subScale,
      ease: "Cubic.easeInOut",
      duration: 500,
      onComplete: () => {
        subSprite.setVisible(true);
        globalScene.tweens.add({
          targets: subTintSprite,
          delay: 250,
          alpha: 0,
          ease: "Cubic.easeOut",
          duration: 1000,
          onComplete: () => {
            subTintSprite.destroy();
            substitute.sprite = subSprite;
            this.end();
          },
        });
      },
    });
  }

  doSubstitutePreMoveAnim() {
    if (this.fieldAssets.length !== 1) {
      this.end();
      return;
    }

    const subSprite = this.fieldAssets[0];
    if (subSprite === undefined) {
      this.end();
      return;
    }

    globalScene.tweens.add({
      targets: subSprite,
      alpha: 0,
      ease: "Sine.easeInOut",
      duration: 500,
    });

    globalScene.tweens.add({
      targets: this.pokemon,
      x: subSprite.x,
      y: subSprite.y,
      alpha: 1,
      ease: "Sine.easeInOut",
      delay: 250,
      duration: 500,
      onComplete: () => this.end(),
    });
  }

  doSubstitutePostMoveAnim() {
    if (this.fieldAssets.length !== 1) {
      this.end();
      return;
    }

    const subSprite = this.fieldAssets[0];
    if (subSprite === undefined) {
      this.end();
      return;
    }

    globalScene.tweens.add({
      targets: this.pokemon,
      x: subSprite.x + this.pokemon.getSubstituteOffset()[0],
      y: subSprite.y + this.pokemon.getSubstituteOffset()[1],
      alpha: 0.5,
      ease: "Sine.easeInOut",
      duration: 500,
    });

    globalScene.tweens.add({
      targets: subSprite,
      alpha: 1,
      ease: "Sine.easeInOut",
      delay: 250,
      duration: 500,
      onComplete: () => this.end(),
    });
  }

  doSubstituteRemoveAnim() {
    if (this.fieldAssets.length !== 1) {
      this.end();
      return;
    }

    const subSprite = this.fieldAssets[0];
    if (subSprite === undefined) {
      this.end();
      return;
    }

    const getSprite = () => {
      const sprite = globalScene.addFieldSprite(
        subSprite.x,
        subSprite.y,
        `pkmn${this.pokemon.isPlayer() ? "__back" : ""}__sub`,
      );
      sprite.setOrigin(0.5, 1);
      globalScene.field.add(sprite);
      return sprite;
    };

    const subTintSprite = getSprite();
    const subScale = this.pokemon.getSpriteScale() * (this.pokemon.isPlayer() ? 0.5 : 1);
    subTintSprite.setAlpha(0);
    subTintSprite.setTintFill(0xffffff);
    subTintSprite.setScale(subScale);

    globalScene.tweens.add({
      targets: subTintSprite,
      alpha: 1,
      ease: "Sine.easeInOut",
      duration: 500,
      onComplete: () => {
        subSprite.destroy();
        const flashTimer = globalScene.time.addEvent({
          delay: 100,
          repeat: 7,
          startAt: 200,
          callback: () => {
            globalScene.playSound("PRSFX- Substitute2.wav");

            subTintSprite.setVisible(flashTimer.repeatCount % 2 === 0);
            if (!flashTimer.repeatCount) {
              globalScene.tweens.add({
                targets: subTintSprite,
                scale: 0.01,
                ease: "Sine.cubicEaseIn",
                duration: 500,
              });

              globalScene.tweens.add({
                targets: this.pokemon,
                x: this.pokemon.x - this.pokemon.getSubstituteOffset()[0],
                y: this.pokemon.y - this.pokemon.getSubstituteOffset()[1],
                alpha: 1,
                ease: "Sine.easeInOut",
                delay: 250,
                duration: 500,
                onComplete: () => {
                  subTintSprite.destroy();
                  this.end();
                },
              });
            }
          },
        });
      },
    });
  }
}