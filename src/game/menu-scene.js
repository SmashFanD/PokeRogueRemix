import { IMG_BackGround } from ../constant/ui.js

export function MenuScene(p) {
    return {
        logoImgRef: null,
        backgroundImgRef: null,
        menuBoxImgRef: null,
        menuBoxNewRunImgRef: null,
        load() {
          this.backgroundImgRef = p.loadImage(IMG_BackGround.END);
        //What does MenuScene need to store ?
        updateMenuScene() {

        },
        drawMenuScene() {
            //Background Image
            p.image(this.backgroundImgRef, 0, 0);

            //UI
        },
        drawMenuToBattleTransition() {
            //This is just in case, to remove if not using transition
        },
        drawBattleToMenuTransition() {
            
        },
    }
}