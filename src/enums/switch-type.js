export const SwitchType = {
  /** Switchout specifically for when combat starts and the player is prompted if they will switch Pokemon */
  INITIAL_SWITCH: 0,
  /** Basic switchout where the Pokemon to switch in is selected */
  SWITCH: 1,
  /** Transfers stat stages and other effects from the returning Pokemon to the switched in Pokemon */
  BATON_PASS: 2,
  /** Transfers the returning Pokemon's Substitute to the switched in Pokemon */
  SHED_TAIL: 3,
  /** Force switchout to a random party member */
  FORCE_SWITCH: 4,
}