import { speciesStarterCosts } from "./balance.js";
import { defaultStarterSpecies } from "./data/constant.js";
import { allSpecies } from "./data/data-list.js";
import { pokemonPrevolutions } from "./data/pokemon-evolution.js";
import { AbilityAttr } from "./enums/ability-attr.js";
import { DexAttr } from "./enums/dex-attr.js";
import {  GameDataType } from "./enums/gamedatatype.js"
import { Nature } from "./enums/nature.js";
import { resetSettings } from "./system/settings/settings.js";
import { randItem } from "./utils.js";

function getDataTypeKey(gameDataType, slotId)  {
  switch (dataType) {
    case GameDataType.SYSTEM:
      return "data";
    case GameDataType.SESSION: {
      let ret = "sessionData";
      if (slotId) {
        ret += slotId;
      }
      return ret;
    }
  }
}
const systemShortKeys = {
  natureAttr: "$na",
  ivs: "$i",
  moveset: "$m",
  friendship: "$f",
  abilityAttr: "$a",
  valueReduction: "$vr",
};
export class GameData {
  constructor() {
    this.loadSettings();
    this.starterData = {};
    this.eggs = [];
    this.initDexData();
    this.initStarterData();
  }

  getSystemSaveData() {
    return {
      dexData: this.dexData,
      starterData: this.starterData,
      eggs: this.eggs.map(e => new EggData(e))
    }
  }

  saveSystem() {
    return new Promise<boolean>(resolve => {
      globalScene.ui.savingIcon.show();
      const data = this.getSystemSaveData();

      const maxIntAttrValue = 0x80000000;
      const systemData = JSON.stringify(data, (_k, v) =>
        typeof v === "bigint" ? (v <= maxIntAttrValue ? Number(v) : v.toString()) : v,
      );

      localStorage.setItem(`data_${loggedInUser?.username}`, encrypt(systemData));

      globalScene.ui.savingIcon.hide();

      resolve(true);
    })
  }

  loadSystem() {
    return new Promise<boolean>(resolve => {
      console.log("Client Session:", clientSessionId);

      if (!localStorage.getItem(`data_${loggedInUser?.username}`)) {
        return resolve(false);
      }

      let item = localStorage.getItem(`data_${loggedInUser?.username}`)
      if (item) this.initSystem(decrypt(item, bypassLogin)).then(resolve);
      else console.log("false Load", item)
 
    });
  }

  /**
   *
   * @param dataStr - The raw JSON string of the `SystemSaveData`
   * @returns - A new `GameData` instance initialized with the parsed `SystemSaveData`
   */
  static fromRawSystem(dataStr) {
    const gameData = new GameData(true);
    const systemData = GameData.parseSystemData(dataStr);
    gameData.initParsedSystem(systemData);
    return gameData;
  }

  /**
   * Initialize system data _after_ it has been parsed from JSON.
   * @param systemData The parsed `SystemSaveData` to initialize from
   */
  initParsedSystem(systemSaveData) {
    this.saveSetting(SettingKeys.Player_Gender, systemData.gender === PlayerGender.FEMALE ? 1 : 0);

    if (systemData.starterData) {
      this.starterData = systemData.starterData;
    } else {
      this.initStarterData();

      if (systemData["starterMoveData"]) {
        const starterMoveData = systemData["starterMoveData"];
        for (const s of Object.keys(starterMoveData)) {
          this.starterData[s].moveset = starterMoveData[s];
        }
      }

      if (systemData["starterEggMoveData"]) {
        const starterEggMoveData = systemData["starterEggMoveData"];
        for (const s of Object.keys(starterEggMoveData)) {
          this.starterData[s].eggMoves = starterEggMoveData[s];
        }
      }

      this.migrateStarterAbilities(systemData, this.starterData);

      const starterIds = Object.keys(this.starterData).map(s => Number.parseInt(s));
      for (const s of starterIds) {
        this.starterData[s].candyCount += systemData.dexData[s].caughtCount;
        this.starterData[s].candyCount += systemData.dexData[s].hatchedCount * 2;
        if (systemData.dexData[s].caughtAttr & DexAttr.SHINY) {
          this.starterData[s].candyCount += 4;
        }
      }
    }

    this.eggs = systemData.eggs ? systemData.eggs.map(e => e.toEgg()) : [];

    this.dexData = Object.assign(this.dexData, systemData.dexData);
    this.consolidateDexData(this.dexData);
    this.defaultDexData = null;
  }

