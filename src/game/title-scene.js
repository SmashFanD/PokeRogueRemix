import { drawBox, drawRect, drawText, setDrawData, setText } from "./draw.js";
import { ConfigGame } from "../system.js";
//import { Text as Texts } from "../data/texts/texts.js";
import { fpsRecorder } from "../fps.js";
import { Input, updateIndex, updateIndexX, updateIndexY } from "./manage-input.js";
import { BattleScene } from "./battle-scene.js";
import { SaveScene } from "./save-scene.js";
import { StarterSelectScene } from "./starter-select-scene.js";
import { musicPlayer } from "./music.js";
import { IMG_Background, IMG_UI } from "../constant/image/ui.js";
import { MENU_PHASE_MENU_START, MENU_PHASE_OPTIONS_START, MENU_PHASE_SOUND_START, MenuPhase } from "../data/phase.js";
import { SND_Background } from "../constant/sound/bgm.js";
import { TextMenuContent, TextOptionLeftContent, TextOptionTopContent, TextTitleContent } from "../../locale/en.js";
import { TextBattleData, TextMenuData, TextOptionLeftData, TextOptionLeftGrayData, TextOptionRightData, TextOptionTopData, TextTitleData } from "../data/text.js";
import { TextBoxBattleData, TextBoxMenuData, TextBoxOptionData, TextBoxTitleData } from "../data/rect.js";
import { globalGameData } from "../data/global.js";
import { showModifiedText } from "./text.js";
import { getKeyByValue } from "../utils.js";
import { saveData } from "../save.js";

