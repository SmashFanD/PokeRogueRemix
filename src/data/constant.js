import { SpeciesId } from "../enums/species-id.js";

export const TRAINER_PARTY_MAX_SIZE = 6;

export const defaultStarterSpecies = [
  SpeciesId.BULBASAUR,
  SpeciesId.CHARMANDER,
  SpeciesId.SQUIRTLE,
];

export const RELEARN_MOVE = -1;
/** Moves that can only be learned with an evolve */
export const EVOLVE_MOVE = 0;