function MusicPlayer() {
    return {
        bgMusicPlaying: null,
        bgAudioContext: null,
        bgAudioBuffer: null,
        bgAudioSource: null,
        bgmForceSelected: false,
        bgmForceOff: [],
        sndAudioBuffer: null,
        sndbgAudioSource: null,
        sndAudioContext: null,
        async loadBgAudioBuffer(src) {
            if (!this.bgAudioContext) {
                this.bgAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const response = await fetch(src);
            const arrayBuffer = await response.arrayBuffer();
            return await this.bgAudioContext.decodeAudioData(arrayBuffer);
        },
        async loadSndAudioBuffer(src) {
            if (!this.sndAudioContext) {
                this.sndAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const response = await fetch(src);
            const arrayBuffer = await response.arrayBuffer();
            return await this.sndAudioContext.decodeAudioData(arrayBuffer);
        },
        async playMusic(music) {
            if (this.bgMusicPlaying === music.SRC || this.bgmForceSelected || this.bgmForceOff.includes(music.src)) return

            this.bgMusicPlaying = music.SRC;

            if (this.bgAudioSource) {
                this.bgAudioSource.stop();
                this.bgAudioSource = null;
            }

            this.bgAudioBuffer = await this.loadBgAudioBuffer(music.SRC);
            this.bgAudioSource = this.bgAudioContext.createBufferSource();
            this.bgAudioSource.buffer = this.bgAudioBuffer;
            this.bgAudioSource.connect(this.bgAudioContext.destination);
            this.bgAudioSource.loop = true;
            this.bgAudioSource.loopStart = music.LOOP;
            this.bgAudioSource.loopEnd = music.END;

            this.bgAudioSource.start(0, music.START);
        },
        async playSound(snd) {
            //work on this later
            if (this.sndAudioSource) {
                this.sndAudioSource.stop();
                this.sndAudioSource = null;
            }

            this.sndAudioBuffer = await this.loadSndAudioBuffer(snd.SRC);
            this.sndAudioSource = this.sndAudioContext.createBufferSource();
            this.sndAudioSource.buffer = this.sndAudioBuffer;
            this.sndAudioSource.connect(this.sndAudioContext.destination);
            this.sndAudioSource.loop = false;

            this.sndAudioSource.start(0, 0);
        },
    }
}

export const musicPlayer = MusicPlayer();