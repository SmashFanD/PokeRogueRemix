import { globalScene } from "./global-scene.js";

export let loggedInUser = null
export const clientSessionId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" //randomString(32)

export async function updateUserInfo() {
  loggedInUser = {
    username: "SmashFan",
    lastSessionSlot: -1
  };
  let lastSessionSlot = -1;
  for (let s = 0; s < 5; s++) {
    if (localStorage.getItem(`sessionData${s || ""}_${loggedInUser.username}`)) {
      lastSessionSlot = s;
      break;
    }
  }
  loggedInUser.lastSessionSlot = lastSessionSlot;
  return [true, 200];
}

//this may not need to be a class?
class SaveData {
    forceTitleCleanUp = false;

    checkTitleCleanUp() {
        if (!this.forceTitleCleanUp) return false;
        return true;
    }

    doSave() {
        localStorage.setItem('PokeRogueRemix', JSON.stringify(globalScene));
    }

    getSave() {
        const data = localStorage.getItem('PokeRogueRemix');
        if (data) {
            globalScene = JSON.parse(data);
            return true
        }
        return null
    }

    saveStarter() {
        const saveData = {};
        localStorage.setItem('starterSceneSave', JSON.stringify(saveData));
    }

    getStarterSave() {
        const savedData = localStorage.getItem('starterSceneSave');
        if (savedData) {
            const data = JSON.parse(savedData);
            return {};
        }
        return null;
    }

    saveBattle() {
        this.forceTitleCleanUp = true;
        const saveData = {};
        localStorage.setItem('starterSceneSave', JSON.stringify(saveData));
    }

    getBattleSave() {
        const savedData = localStorage.getItem('starterSceneSave');
        if (savedData) {
            const data = JSON.parse(savedData);
            return {};
        }
        return null;
    }
}

export const saveData = new SaveData()