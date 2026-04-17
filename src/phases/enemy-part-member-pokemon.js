import { PartyMemberPokemonPhase } from "./party-member-pokemon.js";

export class EnemyPartyMemberPokemonPhase extends PartyMemberPokemonPhase {
  constructor(partyMemberIndex) {
    super(partyMemberIndex, false);
  }

  getEnemyPokemon() {
    return super.getPokemon();
  }
}