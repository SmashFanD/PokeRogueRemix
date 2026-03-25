import { drawBox, drawRect, drawText, setDrawData, setText } from "./draw.js";
import { ConfigGame } from "../system.js";
//import { Text as Texts } from "../data/texts/texts.js";
import { fpsRecorder } from "../fps.js";
import { Input, updateIndex, updateIndexY } from "./manage-input.js";
import { BattleScene } from "./battle-scene.js";
import { SaveScene } from "./save-scene.js";
import { StarterSelectScene } from "./starter-select-scene.js";
import { musicPlayer } from "./music.js";
import { IMG_Background, IMG_UI } from "../constant/image/ui.js";
import { MenuPhase } from "../data/phase.js";
import { SND_Background } from "../constant/sound/bgm.js";
import { TextMenuContent } from "../../locale/en.js";
import { TextMenuData } from "../data/text.js";
import { TextBoxMenuData } from "../data/rect.js";
import { globalGameData } from "../data/global.js";

export function TitleScene(p) {
    return {
        phase: null,
        newPhase: MenuPhase.TITLE_MENU,
        bgImg: null,
        cursorImg: null,
        cursorVisible: true,
        cursorIndex: 0,
        cursorOptionIndex: 0,
        cursorInfoIndex: 0,
        preload() {
            this.bgImg = p.loadImage(IMG_Background.END)
            this.cursorImg = p.loadImage(IMG_UI.CURSOR)
        },
        setup() {

        },
        update() {
            if (this.phase !== this.newPhase) {
                this.phase = this.newPhase
                if (this.phase === MenuPhase.TITLE_MENU) {
                    musicPlayer.playMusic(SND_Background.END)
                    this.cursorVisible = true
                }
                //else if (this.phase === MenuPhase.OPTIONS) 
                //else if (this.phase === MenuPhase.INFO)
            }

            if (this.phase === MenuPhase.TITLE_MENU) {
                //if (Input.keys.has('z') || Input.keys.has('Z')) {
                //    this.newPhase = this.cursorIndex
                //    return
                //}

                //this.cursorIndex = updateIndexY(this.cursorIndex, TextMenuContent.length)
                //console.log(this.cursorIndex)
            }
        },
        draw() {
            
            p.image(this.bgImg, 0, 0, ConfigGame.CANVAS_WIDTH, ConfigGame.CANVAS_HEIGHT)
            //if (this.scene === ConfigGame.GameState.SAVE_SCENE) drawBox(p, BgBoxGreen)
            //else if (this.scene === ConfigGame.GameState.STARTER_SELECT_SCENE) drawBox(p, BgBoxGreen)

            //UI
            //BattleBoxExemple
            //drawTextBox(p, TextBoxBattleData);
            //setText(p, "The opposing Eternatos-EternaMax is paralyzed, this will make it difficult to use any of their actions! (Fr Fr)", TextBattleData);
        
            //BattleLogExemple
            //for (let i=0; i <= 16; i++) {
            //    setText(p, "The opposing Eternatos-EternaMax is paralyzed, this will make it difficult to use any of their actions! (Fr Fr)", TextBattleLogData, i);
            //}

            //MenuUIBoxExemple
            drawBox(p, TextBoxMenuData);
            for (let id=0; id < TextMenuContent.length; id++) {
                 setText(p, TextMenuContent[id], TextMenuData, id);
            }
            if (this.cursorVisible) p.image(this.cursorImg, 1694, this.cursorIndex * 62 + 842, 30, 30)
        },
        //Should depend on last played wave (current)
        onKey(keyEvent) {
          if (keyEvent.key === "z" || keyEvent.key === "Z") {
            //TODO, Add Options and Info
            if (this.phase === MenuPhase.TITLE_MENU) {
              if (this.cursorIndex === MenuPhase.NEW_RUN) {
                //no need to change the phase, just change the scene
                this.cleanUp()
                globalGameData.changeScene(ConfigGame.GameState.STARTER_SELECT_SCENE)
                return
              }
              if (this.cursorIndex === MenuPhase.CONTINUE) {
                //change the scene give the info Save_Scene is here to Load a run
                this.cleanUp()
                globalGameData.changeScene(ConfigGame.GameState.SAVE_SCENE)
                return
              }
              if (this.cursorIndex === MenuPhase.OPTIONS || this.cursorIndex === MenuPhase.INFO) {
                this.newPhase = this.cursorIndex
                return
              }
            }
            if (this.phase === MenuPhase.OPTIONS) {
                //should be a switch if there are more than 3 options
                if (this.cursorOptionIndex === 0) {
                
                }
                return
            }
            if (this.phase === MenuPhase.INFO) {
                if (this.cursorInfoIndex === 0) {
                
                }
                return
            }
          }
          if (keyEvent.key === "x" || keyEvent.key === "X") {
            //TODO, Add Options and Info
            if (this.phase === MenuPhase.OPTIONS || this.phase === MenuPhase.INFO) {
                this.newPhase = MenuPhase.TITLE_MENU
                return
            }
          }
          
          if (this.phase === MenuPhase.TITLE_MENU) {
            this.cursorIndex = updateIndexY(this.cursorIndex, TextMenuContent.length, keyEvent)
          }
          if (this.phase === MenuPhase.OPTIONS) {
        
          }
          if (this.phase === MenuPhase.INFO) {

          }
        },
        cleanUp() {
            this.phase = null
            this.newPhase = MenuPhase.TITLE_MENU
            this.cursorVisible = true
            this.cursorIndex = 0
        }
    };
}