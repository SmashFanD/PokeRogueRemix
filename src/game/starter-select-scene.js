import { BgBoxGreen, BgBoxGreenTop } from "../data/rect.js";
import { StarterSelectPhase } from "../data/phase.js";
import { saveData } from "../save.js";
import { IMG_UI } from "../constant/image/ui.js";
import { drawBox, setText } from "./draw.js";
import { globalGameData, PokemonGeneration } from "../data/global.js";
import { TextStarterSelectGenData } from "../data/text.js";
import { updateIndexY } from "./manage-input.js";
import { ConfigGame } from "../system.js";

export function StarterSelectScene(p) {
    return {
        phase: StarterSelectPhase.CHOICE_GEN,
        newPhase: StarterSelectPhase.CHOICE_GEN,
        cursorImg: null,
        cursorIndex: 0, //i should maybe work with only one cursor
        cursorPkmnIndex: 0,
        cursorMenuIndex: 0,
        cursorInfoIndex: 0,
        pkmnImg: null,
        preload() {
            const lastData = saveData.getStarterSave()
            if (lastData) {}
            this.cursorImg = p.loadImage(IMG_UI.SELECTOR)
        },
        setup() {},
        update() {
            if (this.phase !== this.newPhase) {
                this.phase = this.newPhase
            }
        },
        draw() {
            //replace with starter screen color
            if (this.phase !== StarterSelectPhase.SHOW_STATUS) {
                drawBox(p, BgBoxGreen)
                drawBox(p, BgBoxGreenTop)
            }
            
        
            if (this.phase === StarterSelectPhase.CHOICE_GEN) {
                setText(p, `${this.cursorIndex + 1}G`, TextStarterSelectGenData)
                p.image(this.cursorImg, 30, 12, 60, 60)
            }
        },
        onKey(keyEvent) {
            if (keyEvent.key === "z" || keyEvent.key === "Z") {
                if (this.phase === StarterSelectPhase.CHOICE_GEN) {
                    //Change the starter that are shown based on the cursorIndex
                    //switch
                    return
                }
                if (this.phase === StarterSelectPhase.CHOICE_PKMN) {
                    //Show the option for this pokemon
                    return
                }

                if (this.phase === StarterSelectPhase.SHOW_MENU) {
                    //Show the status screen of the pokemon
                    return
                }
                if (this.phase === StarterSelectPhase.SHOW_STATUS) {
                    //Change stats shown (evs, ivs, stats)
                    return
                }
            }

            if (keyEvent.key === "x" || keyEvent.key === "X") {
                if (this.phase === StarterSelectPhase.CHOICE_GEN) {
                    //Go back to the title scene
                    globalGameData.changeScene(ConfigGame.GameState.MENU_SCENE)
                    return
                }
                if (this.phase === StarterSelectPhase.CHOICE_PKMN) {
                    this.newPhase = StarterSelectPhase.CHOICE_GEN
                    return
                }
                if (this.phase === StarterSelectPhase.SHOW_MENU) {
                    this.newPhase = StarterSelectPhase.CHOICE_PKMN
                    return
                }
                if (this.phase === StarterSelectPhase.SHOW_STATUS) {
                    this.newPhase = StarterSelectPhase.SHOW_MENU
                    return
                }
            }

            if (this.phase === StarterSelectPhase.CHOICE_GEN) {
                const keysGen = Object.keys(PokemonGeneration)
                this.cursorIndex = updateIndexY(this.cursorIndex, keysGen.length, keyEvent)
            }
            if (this.phase === StarterSelectPhase.CHOICE_PKMN) {
                //change PkmnIndex
                const keysGen = Object.keys(PokemonGeneration)
                this.cursorIndex = updateIndexY(this.cursorIndex, keysGen.length, keyEvent)
            }
            if (this.phase === StarterSelectPhase.SHOW_MENU) {
                //menu index does not get save
                const keysGen = Object.keys(PokemonGeneration)
                this.cursorIndex = updateIndexY(this.cursorIndex, keysGen.length, keyEvent)
            }
            if (this.phase === StarterSelectPhase.SHOW_STATUS) {
                //same as menu, not save
                const keysGen = Object.keys(PokemonGeneration)
                this.cursorIndex = updateIndexY(this.cursorIndex, keysGen.length, keyEvent)
            }
        },
        cleanUp() {
            
        },
    }
}