import { globalScene } from "../global-scene.js";
import { FieldPhase } from "./field.js";

export class PartyMemberPokemonPhase extends FieldPhase {
  partyMemberIndex;
  fieldIndex;
  player;

  constructor(partyMemberIndex, player) {
    super();

    this.partyMemberIndex = partyMemberIndex;
    this.fieldIndex = partyMemberIndex < globalScene.currentBattle.getBattlerCount() ? partyMemberIndex : -1;
    this.player = player;
  }

  getParty() {
    return this.player ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
  }

  getPokemon() {
    return this.getParty()[this.partyMemberIndex];
  }

  isPlayer() {
    return this.player;
  }
}