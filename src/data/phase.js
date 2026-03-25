export const MenuPhase = {
    TITLE_MENU: 0,
    OPTIONS: 1,
    INFO: 2,
    STARTER_SELECT: 3,
    SAVE_SELECT: 4
}
export const BattlePhase = {
    WAVE0: 0,
    WAVE_START: 1, //Retrieve necessary wave data and make pokemon appear
    WAVE_START_TRAINER: 2,
    WAVE_START_TRAINER_SEND_OUT: 3,
    TURN_POKEMON_SWITCH_OUT: 4,
    TURN_POKEMON_SWITCH_IN: 5,
    TURN_PRESTART: 6, //Call Turn check speed to get wich ability act first
    TURN_START: 7,
    TURN_CHECK_SPEED: 8,
    TURN_CHOICE_PRETURN_MOVEEND: 2, //if a move from this pokemon last turn has this effect (protect, bide...) then finish it
    TURN_CHOICE_PRETURN_STATUS: 3, //status activation
    TURN_CHOICE_PRETURN_ITEM: 4,
    TURN_CHOICE_PRETURN_ABILITY: 5,
    TURN_CHOICE: 55,
    TURN_CHOICE_ACTION: 6,
    TURN_EXECUTE_ACTION: 7,
    TURN_EXECUTE_END: 8,
    TURN_END: 9,

    WAVE_BUFF_MODIFIER_ADD: 10,
    TURN_POKEMON_FRIEND_ADD: 11,
    TURN_RUN_ATTEMPT: 12,
    BATTLE_START: 13,
    BATTLE_END: 14,
    BATTLE: 15,
    BERRY: 16,
    INTERLUDE: 17, //Phase where pokemon will be fully healed
    STATUS_EFFECT_CHECK: 18,
    CHECK_SWITCH: 19,
    TURN_COMMAND: 20,
    ANIM_ITEM: 21,
    ANIM_MOVE: 22,
    ANIM_SPECIAL: 23,
    DAMAGE_ANIM: 24,
    EVOLUTION: 25,
    EXPERIENCE: 26,
    LEVEL_UP: 27,
    FAINT: 28,
    DEFEATED: 29,
    GAME_OVER_LOST: 30,
    WEATHER_EFFECT:31,
    WAVE_VICTORY: 32,
    WAVE_TRAINER_VICTORY: 33,
    GO_TO_TITLE: 34,
    SWITCH_BIOME: 35,
    STAT_CHANGE: 36,
    SHOW_TRAINER_ENEMY: 37,
    SHOW_PARTY_EXP_GAIN: 38, //Exp gain text for non-active pokemon will be worked on at the end, as the choices are made
    SHINY: 39, //Same as above, no shiny are in for now
    SHOW_ABILITY: 39, //For the visual to be shown
    SELECT_TARGET: 40, //In case the game is not only solo
    SELECT_MODIFIER: 41,
    RESET_STATUS: 42,
    RELOAD_SESSION: 43, //Late
    FORM_CHANGE_MENU: 44,
    FORM_CHANGE_BATTLE: 45,  //When active pokemon change form during battle
    POST_TURN_STATUS_EFFECT: 46,
    POST_SUMMON_ACTIVATE_ABILITY: 47,
    POKEMON_HEAL: 48,
    PARTY_HEAL: 49,
    PARTY_EXP: 50,
    OBTAIN_STATUS_EFFECT: 51,
    NEXT_ENCOUNTER: 52,
    NEW_BIOME_ENCOUNTER: 53,
    NEW_BATTLE: 54,
    TURN_ACTION_SELECTED: 56,
    TURN_ACTION_EFFECT: 57,
    TURN_ACTION_CHARGE: 58,
    TURN_ACTION_START: 59,
    TURN_ACTION_END: 60,
    MONEY_REWARD: 61,
    MODIFIER_REWARD: 62,
    MESSAGE_PHASE: 63,
    LEARN_MOVE: 64,


}

export const DayCarePhase ={
    CHECK_EGG: 0,
    CHECK_SEND: 1,
    CHECK_RETRIEVE: 2,
}