  initSystem(systemDataStr, cachedSystemDataStr) {
    const { promise, resolve } = Promise.withResolvers();
    try {
      let systemData = GameData.parseSystemData(systemDataStr);

      if (cachedSystemDataStr) {
        const cachedSystemData = GameData.parseSystemData(cachedSystemDataStr);
        if (cachedSystemData.timestamp > systemData.timestamp) {
          console.debug("Use cached system");
          systemData = cachedSystemData;
          systemDataStr = cachedSystemDataStr;
        } else {
          this.clearLocalData();
        }
      }

      try {
        console.debug(
          GameData.parseSystemData(
            JSON.stringify(systemData, (_, vy) => (typeof v === "bigint" ? v.toString() : v)),
          ),
        );
      } catch (err) {
        console.debug("Attempt to log system data failed:", err);
      }

      localStorage.setItem(`data_${loggedInUser?.username}`, encrypt(systemDataStr));

      const lsItemKey = `runHistoryData_${loggedInUser?.username}`;
      const lsItem = localStorage.getItem(lsItemKey);
      if (!lsItem) {
        localStorage.setItem(lsItemKey, "");
      }

      this.initParsedSystem(systemData);
      resolve(true);
    } catch (err) {
      console.error(err);
      resolve(false);
    }
    return promise;
  }

  static parseSystemData(dataStr) {
    return JSON.parse(dataStr, (k, v) => {
      
      if (k === "eggs") {
        const ret = [];
        if (v === null) {
          v = [];
        }
        for (const e of v) {
          ret.push(new EggData(e));
        }
        return ret;
      }
      

      return k.endsWith("Attr") && !["natureAttr", "abilityAttr", "passiveAttr"].includes(k) ? BigInt(v ?? 0) : v;
    });
  }

  convertSystemDataStr(dataStr, shorten) {
    dataStr = dataStr.replace(/"trainerId":\d+/g, `"trainerId":${this.trainerId}`);
    dataStr = dataStr.replace(/"secretId":\d+/g, `"secretId":${this.secretId}`);
    const fromKeys = shorten ? Object.keys(systemShortKeys) : Object.values(systemShortKeys);
    const toKeys = shorten ? Object.values(systemShortKeys) : Object.keys(systemShortKeys);
    for (const k in fromKeys) {
      dataStr = dataStr.replace(new RegExp(`${fromKeys[k].replace("$", "\\$")}`, "g"), toKeys[k]);
    }

    return dataStr;
  }

  clearLocalData() {
    localStorage.removeItem(`data_${loggedInUser?.username}`);
    for (let s = 0; s < 5; s++) {
      localStorage.removeItem(`sessionData${s ? s : ""}_${loggedInUser?.username}`);
    }
  }

  /**
   * Saves a setting to localStorage
   * @param setting string ideally of SettingKeys
   * @param valueIndex index of the setting's option
   * @returns true
   */
  saveSetting(settingStr, valueIndex) {
    let settings = {};
    if (localStorage.hasOwnProperty("settings")) {
      const item = localStorage.getItem("settings")
      if (item) settings = JSON.parse(item)
    }
    setSetting(settingStr, valueIndex);

    settings[settingStr] = valueIndex;
    settings["gameVersion"] = globalScene.game.config.gameVersion;

    localStorage.setItem("settings", JSON.stringify(settings));

    return true;
  }

  /**
   * Loads Settings from local storage if available
   * @returns true if succesful, false if not
   */
  loadSettings() {
    resetSettings();

    if (!localStorage.hasOwnProperty("settings")) {
      return false;
    }
    let settings = {}
    const item = localStorage.getItem("settings")
    if (item) settings = JSON.parse(item)
    
    applySettingsVersionMigration(settings);

    for (const setting of Object.keys(settings)) {
      setSetting(setting, settings[setting]);
    }

    return true;
  }

  getSessionSaveData() {
    return {
      party: globalScene.getPlayerParty().map(p => new PokemonData(p)),
      enemyParty: globalScene.getEnemyParty().map(p => new PokemonData(p)),
      modifiers: globalScene.findModifiers(() => true).map(m => new PersistentModifierData(m, true)),
      enemyModifiers: globalScene.findModifiers(() => true, false).map(m => new PersistentModifierData(m, false)),
      arena: new ArenaData(globalScene.arena),
      money: Math.floor(globalScene.money),
      waveIndex: globalScene.currentBattle.waveIndex,
      battleType: globalScene.currentBattle.battleType,
      trainer:
        globalScene.currentBattle.battleType === BattleType.TRAINER
          ? new TrainerData(globalScene.currentBattle.trainer)
          : null,
      playerFaints: globalScene.arena.playerFaints,
    };
  }

