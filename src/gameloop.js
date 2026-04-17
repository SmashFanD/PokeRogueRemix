import { ConfigUI } from './system.js';
import { fpsRecorder } from './fps.js';
import { globalScene } from './global-scene.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH, FPS } from './utils.js';

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
}); 

new p5((p) => {
  let font
  let PAUSE

  p.preload = () => {
    p.frameRate(FPS)
    font = p.loadFont("./font/pokemon-bw.ttf")
  }
  p.setup = async () => {
    p.noSmooth()
    const canvasEl = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT, document.getElementById("PokeRogueRemix"));
    canvasEl.canvas.style = ""
    p.textFont(font)
    //first thing should be loading the save
    await globalScene.getGlobalSave()
    await globalScene.load.setup(p)
    globalScene.setup()
  }
  p.draw = () => {
    if (PAUSE) {
        return
    }
    globalScene.update(p)
    //fpsRecorder.update()
    //fpsRecorder.draw()
    //console.log(fpsRecorder.fps)
  }
  p.keyPressed = (keyEvent) => {
    if (keyEvent.key === "p" || keyEvent.key === "P") PAUSE = !PAUSE
    if (PAUSE) return
    globalScene.keyPressed(keyEvent.key)
  }

  p.keyReleased = () => {}
})