export function TitleScene(p) {
    return {
        phase: MenuPhase.TITLE_MENU,
        newPhase: MenuPhase.TITLE_MENU,
        firstCall: true,
        bgImg: IMG_Background.END,
        cursorImg: null,
        cursorIndex: 0, //THESE VALUES SHOULD REFERENCE INDEX
        cursorOptionIndex: 0,
        cursorInfoIndex: 0,
        cursorMenuIndex: 0,
        selectedMusic: SND_Background.END,
        bgmForced: false,
        preload() {
            const lastData = saveData.getTitleSave()
            if (lastData) {
                console.log(this.selectedMusic, lastData.selectedMusic, this.bgmForced, lastData.bgmForced)
                this.selectedMusic = SND_Background[lastData.selectedMusic] || this.selectedMusic;
                this.bgmForced = lastData.bgmForced || this.bgmForced;
                console.log(this.selectedMusic, lastData.selectedMusic, this.bgmForced, lastData.bgmForced)
            }
            this.bgImg = p.loadImage(this.bgImg)
            this.cursorImg = p.loadImage(IMG_UI.CURSOR)
        },
        setup() {
        },
        update() {
            if (saveData.checkTitleCleanUp()) {
              this.cleanUp()
            }
            if (this.firstCall) {
              this.firstCall = false
              musicPlayer.playMusic(this.selectedMusic)
            }
            if (this.phase !== this.newPhase) {
                this.phase = this.newPhase
                //else if (this.phase === MenuPhase.OPTIONS) 
                //else if (this.phase === MenuPhase.INFO)
            }
        },
        draw() {
            
            p.image(this.bgImg, 0, 0, ConfigGame.CANVAS_WIDTH, ConfigGame.CANVAS_HEIGHT)
            //if (this.scene === ConfigGame.GameState.SAVE_SCENE) drawBox(p, BgBoxGreen)
            //else if (this.scene === ConfigGame.GameState.STARTER_SELECT_SCENE) drawBox(p, BgBoxGreen)

            //UI
            //BattleLogExemple
            //for (let i=0; i <= 16; i++) {
            //    setText(p, "The opposing Eternatos-EternaMax is paralyzed, this will make it difficult to use any of their actions! (Fr Fr)", TextBattleLogData, i);
            //}

            //MenuUIBoxExemple
            if (this.phase === MenuPhase.TITLE_MENU) {
              drawBox(p, TextBoxTitleData);
              for (let id=0; id < TextTitleContent.length; id++) {
                 setText(p, TextTitleContent[id], TextTitleData, id)
              }
              p.image(this.cursorImg, 1694, this.cursorIndex * 62 + 902, 30, 30)
              return
            }
            if (this.phase === MenuPhase.MENU) {
              drawBox(p, TextBoxMenuData);
              for (let id=0; id < TextMenuContent.length; id++) {
                 setText(p, TextMenuContent[id], TextMenuData, id)
              }
              if (this.cursorMenuIndex > 0) {
                drawBox(p, TextBoxBattleData)
                showModifiedText(p, this.cursorMenuIndex)

              }
              p.image(this.cursorImg, 1712, this.cursorMenuIndex * 60 + 24, 30, 30)
              return
            }
            if (this.phase === MenuPhase.OPTIONS) {
              drawBox(p, TextBoxOptionData);
              for (let id = 0; id < TextOptionTopContent.length; id++) {
                 setText(p, TextOptionTopContent[id], TextOptionTopData, id)
              }
              const musicPlay = `The BGM playing will be: ${this.selectedMusic.NAME}`
              for (let id = 0; id < TextOptionLeftContent.length; id++) {
                if (id === 0) setText(p, musicPlay, this.bgmForced ? TextOptionLeftGrayData : TextOptionLeftData, id) //make it darker if can't change
                if (id === 1) setText(p, this.bgmForced ? "BGM will not change!" : "BGM can change!", TextOptionLeftData, id)
              }

              //SOUND ONLY
              if(this.cursorOptionIndex >= MENU_PHASE_SOUND_START) {
                const index = this.cursorOptionIndex - MENU_PHASE_SOUND_START
                p.image(this.cursorImg, 16, index * 74 + 152, 30, 30) //Cursor for Sounds options
              } else {
                p.image(this.cursorImg, this.cursorOptionIndex * 62 + 18, 52, 35, 35)
              }
              return
            }

            //BattleBoxExemple
            //drawBox(p, TextBoxBattleData);
            //setText(p, "The opposing Eternatos-EternaMax is paralyzed, this will make it difficult to use any of their actions! (For Real, For Real)", TextBattleData);
        
        },
        //Should depend on last played wave (current)
        onKey(keyEvent) {
          if (keyEvent.key === "enter") {
            if (this.phase !== MenuPhase.MENU) {
              this.newPhase = MenuPhase.MENU
            } else {
              this.newPhase = MenuPhase.TITLE_MENU
            }
            return
          }
          if (keyEvent.key === "z" || keyEvent.key === "Z") {
            //TODO, Add Options and Info
            if (this.phase === MenuPhase.TITLE_MENU) {
              if (this.cursorIndex === MenuPhase.NEW_RUN) {
                //no need to change the phase, just change the scene
                globalGameData.changeScene(ConfigGame.GameState.STARTER_SELECT_SCENE)
                return
              }
              if (this.cursorIndex === MenuPhase.CONTINUE) {
                //change the scene give the info Save_Scene is here to Load a run
                globalGameData.changeScene(ConfigGame.GameState.SAVE_SCENE)
                return
              }
              if (this.cursorIndex === MenuPhase.MENU || this.cursorIndex === MenuPhase.INFO) {
                this.newPhase = this.cursorIndex
                return
              }
            }
            if (this.phase === MenuPhase.MENU) {
                this.newPhase = this.cursorMenuIndex + MENU_PHASE_MENU_START;
                return
            }
            if (this.phase === MenuPhase.OPTIONS && (this.cursorOptionIndex  < MENU_PHASE_SOUND_START)) {
                //should be a switch if there are more than 3 options
                this.cursorOptionIndex = MenuPhase.BGM_PLAY
                return
            } else if (this.phase === MenuPhase.OPTIONS) {
              if (this.cursorOptionIndex === MenuPhase.BGM_PLAY && !this.bgmForced) {
                  musicPlayer.playMusic(this.selectedMusic)
                  return
              }
              if (this.cursorOptionIndex === MenuPhase.BGM_FORCE) {
                  this.bgmForced = !this.bgmForced
                  return
              }
            }
            if (this.phase === MenuPhase.INFO) {
                if (this.cursorInfoIndex === 0) {
                
                }
                return
            }
          }
          if (keyEvent.key === "x" || keyEvent.key === "X") {
            if (this.phase === MenuPhase.MENU || this.phase === MenuPhase.INFO ) {
                this.newPhase = MenuPhase.TITLE_MENU
                return
            }
            if (this.phase === MenuPhase.OPTIONS) {
              if (this.cursorOptionIndex >= MENU_PHASE_SOUND_START) {
                this.cursorOptionIndex = 0
                const bgmSaveKey = getKeyByValue(SND_Background, this.selectedMusic)
                saveData.saveTitle(bgmSaveKey, this.bgmForced)
                return
              } else {
                this.newPhase = MenuPhase.MENU
                return
              }
            } 
            if (this.phase === MenuPhase.SOUND) {
                this.newPhase = MenuPhase.OPTIONS
                return
            }
          }
          
          if (this.phase === MenuPhase.TITLE_MENU) {
            this.cursorIndex = updateIndexY(this.cursorIndex, TextTitleContent.length, keyEvent)
          }
          if (this.phase === MenuPhase.MENU) {
            this.cursorMenuIndex = updateIndexY(this.cursorMenuIndex, TextMenuContent.length, keyEvent)
          }
          if (this.phase === MenuPhase.INFO) {
            this.cursorInfoIndex = updateIndexY(this.cursorInfoIndex, TextInfoContent.length, keyEvent)
          }
          if (this.phase === MenuPhase.OPTIONS && this.cursorOptionIndex < MENU_PHASE_SOUND_START) {
            this.cursorOptionIndex = updateIndexX(this.cursorOptionIndex, TextOptionTopContent.length, keyEvent)
          } else if (this.phase === MenuPhase.OPTIONS) {
            if (this.cursorOptionIndex === MenuPhase.BGM_PLAY) {
              console.log(this.selectedMusic)
              const keysBgm = Object.keys(SND_Background)
              let currentBgmIndex = keysBgm.indexOf(getKeyByValue(SND_Background, this.selectedMusic));
              currentBgmIndex = updateIndexX(currentBgmIndex, keysBgm.length, keyEvent);
              this.selectedMusic = SND_Background[keysBgm[currentBgmIndex]];
              console.log(this.selectedMusic, currentBgmIndex)
            }
            this.cursorOptionIndex = updateIndexY(this.cursorOptionIndex, TextOptionLeftContent.length, keyEvent) + MENU_PHASE_SOUND_START
          }
          console.log("phase", this.phase, "cursor", this.cursorOptionIndex, this.selectedMusic, this.bgmForced)
        },
        cleanUp() {
            this.phase = MenuPhase.TITLE_MENU
            this.newPhase = MenuPhase.TITLE_MENU
            this.cursorIndex = 0
            this.cursorOptionIndex = 0
            this.cursorMenuIndex = 0
            this.cursorInfoIndex = 0
            this.firstCall = false
        }
    };
}