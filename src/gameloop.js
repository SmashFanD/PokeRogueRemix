import { ConfigGame, ConfigUI } from './system.js';
import { Game } from './game/game.js';
import { Input } from './game/manage-input.js';
//import { savedGameData } from './data/savedGameData.js';

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
}); 

Input.init();

new p5((p) => {
  let font;
  const g = Game(p);
  let timeMs = 0;
  let loops = 0

  //Use this to load assets, based on scene
  p.preload = () => {
    font = p.loadFont("./font/pokemon-bw.ttf");
    g.preload();
  }

  p.setup = () => {
    const canvasEl = p.createCanvas(ConfigGame.CANVAS_WIDTH, ConfigGame.CANVAS_HEIGHT, document.getElementById("PokeRogueRemix"));
    canvasEl.canvas.style = "";
    g.setup();
    p.textFont(font);
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
    g.updateAll();
    g.playAll();
    p.clear();
    g.drawAll();
    timeMs = p.deltaTime;
  }

  p.keyPressed = (keyEvent) => {}

  p.keyReleased = () => {}
})