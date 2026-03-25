import { ConfigGame, ConfigUI } from './system.js';
import { TitleScene } from './game/title-scene.js';
import { Input } from './game/manage-input.js';
import { StarterSelectScene } from './game/starter-select-scene.js';
import { BattleScene } from './game/battle-scene.js';
import { SaveScene } from './game/save-scene.js';
import { fpsRecorder } from './fps.js';
//import { savedGameData } from './data/savedGameData.js';

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
}); 

Input.init();

function GlobalGameData() {
    return {
      newScene: ConfigGame.GameState.MENU_SCENE,
      changeScene(scene) {
        this.newScene = scene
      }
    }
}

export const globalGameData = GlobalGameData()

new p5((p) => {
  let scene = ConfigGame.GameState.MENU_SCENE
  let font;
  const titleScene = TitleScene(p)
  const starterSelectScene = StarterSelectScene(p)
  const saveScene = SaveScene(p)
  const battleScene = BattleScene(p)
  let timeMs = 0;
  let loops = 0

  //Use this to load assets, based on scene
  p.preload = () => {
    font = p.loadFont("./font/pokemon-bw.ttf")
    titleScene.preload()
    starterSelectScene.preload()
    saveScene.preload()
    battleScene.preload()
  }

  p.setup = () => {
    const canvasEl = p.createCanvas(ConfigGame.CANVAS_WIDTH, ConfigGame.CANVAS_HEIGHT, document.getElementById("PokeRogueRemix"));
    canvasEl.canvas.style = "";
    p.textFont(font);
    titleScene.setup()
    starterSelectScene.setup()
    saveScene.setup()
    battleScene.setup()
  }

  //p.windowResized = () => {
  //  if (document.getElementById("PokeRogueRemix")) {
  //    p.resizeCanvas(window.innerWidth, window.innerHeight);
  //  }
  //}

  p.draw = () => {
    if (timeMs < ConfigGame.FPS_RATE) {
      loops++;
      timeMs += p.deltaTime;
      return;
    }
    //console.log("loop", loops); //if loops=0 it means the game run slower than it should
    loops = 0;
    scene = globalGameData.newScene
    //console.log(scene)
    switch (scene) {
        case ConfigGame.GameState.MENU_SCENE:
            titleScene.update();
            break;
        case ConfigGame.GameState.STARTER_SELECT_SCENE:
            starterSelectScene.update();
            break;
        case ConfigGame.GameState.SAVE_SCENE:
            saveScene.update();
            break;
        case ConfigGame.GameState.BATTLE_SCENE:
            battleScene.update();
            break;
        default:
    }
    
    p.clear();
    switch (scene) {
        case ConfigGame.GameState.MENU_SCENE:
            titleScene.draw();
            break;
        case ConfigGame.GameState.STARTER_SELECT_SCENE:
            starterSelectScene.draw();
            break;
        case ConfigGame.GameState.SAVE_SCENE:
            saveScene.draw();
            break;
        case ConfigGame.GameState.BATTLE_SCENE:
            battleScene.draw();
            break;
        default:
    }
    fpsRecorder.update()
    //fpsRecorder.draw()
    timeMs = p.deltaTime;
  }

  p.keyPressed = (keyEvent) => {}

  p.keyReleased = () => {}
})