export const Order = {
  TURN_START: 0,
  TURN_CHECK_SPD: 1, //Check Speed of all pokemon to get turn order
  TURN_CHOICE_PRETURN_MOVEEND: 2, //if a move from this pokemon last turn has this effect (protect, bide...) then finish it
  TURN_CHOICE_PRETURN_STATUS: 3, //status activation
  TURN_CHOICE_PRETURN_ITEM: 4,
  TURN_CHOICE_PRETURN_ABILITY: 5,
  TURN_CHOICE_ACTION: 6,
  TURN_EXECUTE_ACTION: 7,
  TURN_EXECUTE_END: 8,
  TURN_END: 9
}