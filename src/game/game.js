import { drawRect, drawText, setDrawData } from "./draw.js";
import { FADE_PAUSE_TIMER, GameState, READY_GO_TIMER, ActionMenuOptions, RandomHalf, TurnTimerMax, TurnTimerMin, FPS, BaseItemIndex, Player, Enemy, TimerTopBottom, TimerLeftRight, MapSize, TextMedium, TextBig, OutlineMedium, TilePlayer, TileEnemy, WaveVictory, WaveDraw, WaveContinue, AI_Best, AI_Strong, LevelCapAI } from "../data/data.js";
//import { Text as Texts } from "../data/texts/texts.js";
import { FpsRecorder } from "../fps.js";
import { Input, updateIndex } from "./manage-input.js";
import { TileMap } from "../data/tilemap.js"
import { Items } from "./item.js";
import { AI, evaluateMove } from "../data/ai.js";

export function Game(p) {
    return {
        scene: GameState.WAVE_START,
        newScene: GameState.WAVE_START,
        turnCount: 1,
        turnCountPlayer: 1,
        turnThinkFrameTotal: 0,
        turnThinkFrameAverage: 0,
        turnChoiceFramesMax: TurnTimerMax,
        turnChoiceFrames: TurnTimerMax,
        turnCountMin: null,
        waveCount: 1,
        waveCountMax: 1,
        turnPlayer: !(Math.random() < RandomHalf),
        fpsRecorder: FpsRecorder(),
        tileMap: null,
        dungeonRenderer: null,
        indexActionCurrent: BaseItemIndex, //This is the value that place the item based on X position (if timer)
        indexAction: BaseItemIndex, //This is the Index the player is wanting for (wait for the animation to complete if selecting it)
        indexActionSelected: null, //Store the selected Action 
        indexActionSelectedLine: null,
        turnFinish: false,
        timerTopBottom: TimerTopBottom,
        timerLeftRight: TimerLeftRight,
        items: Items(p),
        turnResult: null,
        AI: null,
        load() {
            //base assets loading, used for all the game
        },
        setup() {
            //probably useless
        },
        waveReset() {
            this.playFrames = 0;
        },
        turnReset() {

        },
        updateWaveStart() {
            this.tileMap = TileMap();
            this.AI = AI();
            this.waveCountMax = Math.max(this.waveCountMax, this.waveCount);

            //Set a timer based on the current wave to limit thinking time
            this.turnChoiceFramesMax = Math.max(TurnTimerMin, TurnTimerMax - this.waveCount);
            this.turnChoiceFrames = this.turnChoiceFramesMax;

            //start the first turn of the new wave
            this.turnCountMin = Math.max(this.turnCount, this.turnCountMin);
            this.newScene = this.turnPlayer ? GameState.TURN_CHOICE_PLAYER : GameState.TURN_CHOICE_ENEMY;
        },
        updateWaveEnd() {
            //remove all player and enemy items (with animation of them going down)
            this.newScene = GameState.WAVE_START;
        },
        updateTurnChoicePlayer() {
            //wait for player input to choose action, then start turn process
            //Animate the item going down based on a timer, 

            if (!this.indexActionSelected) {
                //first we check this action index is playable, if not go right, note: base indexAction should be different based on player and enemy (save their last action)
                let index = this.indexAction;
                while (!this.tileMap.canSelect(index)) {
                    index = (index + 1) % MapSize;
                }
                if (this.turnChoiceFrames <= 0) {
                    this.indexAction = index;
                    this.indexActionSelected = this.indexAction;
                    this.indexActionSelectedLine = this.tileMap.changeTile(this.indexAction, TilePlayer);
                    this.turnFinish = true;
                    this.newScene = GameState.TURN_PROCESS_PLAYER;
                }

                if (Input.keys.has('ArrowRight')) {
                    let nextIndex = index + 1;
                    while (nextIndex < MapSize && !this.tileMap.canSelect(nextIndex)) {
                        nextIndex++;
                    }
                    if (nextIndex < MapSize) {
                        index = nextIndex;
                    }
                    Input.keys.delete('ArrowRight');
                }

                if (Input.keys.has('ArrowLeft')) {
                    let nextIndex = index - 1;
                    while (nextIndex >= 0 && !this.tileMap.canSelect(nextIndex)) {
                        nextIndex--;
                    }
                    if (nextIndex >= 0) {
                        index = nextIndex;
                    }
                   Input.keys.delete('ArrowLeft');
                }

                this.indexAction = index;
                if ((Input.keys.has('z') || Input.keys.has('Z'))) {
                    Input.keys.delete('z');
                    Input.keys.delete('Z');
                    this.indexActionSelected = this.indexAction;
                    this.indexActionSelectedLine = this.tileMap.changeTile(this.indexAction, TilePlayer);
                    this.turnFinish = true;

                    //Starting here wait X animation to complete
                    
                }
            } 

            //if timer runs out the curently selected tile index is chosen for the action (update indexAction)
            this.turnChoiceFrames--;
            this.turnThinkFrameTotal++;
            
            if (this.turnFinish) { //turnFinish mean animation complete + action selected
                this.newScene = GameState.TURN_PROCESS_PLAYER;
            }
        },
        updateTurnChoiceEnemy() {
            //first check the score for each row
            if (!this.indexActionSelected) {
                //first check if AI should choose randomly
                let levelAI = Math.min(LevelCapAI, this.waveCount);
                const rand = (Math.random() * LevelCapAI - levelAI);
                
                if (rand > AI_Strong) this.indexAction = Math.floor(Math.random() * MapSize);
                //if not random check the score for each selectable row
                else {
                    let indexScore = [];
                    let lineIndex;
                    for (let i = 0; i < MapSize; i++) {
                        if (!this.tileMap.canSelect(i)) {
                            indexScore.push(0);
                            continue;
                        }
                        lineIndex = this.tileMap.changeTile(i, null);
                        indexScore.push(evaluateMove(lineIndex, i, this.tileMap.tiles));
                    }

                    //now that scores are stored, we check if the AI should choose the highest score based on the wave (max AI level at wave 200)
                    //if rand <= 0 then choose the best outcome
                    if (rand <= AI_Best) this.indexAction = indexScore.indexOf(Math.max(...indexScore));

                    //if rand <= 100 then choose based on weight
                    else if (rand <= AI_Strong) {
                        const weights = indexScore.map(score => Math.max(1, score)); // Avoid zero weights
                        const totalWeight = weights.reduce((a, b) => a + b, 0);
                        let random = Math.random() * totalWeight;
                        let sum = 0;
                        for (let i = 0; i < weights.length; i++) {
                            sum += weights[i];
                            if (random <= sum) {
                                this.indexAction = i;
                                break;
                            }
                        }
                    }
                    //Starting here wait X animation to complete
                    
                }

                this.indexActionSelected = this.indexAction;
                this.indexActionSelectedLine = this.tileMap.changeTile(this.indexAction, TileEnemy);
                this.turnFinish = true;
            }

            if (this.turnFinish) { //turnFinish mean animation complete + action selected
                this.newScene = GameState.TURN_PROCESS_ENEMY;
            }
        },
        updateTurnProcessPlayer() {
            //process player turn processing, then check player victory
            this.newScene = GameState.CHECK_PLAYER_VICTORY;
        },
        updateTurnProcessEnemy() {
            //process enemy turn processing, then check enemy victory
            this.newScene = GameState.CHECK_ENEMY_VICTORY;
        },
        resetAction() {
            console.log('player', this.turnPlayer, 'indexAction', this.indexAction, this.indexActionCurrent, this.indexActionSelected, 'line', this.indexActionSelectedLine);
            this.turnPlayer = !this.turnPlayer;
            this.turnFinish = false;
            this.turnCount++;
            this.turnChoiceFrames = this.turnChoiceFramesMax;
            this.indexAction = BaseItemIndex; //change this later
            this.indexActionCurrent = BaseItemIndex;
            this.indexActionSelected = null;
        },
        updateCheckPlayerVictory() {
            //check if player won, if not start enemy turn
            //Also check draw, if there is a draw then start the wave again basically same as next wave but not increasing wave count
            this.turnResult = this.tileMap.checkVictory(this.indexActionSelectedLine, this.indexActionSelected);


            this.resetAction();
            this.turnThinkFrameAverage = this.turnThinkFrameTotal / this.turnCountPlayer;
            this.turnCountPlayer++; //this should be moved to when player start its next turn?
            console.log('turnResult', this.turnResult);
            if (this.turnResult === WaveContinue) {
                this.newScene = GameState.TURN_CHOICE_ENEMY;
            } else if (this.turnResult === WaveVictory) {
                this.waveCount++; 
                this.newScene = GameState.WAVE_END; 
            } else {
                this.newScene = GameState.WAVE_END;
            }
        },
        updateCheckEnemyVictory() {
            //check if enemy won, if not start player turn, note: until the AI is made the turnResult will be WaveVictory
            this.turnResult = this.tileMap.checkVictory(this.indexActionSelectedLine, this.indexActionSelected);

            this.resetAction();
            console.log('turnResult', this.turnResult);
            if (this.turnResult === WaveContinue) {
                this.newScene = GameState.TURN_CHOICE_PLAYER;
            } else if (this.turnResult === WaveVictory) {
                this.waveCount = 1; 
                this.newScene = GameState.WAVE_END; 
            } else {
                this.newScene = GameState.WAVE_END;
            }
        },
        updateAll() {
            this.scene = this.newScene;
            switch (this.scene) {
                case GameState.WAVE_START:
                this.updateWaveStart();
                break;
                case GameState.TURN_CHOICE_PLAYER:
                this.updateTurnChoicePlayer();
                break;
                case GameState.TURN_CHOICE_ENEMY:
                this.updateTurnChoiceEnemy();
                break;
                case GameState.TURN_PROCESS_PLAYER:
                this.updateTurnProcessPlayer();
                break;
                case GameState.TURN_PROCESS_ENEMY:
                this.updateTurnProcessEnemy();
                break;
                case GameState.CHECK_PLAYER_VICTORY:
                this.updateCheckPlayerVictory();
                break;
                case GameState.CHECK_ENEMY_VICTORY:
                this.updateCheckEnemyVictory();
                break;
                case GameState.WAVE_END:
                this.updateWaveEnd();
                break;
                default:
            }
            this.fpsRecorder.update();
            
        },
        drawAll() {
            const player = this.turnPlayer;
            
            this.tileMap.draw(p, player, this.indexAction);
            
            setDrawData(p, [255, 255, 255, 125], OutlineMedium, 0);
            drawText(p, `FPS:`, 5, 20, TextMedium);
            drawText(p, `${this.fpsRecorder.fps.toFixed(0)}`, 70, 20, TextMedium, p.RIGHT);
            drawText(p, `TimeRemaining:`, 75, 20, TextMedium);
            drawText(p, `${this.turnChoiceFrames}`, 250, 20, TextMedium, p.RIGHT);
            drawText(p, `AverageTime:`, 255, 20, TextMedium);
            drawText(p, `${this.turnThinkFrameAverage.toFixed()}`, 410, 20, TextMedium, p.RIGHT);
            if (player) {
                setDrawData(p, [255, 255, 0, 125], OutlineMedium, 0)
                drawText(p, `Player Turn`, 415, 20, TextBig);
            } else {
                setDrawData(p, [255, 0, 0, 125], OutlineMedium, 0)
                drawText(p, `Enemy Turn`, 415, 20, TextBig);
            }
            setDrawData(p, [255, 255, 255, 125], OutlineMedium, 0)
            drawText(p, `Wave:`, 530, 20, TextMedium);
            drawText(p, `${this.waveCount}`, 665, 20, TextMedium, p.RIGHT);
        },
        remove() {
            p.clear();
        }

    };
}