  async getSession(slotId) {
    // Check local storage for the cached session data
    if (localStorage.getItem(getSaveDataLocalStorageKey(slotId))) {
      const sessionData = localStorage.getItem(getSaveDataLocalStorageKey(slotId));
      if (!sessionData) {
        console.error("No session data found!");
        return;
      }
      return this.parseSessionData(decrypt(sessionData));
    }
    return false;
  }

  /**
   * Load stored session data and re-initialize the game with its contents.
   * @param slotIndex - The 0-indexed position of the save slot to load.
   *   Values `< 0` are considered invalid.
   * @returns A Promise that resolves with whether the session load succeeded
   * (i.e. whether a save in the given slot exists)
   */
  async loadSession(slotIndex) {
    const sessionData = await this.getSession(slotIndex);
    if (!sessionData) {
      return false;
    }
    this.initSessionFromData(sessionData);
    return true;
  }

  /**
   * @param fromSession - The SessionType.
   * @returns A Promise
   */
  async initSessionFromData(fromSession) {
    try {
      console.debug(
        this.parseSessionData(JSON.stringify(fromSession, (_, v) => (typeof v === "bigint" ? v.toString() : v))),
      );
    } catch (err) {
      console.debug("Attempt to log session data failed: ", err);
    }

    const loadPokemonAssets = [];

    const party = globalScene.getPlayerParty();
    party.splice(0, party.length);

    for (const p of fromSession.party) {
      const pokemon = p.toPokemon();
      pokemon.setVisible(false);
      loadPokemonAssets.push(pokemon.loadAssets(false));
      party.push(pokemon);
    }
    globalScene.money = Math.floor(fromSession.money || 0);
    globalScene.updateMoneyText();

    globalScene.newArena(fromSession.arena.biome, fromSession.playerFaints);

    const battle = globalScene.newBattle(fromSession);
    const { battleType } = battle;
    battle.enemyLevels = fromSession.enemyParty.map(p => p.level);

    globalScene.arena.init();

    fromSession.enemyParty.forEach((enemyData, e) => {
      const enemyPokemon = enemyData.toPokemon(
        battleType,
        e
      );
      battle.enemyParty[e] = enemyPokemon;
      if (battleType === BattleType.WILD) {
        battle.seenEnemyPartyMemberIds.add(enemyPokemon.id);
      }

      loadPokemonAssets.push(enemyPokemon.loadAssets());
    });

    globalScene.arena.weather = fromSession.arena.weather;
    globalScene.arena.eventTarget.dispatchEvent(
      new WeatherChangedEvent(
        WeatherType.NONE,
        globalScene.arena.weather?.weatherType,
        globalScene.arena.weather?.turnsLeft,
        globalScene.arena.weather?.maxDuration,
      ),
    );

    globalScene.arena.terrain = fromSession.arena.terrain;
    globalScene.arena.eventTarget.dispatchEvent(
      new TerrainChangedEvent(
        TerrainType.NONE,
        globalScene.arena.terrain?.terrainType,
        globalScene.arena.terrain?.turnsLeft,
        globalScene.arena.terrain?.maxDuration,
      ),
    );

    globalScene.arena.tags = fromSession.arena.tags;
    if (globalScene.arena.tags) {
      for (const tag of globalScene.arena.tags) {
        if (tag instanceof EntryHazardTag) {
          const { tagType, side, turnCount, maxDuration, layers, maxLayers } = tag;
          globalScene.arena.eventTarget.dispatchEvent(
            new TagAddedEvent(tagType, side, turnCount, maxDuration, layers, maxLayers),
          );
        } else {
          globalScene.arena.eventTarget.dispatchEvent(
            new TagAddedEvent(tag.tagType, tag.side, tag.turnCount, tag.maxDuration),
          );
        }
      }
    }

    globalScene.arena.positionalTagManager.tags = fromSession.arena.positionalTags.map(tag => loadPositionalTag(tag));

    if (globalScene.modifiers.length > 0) {
      console.warn("Existing modifiers not cleared on session load, deleting...");
      globalScene.modifiers = [];
    }
    for (const modifierData of fromSession.modifiers) {
      const modifier = modifierData.toModifier(Modifier[modifierData.className]);
      if (modifier) {
        globalScene.addModifier(modifier, true);
      }
    }
    globalScene.updateModifiers(true);

    for (const enemyModifierData of fromSession.enemyModifiers) {
      const modifier = enemyModifierData.toModifier(Modifier[enemyModifierData.className]);
      if (modifier) {
        globalScene.addEnemyModifier(modifier, true);
      }
    }

    globalScene.updateModifiers(false);

    await Promise.all(loadPokemonAssets);
  }

