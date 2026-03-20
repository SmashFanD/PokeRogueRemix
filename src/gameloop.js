import { CanvasSizeBase, FPS_RATE, GameState } from './data/data.js';
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
  const game = Game(p);
  let timeMs = 0;
  let loops = 0

  p.preload = () => {
    game.load();
  }

  p.setup = () => {
    const canvasEl = p.createCanvas(CanvasSizeBase, CanvasSizeBase, document.getElementById("POWER4"));
    p.pixelDensity(2);
    canvasEl.canvas.style = "";
    game.setup();
  }

  //p.windowResized = () => {
  //  if (document.getElementById("POWER4")) {
  //    p.resizeCanvas(window.innerWidth, window.innerHeight);
  //  }
  //}

  p.draw = () => {
    if (timeMs < FPS_RATE) {
      loops++;
      timeMs += p.deltaTime;
      return;
    }
    //console.log("loop", loops); //if loops=0 it means the game run slower than it should
    loops = 0;
    p.clear();
    game.updateAll();
    game.drawAll();
    timeMs = p.deltaTime;
  }

  p.keyPressed = (keyEvent) => {}

  p.keyReleased = () => {}
})