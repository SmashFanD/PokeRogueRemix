import { globalScene } from "../global-scene.js";
import { Phase } from "../phase.js";

/**
 * Provides EXP to the player's party *without* doing any Pokemon defeated checks or queueing extraneous post-battle phases
 * Intended to be used as a more 1-off phase to provide exp to the party (such as during MEs), rather than cleanup a battle entirely
 */
export class PartyExpPhase extends Phase {
  phaseName = "PartyExpPhase";
  expValue
  useWaveIndexMultiplier
  pokemonParticipantIds

  // TODO: Document these using descriptions from `applyPartyExp`
  constructor(expValue, useWaveIndexMultiplier, pokemonParticipantIds) {
    super();

    this.expValue = expValue;
    this.useWaveIndexMultiplier = useWaveIndexMultiplier;
    this.pokemonParticipantIds = pokemonParticipantIds;
  }

  /**
   * Gives EXP to the party
   */
  start() {
    super.start();

    globalScene.applyPartyExp(this.expValue, false, this.useWaveIndexMultiplier, this.pokemonParticipantIds);

    this.end();
  }
}