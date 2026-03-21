import { drawRect, drawText, setDrawData } from "./draw.js";
import { ConfigGame } from "../system.js";
//import { Text as Texts } from "../data/texts/texts.js";
import { FpsRecorder } from "../fps.js";
import { Input } from "./manage-input.js";
import { BattleScene } from "./battle-scene.js";
import { SaveScene } from "./save-scene.js";
import { StarterSelectScene } from "./starter-select-scene.js";
import { MenuScene } from "./menu-scene.js";

export function Game(p) {
    return {
        scene: ConfigGame.GameState.MENU_SCENE,
        newScene: ConfigGame.GameState.MENU_SCENE,
        menuScene: MenuScene(p),
        starterSelectScene: StarterSelectScene(p),
        saveScene: SaveScene(p),
        battleScene: BattleScene(p),
        savedData: { //save data should be handled later
            menuScene: null,
            starterSelectScene: null,
            saveScene: null,
            battleScene: null,
        },
        gameFrame: 0,
        
        load() {
            //base assets loading, used for all the game
        },
        setup() {
            //probably useless
        },
        updateMenuScene() {
        },
        updateStarterSelectScene() {

        },
        updateBattleScene() {
            
        },
        updateAll() {
            this.scene = this.newScene;
            switch (this.scene) {
                case ConfigGame.GameState.MENU_SCENE:
                this.menuScene.updateMenuScene(this.gameFrame); //should prob call in the child instead
                break;
                case ConfigGame.GameState.STARTER_SELECT_SCENE:
                this.starterSelectScene.updateStarterSelectScene();
                break;
                case ConfigGame.GameState.SAVE_SCENE:
                this.saveScene.updateSaveScene();
                break;
                case ConfigGame.GameState.BATTLE_SCENE:
                this.battleScene.updateBattleScene();
                break;
                default:
            }
            this.gameFrame = (this.gameFrame + 1) % Number.MAX_SAFE_INTEGER;
            this.fpsRecorder.update();
            
        },
        drawAll() {
            switch (this.scene) {
                case ConfigGame.GameState.MENU_SCENE:
                this.menuScene.drawMenuScene(this.gameFrame); //should prob call in the child instead
                break;
                case ConfigGame.GameState.STARTER_SELECT_SCENE:
                this.starterSelectScene.drawStarterSelectScene();
                break;
                case ConfigGame.GameState.SAVE_SCENE:
                this.saveScene.drawSaveScene();
                break;
                case ConfigGame.GameState.BATTLE_SCENE:
                this.battleScene.drawBattleScene();
                break;
                default:
            }
        },
        remove() {
            p.clear();
        }

    };
}