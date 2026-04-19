import { SND_Background } from "../constant/sound/bgm.js";
import { globalScene } from "../global-scene.js";

class MusicPlayer {
    constructor() {
        this.bgAudioContext = new (window.AudioContext || window.webkitAudioContext)()
        this.sndAudioContext = new (window.AudioContext || window.webkitAudioContext)()
        this.gainNode = null

        this.bgAudioBuffers = new Map()
        this.sndAudioBuffer = new Map()

        this.bgAudioSource = null;
        this.bgLoadPromise = Promise.resolve()
        this.currentLoadController = null
        this.cacheOrder = []
        this.bgmMaxCache = 6
        this.isPlaying = false
        this.musicBg = null

        this.sndAudioSource = null
    }
    async playBgm(music) {
        const src = music.SRC

        if ((this.musicBg?.SRC === src || globalScene.musicForced) && this.isPlaying
          || globalScene.musicOff.includes(src)) return
        console.log("tryPlay", src, this.musicBg, globalScene.musicBg)

        this.isPlaying = true
        this.musicBg = music
        this.currentLoadController?.abort()
        this.bgLoadPromise = Promise.resolve()
        await this.bgLoadPromise.catch(() => {})

        this.currentLoadController = new AbortController()
        let audioBuffer = this.bgAudioBuffers.get(src)
        if (!audioBuffer) {
            try {
              this.bgLoadPromise = this.loadBgAudioBuffer(src, this.currentLoadController.signal)
              audioBuffer = await this.bgLoadPromise
              await this.cacheBgm(globalScene?.musicBg)
            } catch (e) {
              if (e.name === 'AbortError') return
              throw e
            }
        } else {
            this.cacheOrder.splice(this.cacheOrder.indexOf(src), 1)
            this.cacheOrder.push(globalScene?.musicBg)
            console.log(globalScene?.musicBg?.SRC, this.cacheOrder, this.bgAudioBuffers)
        }
        globalScene.musicBg = music
        this.bgAudioSource?.stop()
        this.bgAudioSource = null

        this.gainNode = this.bgAudioContext.createGain()
        this.gainNode.connect(this.bgAudioContext.destination)
        this.bgAudioSource = this.bgAudioContext.createBufferSource()
        this.bgAudioSource.buffer = audioBuffer
        this.bgAudioSource.connect(this.gainNode)
        this.bgAudioSource.loop = true
        this.bgAudioSource.loopStart = music.LOOP
        this.bgAudioSource.loopEnd = music.END
        this.bgAudioSource.start(0, music.START)
    }

    async loadBgAudioBuffer(src, signal) {
      const response = await fetch(src, { signal })
      const arrayBuffer = await response.arrayBuffer()
      return await this.bgAudioContext.decodeAudioData(arrayBuffer)
    }

    checkBgmCache() {
        while (this.bgAudioBuffers.size > this.bgmMaxCache) {
            const oldestSrc = this.cacheOrder.shift()
            if (oldestSrc) {
                this.bgAudioBuffers.delete(oldestSrc)
            }
        }
    }

    /**
     * Add a music to cache without playing it
     * @param {Object} music - Object SRC, LOOP, END, START.
     */
    async cacheBgm(music) {
        const src = music.SRC
        //if already in cache update order
        if (this.bgAudioBuffers.has(src)) {
            this.cacheOrder.splice(this.cacheOrder.indexOf(src), 1)
            this.cacheOrder.push(src)
            return;
        }

        try {
            const audioBuffer = await this.loadBgAudioBuffer(src)
            this.bgAudioBuffers.set(src, audioBuffer)
            this.cacheOrder.push(src)
            this.checkBgmCache()
        } catch (e) {
            console.warn(`Failed load ${src}:`, e)
        }
    }
    stopBgm() {
        this.bgAudioSource?.stop()
    }
    continueBgm() {
        this.bgAudioSource?.play()
    }
    async fadeOut(duration = 2, continueBgm) {
        const now = this.bgAudioContext.currentTime;
        this.gainNode.gain.linearRampToValueAtTime(0, now + duration);
        if (continueBgm) return
        await new Promise(resolve => setTimeout(resolve, duration * 1000));
        this.bgAudioSource?.stop();
        this.bgAudioSource = null;
    }

    async fadeIn(duration = 2) {
        const now = this.bgAudioContext.currentTime;
        this.gainNode.gain.setValueAtTime(0, now);
        this.gainNode.gain.linearRampToValueAtTime(1, now + duration);
    }
    async loadSndAudioBuffer(src) {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        return await this.sndAudioContext.decodeAudioData(arrayBuffer);
    }
}

export const musicPlayer = new MusicPlayer()