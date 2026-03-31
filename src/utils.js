import { ConfigGame } from "./system.js";

export function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

export function getIndexKeyByValue(object, value) {
    const objects = Object.keys(object)
    return objects.indexOf(getKeyByValue(object, value));
}

export function recoverObjectFromKeys(object, value) {
    const objects = Object.keys(object)
    const recoverFrom = getIndexKeyByValue(object, value)
    return object[objects[recoverFrom]]
}
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function frameToMs(frame) {
    return frame * (ConfigGame.FPS_RATE);
}
export function delayFrame(frame) {
    return new Promise(resolve => setTimeout(resolve, frameToMs(frame)));
}