import { drawBox, drawRect, drawText, setDrawData, setText } from "./draw.js";
import { ConfigGame } from "../system.js";
//import { Text as Texts } from "../data/texts/texts.js";
import { fpsRecorder } from "../fps.js";
import { Input } from "./manage-input.js";
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

export function TitleScene(p) {
    return {
        phase: null,
        newPhase: MenuPhase.TITLE_MENU,
        bgImg: null,
        cursorImg: null,
        cursorVisible: true,
        cursorIndex: 0,
        preload() {
            this.bgImg = p.loadImage(IMG_Background.END)
            this.cursorImg = p.loadImage(IMG_UI.CURSOR)
        },
        setup() {

        },
        update() {
            if (this.phase !== this.newPhase) {
                this.phase = this.newphase
                if (this.phase === MenuPhase.TITLE_MENU) {
                    musicPlayer.playMusic(SND_Background.END)
                    this.cursorVisible = true
                }
                //else if (this.phase === MenuPhase.OPTIONS) 
                //else if (this.phase === MenuPhase.INFO)
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
        },
        //Should depend on last played wave (current)
        setBgImg(src) {
          
        },
    };
}