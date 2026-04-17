import { Button } from "../enums/button.js";

export function updateIndex(xIndex, yIndex, xLength, yLength) {
    let dx = 0, dy = 0;
    if (Input.keys.has('ArrowLeft')) dx -= 1;
    if (Input.keys.has('ArrowRight')) dx += 1;
    if (Input.keys.has('ArrowUp')) dy -= 1;
    if (Input.keys.has('ArrowDown')) dy += 1;
    return {
        x: (xIndex + dx + xLength) % xLength,
        y: (yIndex + dy + yLength) % yLength
    };
}
export function updateIndexY(yIndex, min, max, keyEvent, mult) {
    if (!min) min = 0
    if (!max) max = 0
    if (!mult) mult = 1
    let dy = 0;
    if (keyEvent === Button.UP) dy = -1 * mult
    if (keyEvent === Button.DOWN) dy = 1 * mult
    const range = max - min + 1;
    return (((yIndex + dy - min) % range) + range) % range + min;
}
export function updateIndexX(xIndex, min, max, keyEvent, mult) {
    if (!min) min = 0
    if (!max) max = 0
    if (!mult) mult = 1
    let dx = 0
    if (keyEvent === Button.LEFT) dx -= 1 * mult
    if (keyEvent === Button.RIGHT) dx += 1 * mult
    const range = max - min + 1;
    return  (((xIndex + dx - min) % range) + range) % range + min
}

const KEY_MAP = {
    'z': Button.ACTION, 'Z': Button.ACTION,
    'x': Button.CANCEL, 'X': Button.CANCEL,
    'Enter': Button.MENU,
    'Shift': Button.STATS,
    'n': Button.CYCLE_NATURE, 'N': Button.CYCLE_NATURE,
    'a': Button.CYCLE_ABILITY, 'A': Button.CYCLE_ABILITY,
    'g': Button.CYCLE_GENDER, 'G': Button.CYCLE_GENDER,
    'f': Button.CYCLE_FORM, 'F': Button.CYCLE_FORM,
    's': Button.CYCLE_SHINY, 'S': Button.CYCLE_SHINY,
    'u': Button.SUBMIT, 'U': Button.SUBMIT,
    'ArrowUp': Button.UP,
    'ArrowRight': Button.RIGHT,
    'ArrowDown': Button.DOWN,
    'ArrowLeft': Button.LEFT
};

export function translateInput(key) {
    return KEY_MAP[key];
}