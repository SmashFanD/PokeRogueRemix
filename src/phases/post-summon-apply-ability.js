/**
 * Helper to {@linkcode PostSummonPhase} which applies abilities
 */
export class PostSummonActivateAbilityPhase extends PostSummonPhase {
  priority;
  passive;

  constructor(battlerIndex, priority, passive) {
    super(battlerIndex);
    this.priority = priority;
    this.passive = passive;
  }

  start() {
    // TODO: Check with Dean on whether or not passive must be provided to `this.passive`
    applyAbAttrs("PostSummonAbAttr", { pokemon: this.getPokemon(), passive: this.passive });

    this.end();
  }

  getPriority() {
    return this.priority;
  }
}