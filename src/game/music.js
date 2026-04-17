import { SND_Background } from "../constant/sound/bgm.js";
import { globalScene } from "../global-scene.js";

class MusicPlayer {
    constructor() {
        this.bgAudioContext = new (window.AudioContext || window.webkitAudioContext)()
        this.sndAudioContext = new (window.AudioContext || window.webkitAudioContext)()

        this.bgAudioBuffers = new Map()
        this.sndAudioBuffer = new Map()

        this.bgAudioSource = null;
        this.bgLoadPromise = Promise.resolve()
        this.currentLoadController = null
        this.cacheOrder = []
        this.bgmMaxCache = 6
        this.isPlaying = false

        this.sndAudioSource = null
    }
    async playBgm(music) {
        const src = music.SRC;

        if ((globalScene.musicBg?.SRC === src || globalScene.musicForced) && this.isPlaying
          || globalScene.musicOff.includes(src)) return;

        globalScene.musicBg = music
        this.currentLoadController?.abort();
        this.bgLoadPromise = Promise.resolve();
        await this.bgLoadPromise.catch(() => {});

        this.currentLoadController = new AbortController()
        let audioBuffer = this.bgAudioBuffers.get(src)
        if (!audioBuffer) {
            try {
              this.bgLoadPromise = this.loadBgAudioBuffer(src, this.currentLoadController.signal);
              audioBuffer = await this.bgLoadPromise;
              this.bgAudioBuffers.set(src, audioBuffer);
              this.cacheOrder.push(src);
              this.checkBgmCache();
            } catch (e) {
              if (e.name === 'AbortError') return
              throw e;
            }
        } else {
            this.cacheOrder.splice(this.cacheOrder.indexOf(src), 1);
            this.cacheOrder.push(src);
            console.log(src, this.cacheOrder, this.bgAudioBuffers)
        }
        this.bgAudioSource?.stop();
        this.bgAudioSource = null;

        this.bgAudioSource = this.bgAudioContext.createBufferSource();
        this.bgAudioSource.buffer = audioBuffer;
        this.bgAudioSource.connect(this.bgAudioContext.destination);
        this.bgAudioSource.loop = true;
        this.bgAudioSource.loopStart = music.LOOP;
        this.bgAudioSource.loopEnd = music.END;
        this.bgAudioSource.start(0, music.START);
    }

    async loadBgAudioBuffer(src, signal) {
      const response = await fetch(src, { signal });
      const arrayBuffer = await response.arrayBuffer();
      return await this.bgAudioContext.decodeAudioData(arrayBuffer);
    }

    checkBgmCache() {
        while (this.bgAudioBuffers.size > this.bgmMaxCache) {
            const oldestSrc = this.cacheOrder.shift();
            if (oldestSrc) {
                this.bgAudioBuffers.delete(oldestSrc);
            }
        }
    }

    async loadSndAudioBuffer(src) {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        return await this.sndAudioContext.decodeAudioData(arrayBuffer);
    }
}

export const musicPlayer = new MusicPlayer()