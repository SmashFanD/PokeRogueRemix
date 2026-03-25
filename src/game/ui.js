import { SND_Background } from "../constant/sound/bgm.js";
import { IMG_Background, IMG_UI } from "../constant/image/ui.js"
import { ConfigGame, ConfigUI } from "../system.js"
import { TextBattleData, TextBattleLogData, TextMenuData } from '../data/text.js';
import { setDrawData, drawText, drawBox, setText } from './draw.js';
import { TextMenuContent } from '../../locale/en.js';
import { MenuPhase } from "../data/phase.js";
import { musicPlayer } from "./music.js";
//this function set the UI element of the TitleMenu
function UI_Title() {
    return {
        logoImg: null,
        bgImg:  null, 
        cursorImg: IMG_UI.cursor,
        load(src) {
            return p.loadImage(src);
        },
        getBgFromWave() {

        },
        createTitle() {
            
        },
        loadImage() {
            
        },
        drawMenuScene() {
            
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

export const uiTitle = UI_Title();