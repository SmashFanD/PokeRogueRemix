import { globalScene } from "../global-scene.js";
import { PokemonPhase } from "./pokemon.js";

export class PostTurnStatusEffectPhase extends PokemonPhase {
  phaseName = "PostTurnStatusEffectPhase";
  constructor(battlerIndex) {
    super(battlerIndex);
  }

  start() {
    const pokemon = this.getPokemon();
    if (!pokemon?.isActive(true) || !pokemon.status?.isPostTurn() || pokemon.switchOutStatus) {
      this.end();
      return;
    }

    pokemon.status.incrementTurn();
    const cancelled = new BooleanHolder(false);
    applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, cancelled });
    applyAbAttrs("BlockStatusDamageAbAttr", { pokemon, cancelled });

    if (cancelled.value) {
      this.end();
      return;
    }

    globalScene.phaseManager.queueMessage(
      getStatusEffectActivationText(pokemon.status.effect, getPokemonNameWithAffix(pokemon)),
    );

    const damage = new NumberHolder(0);
    switch (pokemon.status.effect) {
      case StatusEffect.POISON:
        damage.value = toDmgValue(pokemon.getMaxHp() / 10);
        break;
      case StatusEffect.TOXIC:
        damage.value = toDmgValue((pokemon.getMaxHp() * pokemon.status.toxicTurnCount * 0.1 + 1) / 10);
        break;
      case StatusEffect.BURN:
        damage.value = toDmgValue(pokemon.getMaxHp() / 20);
        applyAbAttrs("ReduceBurnDamageAbAttr", { pokemon, burnDamage: damage });
        break;
    }

    if (damage.value) {
      // Set preventEndure flag to avoid pokemon surviving thanks to focus band, sturdy, endure ...
      // TODO: Why doesn't this call `damageAndUpdate`?
      globalScene.damageNumberHandler.add(this.getPokemon(), pokemon.damage(damage.value, false, true));
      pokemon.updateInfo();
      applyAbAttrs("PostDamageAbAttr", { pokemon, damage: damage.value });
    }
    new CommonBattleAnim(CommonAnim.POISON + (pokemon.status.effect - 1), pokemon).play(false, () => this.end());
  }

  end() {
    super.end();
  }
}