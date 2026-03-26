import { SND_Background } from "../constant/sound/bgm.js";

function MusicPlayer() {
    this.bgAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sndAudioContext = new (window.AudioContext || window.webkitAudioContext)();

    this.bgAudioBuffers = new Map();
    this.sndAudioBuffer = new Map();

    this.bgMusicPlaying = null;
    this.bgAudioSource = null;
    this.bgmForceSelected = false;
    this.bgmForceOff = [];

    this.sndAudioSource = null;
}

MusicPlayer.prototype = {
    async playMusic(music) {
        const src = music.SRC;
        console.log(this.bgMusicPlaying, this.bgmForceSelected, this.bgmForceOff.includes(src), music)
        if (this.bgMusicPlaying === src || this.bgmForceSelected || this.bgmForceOff.includes(src)) return;

        if (this.bgAudioBuffers && this.bgMusicPlaying) this.bgAudioBuffers.delete(this.bgMusicPlaying)
        this.bgMusicPlaying = src;

        if (this.bgAudioSource) {
            this.bgAudioSource.stop();
            this.bgAudioSource = null;
        }

        let audioBuffer = this.bgAudioBuffers.get(src);
        console.log(audioBuffer)
        if (!audioBuffer) {
            audioBuffer = await this.loadBgAudioBuffer(src);
            this.bgAudioBuffers.set(src, audioBuffer);
        }

        this.bgAudioSource = this.bgAudioContext.createBufferSource();
        this.bgAudioSource.buffer = audioBuffer;
        this.bgAudioSource.connect(this.bgAudioContext.destination);
        this.bgAudioSource.loop = true;
        this.bgAudioSource.loopStart = music.LOOP;
        this.bgAudioSource.loopEnd = music.END;
        this.bgAudioSource.start(0, music.START);
        console.log(this.bgAudioContext.state)
    },

    async loadBgAudioBuffer(src) {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        return await this.bgAudioContext.decodeAudioData(arrayBuffer);
    },

    async loadSndAudioBuffer(src) {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        return await this.sndAudioContext.decodeAudioData(arrayBuffer);
    }
};

export const musicPlayer = new MusicPlayer();