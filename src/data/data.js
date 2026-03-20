export const FPS = 20;
export const FPS_RATE = 1000 / FPS;
export const FADE_PAUSE_TIMER = FPS;
export const READY_GO_TIMER = FPS * 3;
export const GameState = {
  WAVE_START: 0,
  TURN_CHOICE_PLAYER: 1,
  TURN_PROCESS_PLAYER: 2,
  CHECK_PLAYER_VICTORY: 3,
  TURN_CHOICE_ENEMY: 4,
  TURN_PROCESS_ENEMY: 5,
  CHECK_ENEMY_VICTORY: 6,
  PLAYER_VICTORY: 7,
  ENEMY_VICTORY: 8,
  WAVE_END: 9
};
export const ActionMenuOptions = 6;
export const RandomHalf = 0.5;
export const TurnTimerMax = 600;
export const TurnTimerMin = 50;
export const MapSize = 7;
export const TileTop = 0;
export const TileEmpty = 1; 
export const TilePlayer = 2;
export const TileEnemy = 3;
export const TileTopPlayer = 2;
export const TileTopEnemy = 3;
export const BaseItemIndex = 3;
export const Player = 1;
export const Enemy = 0;
export const TimerTopBottom = 20;
export const TimerLeftRight = 40;
export const TimerCut = 2.5;
export const TextSmall = 12;
export const TextMedium = 18;
export const TextBig = 22;
export const OutlineSmall = 2;
export const OutlineMedium = 4;
export const OutlineBig = 6;
export const CanvasSizeBase = 672;
export const TileSize = CanvasSizeBase / 4;
export const WaveContinue = 0;
export const WaveVictory = 1;
export const WaveDraw = 2;
export const LevelCapAI = 200;
export const AI_Best = 0;
export const AI_Strong = 100;