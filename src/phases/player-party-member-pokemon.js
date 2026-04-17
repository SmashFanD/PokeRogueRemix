import { PartyMemberPokemonPhase } from "./party-member-pokemon.js";

export class PlayerPartyMemberPokemonPhase extends PartyMemberPokemonPhase {
  constructor(partyMemberIndex) {
    super(partyMemberIndex, true);
  }

  getPlayerPokemon() {
    return super.getPokemon();
  }
}