  /**
   * Delete the session data at the given slot when overwriting a save file
   * For deleting the session of a finished run, use {@linkcode tryClearSession}
   * @param slotId the slot to clear
   * @returns Promise with result `true` if the session was deleted successfully, `false` otherwise
   */
  deleteSession(slotId) {
    return new Promise<boolean>(resolve => {
      localStorage.removeItem(getSaveDataLocalStorageKey(slotId));
      return resolve(true);
    })
  }


  /**
   * Attempt to clear session data after the end of a run
   * After session data is removed, attempt to update user info so the menu updates
   * To delete an unfinished run instead, use {@linkcode deleteSession}
   */
  async tryClearSession(slotId) {
    let result = [false, false];

    localStorage.removeItem(getSaveDataLocalStorageKey(slotId));
    result = [true, true];

    await updateUserInfo();

    return result;
  }

  parseSessionData(dataStr) {
    // TODO: Add `null`/`undefined` to the corresponding type signatures for this
    // (or prevent them from being null)
    // If the value is able to *not exist*, it should say so in the code
    const sessionData = JSON.parse(dataStr, (k, v) => {
      // TODO: Move this to occur _after_ migrate scripts (and refactor all non-assignment duties into migrate scripts)
      // This should ideally be just a giant assign block
      switch (k) {
        case "party":
        case "enemyParty": {
          const ret = [];
          for (const pd of v ?? []) {
            ret.push(new PokemonData(pd));
          }
          return ret;
        }

        case "trainer":
          return v ? new TrainerData(v) : null;

        case "modifiers":
        case "enemyModifiers": {
          const re = [];
          for (const md of v ?? []) {
            ret.push(new PersistentModifierData(md, k === "modifiers"));
          }
          return ret;
        }
        case "arena":
          return new ArenaData(v);
        default:
          return v;
      }
    });

    applySessionVersionMigration(sessionData);

    return sessionData;
  }

  saveAll(skipVerification, useCachedSession, useCachedSystem) {
    return new Promise<boolean>(resolve => {
      executeIf(!skipVerification, updateUserInfo).then(success => {
        if (success != null && !success) {
          return resolve(false);
        }
        globalScene.ui.savingIcon.show();
        const item = localStorage.getItem(`sessionData${globalScene.sessionSlotId ? globalScene.sessionSlotId : ""}_${loggedInUser?.username}`)
        const sessionData = useCachedSession
          ? this.parseSessionData(decrypt(localStorage.getItem(item))) : this.getSessionSaveData();
        const maxIntAttrValue = 0x80000000;
        const systemData = useCachedSystem
          ? GameData.parseSystemData(decrypt(localStorage.getItem(`data_${loggedInUser?.username}`)))
          : this.getSystemSaveData();
        const request = {
          system: systemData,
          session: sessionData,
          sessionSlotId: globalScene.sessionSlotId,
          clientSessionId,
        };

        localStorage.setItem(
          `data_${loggedInUser?.username}`,
          encrypt(
            JSON.stringify(systemData, (_k, v) =>
              typeof v === "bigint" ? (v <= maxIntAttrValue ? Number(v) : v.toString()) : v,
            ),
          ),
        );
        localStorage.setItem(
          `sessionData${globalScene.sessionSlotId ? globalScene.sessionSlotId : ""}_${loggedInUser?.username}`,
          encrypt(JSON.stringify(sessionData)),
        );

        console.debug("Session data saved!");

        globalScene.ui.savingIcon.hide();
        resolve(success);
      })
    })
  }

