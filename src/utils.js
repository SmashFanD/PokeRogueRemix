import { ConfigGame } from "./system.js";

//remember
export const FPS = 20;
export const MILLISECONDS_PER_FRAME = 1000 / FPS;
export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;
//Pause the drawing loop
export const PAUSE = false
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
/**
 * Returns a **completely unseeded** random integer between `min` and `min + range`.
 * @param range - The amount of possible numbers to pick
 * @param min - The minimum number to pick; default `0`
 * @returns A psuedo-random, unseeded integer within the interval [min, min+range].
 * @remarks
 * This should not be used for battles or other outwards-facing randomness;
 * battles are intended to be seeded and deterministic.
 */
export function randInt(range, min = 0) {
  if (range <= 1) {
    return min;
  }
  return Math.floor(Math.random() * range) + min;
}
/**
 * Returns a **completely unseeded** random integer
 * @param min The lowest number
 * @param max The highest number
 * @returns a random integer between {@linkcode min} and {@linkcode max} inclusive
 */
export function randIntRange(min, max) {
  return randInt(max - min + 1, min);
}
export function randItem(items) {
  return items.length === 1 ? items[0] : items[randInt(items.length)];
}
export function toDmgValue(value, minValue = 1) {
  return Math.max(Math.floor(value), minValue);
}
/**
 * Check if a number is **inclusively** between two numbers.
 * @param num - the number to check
 * @param min - the minimum value (inclusive)
 * @param max - the maximum value (inclusive)
 * @returns Whether num is no less than min and no greater than max
 */
export function isBetween(num, min, max) {
  return min <= num && num <= max;
}
/**
 * If the input isn't already an array, turns it into one.
 * @returns An array with the same type as the type of the input
 */
export function coerceArray(input) {
  return Array.isArray(input) ? input : [input];
}
/**
 * Make PORYGON_Z become Porygon Z
 */
export function capitalize(word = "") {
  return word
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
export function toCamelCase(word = "") {
  return word.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}
