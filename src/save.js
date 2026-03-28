function SaveData() {
    return {
        forceTitleCleanUp: false,
        checkTitleCleanUp() {
            if (!this.forceTitleCleanUp) return false
            return true
        },
        saveTitle(selectedMusic, bgmForced) {
            console.log(selectedMusic, bgmForced)
            const saveData = {
                selectedMusic,
                bgmForced
            };
            console.log(saveData)
            localStorage.setItem('titleSceneSave', JSON.stringify(saveData));
        },
        getTitleSave() {
            const savedData = localStorage.getItem('titleSceneSave');
            if (savedData) {
                const data = JSON.parse(savedData);
                return {
                    selectedMusic: data.selectedMusic,
                    bgmForced: data.bgmForced
                };
            }
            return null
        },
        saveStarter() {
            
            const saveData = {};
            localStorage.setItem('starterSceneSave', JSON.stringify(saveData));
        },
        getStarterSave() {
            const savedData = localStorage.getItem('starterSceneSave');
            if (savedData) {
                const data = JSON.parse(savedData);
                return {};
            }
            return null
        },
        saveBattle() {
            this.forceTitleCleanUp = true
            const saveData = {};
            localStorage.setItem('starterSceneSave', JSON.stringify(saveData));
        },
        getBattleSave() {
            const savedData = localStorage.getItem('starterSceneSave');
            if (savedData) {
                const data = JSON.parse(savedData);
                return {};
            }
            return null
        }
    }
}

export const saveData = SaveData()