  initDexData() {
    const data = {};

    for (const species of allSpecies) {
      data[species.speciesId] = {
        natureAttr: 0,
        ivs: [0, 0, 0, 0, 0, 0]
      };
    }

    const defaultStarterAttr =
      DexAttr.NON_SHINY | DexAttr.MALE | DexAttr.FEMALE | DexAttr.DEFAULT_FORM;

    const defaultStarterNatures = [];

    const neutralNatures = [Nature.HARDY, Nature.DOCILE, Nature.SERIOUS, Nature.BASHFUL, Nature.QUIRKY];
    for (const _ of defaultStarterSpecies) {
      defaultStarterNatures.push(randItem(neutralNatures));
    }

    for (let ds = 0; ds < defaultStarterSpecies.length; ds++) {
      const entry = data[defaultStarterSpecies[ds]];
      entry.natureAttr = 1 << (defaultStarterNatures[ds] + 1);
      for (const i in entry.ivs) {
        entry.ivs[i] = 0;
      }
    }

    this.defaultDexData = { ...data };
    this.dexData = data;
  }

  initStarterData() {
    const starterData = {};

    const starterSpeciesIds = Object.keys(speciesStarterCosts).map(k => Number.parseInt(k));

    for (const speciesId of starterSpeciesIds) {
      starterData[speciesId] = {
        moveset: null,
        abilityAttr: defaultStarterSpecies.includes(speciesId) ? AbilityAttr.ABILITY_1 : 0,
      };
    }

    this.starterData = starterData;
  }

  /**
   *
   * @param pokemon
   * @param incrementCount
   * @param fromEgg
   * @param showMessage
   * @returns `true` if Pokemon catch unlocked a new starter, `false` if Pokemon catch did not unlock a starter
   */
  setPokemonCaught(pokemon, showMessage) {
    return this.setPokemonSpeciesCaught(pokemon, pokemon.species, showMessage);
  }

  /**
   *
   * @param pokemon
   * @param species
   * @param incrementCount
   * @param fromEgg
   * @param showMessage
   * @returns `true` if Pokemon catch unlocked a new starter, `false` if Pokemon catch did not unlock a starter
   */
  setPokemonSpeciesCaught(
    pokemon,
    species,
    showMessage,
  ) {
    return new Promise<boolean>(resolve => {
      const dexEntry = this.dexData[species.speciesId];
      const formIndex = pokemon.formIndex;

      // If the caught form is a battleform, we want to also mark the base form as caught.
      // This snippet assumes that the base form has formIndex equal to 0, which should be
      // always true except for the case of Urshifu.
      const formKey = pokemon.getFormKey();

      // Unlock ability
      if (speciesStarterCosts.hasOwnProperty(species.speciesId)) {
        this.starterData[species.speciesId].abilityAttr |=
          pokemon.abilityIndex !== 1 || pokemon.species.ability2
            ? 1 << pokemon.abilityIndex
            : AbilityAttr.ABILITY_HIDDEN;
      }

      // Unlock nature
      dexEntry.natureAttr |= 1 << (pokemon.nature + 1);

      const hasPrevolution = pokemonPrevolutions.hasOwnProperty(species.speciesId);

      if (!hasPrevolution) {
          //should reduce starter cost directly instead of adding candy
          this.addStarterCandy(species.speciesId, 1 * shinyBonus * eggOrBossBonus);
      }

      const checkPrevolution = (newStarter) => {
        if (hasPrevolution) {
          const prevolutionSpecies = pokemonPrevolutions[species.speciesId];
          this.setPokemonSpeciesCaught(
            pokemon,
            getPokemonSpecies(prevolutionSpecies),
            showMessage,
          ).then(result => resolve(result));
        } else {
          resolve(newStarter);
        }
      };

      if (speciesStarterCosts.hasOwnProperty(species.speciesId)) {
        //should check if pokemon has its cost reduced instead of check for message
        if (!showMessage) {
          resolve(true);
          return;
        }
        globalScene.playSound("level_up_fanfare");
        globalScene.ui.showText(
          i18next.t("battle:addedAsAStarter", { pokemonName: species.name }),
          null,
          () => checkPrevolution(true),
          null,
          true,
        );
      } else {
        checkPrevolution(false);
      }
    });
  }

  /**
   * Unlocks the given {@linkcode Nature} for a {@linkcode PokemonSpecies} and its prevolutions.
   * Will fail silently if root species has not been unlocked
   */
  unlockSpeciesNature(species, nature) {
    //recursively unlock nature for species and prevolutions
    const _unlockSpeciesNature = (speciesId) => {
      this.dexData[speciesId].natureAttr |= 1 << (nature + 1);
      if (pokemonPrevolutions.hasOwnProperty(speciesId)) {
        _unlockSpeciesNature(pokemonPrevolutions[speciesId]);
      }
    };
    _unlockSpeciesNature(species.speciesId);
  }

