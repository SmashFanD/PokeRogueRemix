class I18next {
    //Note: Not all language should be stored at once, clear this object when switching language is implemented
    i18n = {}
    isInit = null
    #resolveInit
    #isInitialized = false

    constructor() {
        this.isInit = new Promise((resolve) => {
            this.#resolveInit = resolve;
        });
    }
    async t(path, options = {}) {
      await this.isInit
      return this.replace(path, options)
    }
    replace(path, options) {
      const [fileKey, textKey] = path.split(':');
      let text = this.i18n[fileKey]?.[textKey] || path;
  
      return text.replace(/{{(.*?)}}/g, (match, key) => {
        return options[key] || match;
      });
    }
    async loadFromJSON(fileNames, pathExt) {
      for (const fileName of fileNames) {
        const load = {}
        if (fileName.endsWith('.json')) {
          const keyName = fileName.replace('.json', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase())
          const filePath = `${pathExt}/${fileName}`
          const response = await fetch(filePath)
          const content = await response.json()
          this.i18n[keyName] = content
        }
      }
      this.#resolveInit();
      this.#isInitialized = true
      console.log('Localization data loaded:');
    }
}

export const i18next = new I18next()