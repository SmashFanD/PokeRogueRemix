import { SND_Background } from "../constant/sound/bgm.js";
import { IMG_Background } from "../constant/image/ui.js"
import { ConfigGame, ConfigUI } from './system.js';
import { TextBoxMenuData, TextBoxBattleData, TextBattleData, TextBattleLogData, TextMenuData } from '../data/text.js';
import { setDrawData, drawText, drawTextBox, setText } from './draw.js';
import { TextMenuContent } from '../../locale/en.js';
import { MenuPhase } from "src/data/child-scene.js";

export function MenuScene(p) {
    return {
        phaseCurrent: MenuPhase.TITLE_MENU,
        phaseNew: MenuPhase.TITLE_MENU,
        logoImgRef: null,
        backgroundImg: null,
        currentImgBgIndex: null,
        newImgBgIndex: IMG_Background.END,
        menuBoxImgRef: null,
        menuBoxNewRunImgRef: null,
        currentSndBgIndex: SND_Background.END,
        newSndBgIndex: SND_Background.END,
        bgMusic: null,
        audioContext: null,
        audioSource: null,
        audioBuffer: null,
        selectedIndex: 0,
        preload() {
        },
        load(src) {
            return p.loadImage(src);
        },
        async loadAudioBuffer(src) {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const response = await fetch(src);
            const arrayBuffer = await response.arrayBuffer();
            return await this.audioContext.decodeAudioData(arrayBuffer);
        },
        async checkBgMusicChange() {
             if (this.currentSndBgIndex !== this.newSndBgIndex) {
                this.currentSndBgIndex = this.newSndBgIndex;
                const music = this.currentSndBgIndex;

                if (this.audioSource) {
                    this.audioSource.stop();
                    this.audioSource = null;
                }

                this.audioBuffer = await this.loadAudioBuffer(music.SRC);
                this.audioSource = this.audioContext.createBufferSource();
                this.audioSource.buffer = this.audioBuffer;
                this.audioSource.connect(this.audioContext.destination);
                this.audioSource.loop = true;
                this.audioSource.loopStart = music.LOOP;
                this.audioSource.loopEnd = music.END;

                this.audioSource.start(0, music.START);
            }
        },
        updateMenuScene() {
            //check music before
            this.checkBgMusicChange();
            //if (this.phaseCurrent !== this.phaseNew) {
            //    this.phaseCurrent = this.phaseNew;
            //    if (this.phaseCurrent === MenuPhase.TITLE_MENU) {  
            //        createTitle()
            //    }
            //    if (this.phaseCurrent === MenuPhase.OPTIONS) { 
            //        createOption()
            //    }
            //    if (this.phaseCurrent === MenuPhase.INFO) { 
            //        createInfo()
            //    }
            //    if (this.phaseCurrent === MenuPhase.STARTER_SELECT) { 
            //        pushStarterSelect()
            //    }
            //    if (this.phaseCurrent === MenuPhase.SAVE_SELECT) { 
            //        pushSaveSelect()
            //    }
            //}
            if (this.currentImgBgIndex !== this.newImgBgIndex) {
                this.currentImgBgIndex = this.newImgBgIndex;
                this.backgroundImg = this.load(this.currentImgBgIndex);
            }
        },
        drawMenuScene() {
            //Background Image

            p.image(this.backgroundImg, 0, 0, ConfigGame.CANVAS_WIDTH, ConfigGame.CANVAS_HEIGHT);

            //UI
            //BattleBoxExemple
            //drawTextBox(p, TextBoxBattleData);
            //setText(p, "The opposing Eternatos-EternaMax is paralyzed, this will make it difficult to use any of their actions! (Fr Fr)", TextBattleData);
        
            //BattleLogExemple
            //for (let i=0; i <= 16; i++) {
            //    setText(p, "The opposing Eternatos-EternaMax is paralyzed, this will make it difficult to use any of their actions! (Fr Fr)", TextBattleLogData, i);
            //}

            //MenuUIBoxExemple
            drawTextBox(p, TextBoxMenuData);
            for (let id=0; id < TextMenuContent.length; id++) {
                 setText(p, TextMenuContent[id], TextMenuData, id);
            }
        },
        drawMenuToBattleTransition() {
            //This is just in case, to remove if not using transition
        },
        drawBattleToMenuTransition() {
            
        },
        playMenuScene() {
            
        }
    }
}