  updateSpeciesDexIvs(speciesId, ivs) {
    let dexEntry;
    do {
      dexEntry = globalScene.gameData.dexData[speciesId];
      const dexIvs = dexEntry.ivs;
      for (let i = 0; i < dexIvs.length; i++) {
        if (dexIvs[i] < ivs[i]) {
          dexIvs[i] = ivs[i];
        }
      }
    } while (pokemonPrevolutions.hasOwnProperty(speciesId) && (speciesId = pokemonPrevolutions[speciesId]));
  }

  getSpeciesDefaultDexAttr(species) {
    let ret = 0n;
    const dexEntry = this.dexData[species.speciesId];
    const attr = dexEntry.caughtAttr;
    ret |= attr & DexAttr.NON_SHINY || !(attr & DexAttr.SHINY) ? DexAttr.NON_SHINY : DexAttr.SHINY;
  
    ret |= attr & DexAttr.MALE || !(attr & DexAttr.FEMALE) ? DexAttr.MALE : DexAttr.FEMALE;
    ret |= this.getFormAttr(this.getFormIndex(attr));
    return ret;
  }

  getSpeciesDexAttrProps(_species, dexAttr) {
    const shiny = !(dexAttr & DexAttr.NON_SHINY);
    const female = !(dexAttr & DexAttr.MALE);
    
    const formIndex = this.getFormIndex(dexAttr);

    return {
      shiny,
      female,
      formIndex,
    };
  }

  getStarterSpeciesDefaultAbilityIndex(species, abilityAttr) {
    abilityAttr ??= this.starterData[species.speciesId].abilityAttr;
    return abilityAttr & AbilityAttr.ABILITY_1 ? 0 : !species.ability2 || abilityAttr & AbilityAttr.ABILITY_2 ? 1 : 2;
  }

  getSpeciesDefaultNature(species, dexEntry) {
    dexEntry ??= this.dexData[species.speciesId];
    for (let n = 0; n < 25; n++) {
      if (dexEntry.natureAttr & (1 << (n + 1))) {
        return n;
      }
    }
    return 0;
  }

  getSpeciesDefaultNatureAttr(species) {
    return 1 << this.getSpeciesDefaultNature(species);
  }

  getNaturesForAttr(natureAttr = 0) {
    const ret = [];
    for (let n = 0; n < 25; n++) {
      if (natureAttr & (1 << (n + 1))) {
        ret.push(n);
      }
    }
    return ret;
  }

  getSpeciesStarterValue(speciesId) {
    const baseValue = speciesStarterCosts[speciesId];
    let value = baseValue;

    const decrementValue = (value) => {
      if (value > 1) {
        value--;
      } else {
        value /= 2;
      }
      return value;
    };

    for (let v = 0; v < this.starterData[speciesId].valueReduction; v++) {
      value = decrementValue(value);
    }

    const cost = new NumberHolder(value);

    return cost.value;
  }

  getFormIndex(attr) {
    if (!attr || attr < DexAttr.DEFAULT_FORM) {
      return 0;
    }
    let f = 0;
    while (!(attr & this.getFormAttr(f))) {
      f++;
    }
    return f;
  }

  getFormAttr(formIndex) {
    return BigInt(1) << BigInt(7 + formIndex);
  }

  consolidateDexData(dexData) {
    for (const k of Object.keys(dexData)) {
      const entry = dexData[k];
      if (!entry.hasOwnProperty("natureAttr") || (!entry.natureAttr)) {
        entry.natureAttr = this.defaultDexData?.[k].natureAttr || 1 << randInt(25, 1);
      }
    }
  }
}

/**
 * Obtain the local storage key corresponding to a given save slot.
 * @param slotId - The numerical save slot ID
 * @throws {Error}
 * Throws if `slotId < 0` (which likely indicates an invalid slot passed from the title screen)
 * @returns The local storage key used to access the save data for the given slot.
 */
export function getSaveDataLocalStorageKey(slotId) {
  if (slotId < 0) {
    throw new Error("Cannot access negative save slot ID from localstorage");
  }

  return `sessionData${slotId || ""}_${loggedInUser?.username}`;
}