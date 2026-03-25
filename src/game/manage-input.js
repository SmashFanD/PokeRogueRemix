export const Input = {
  COOLDOWN: 0,
  COOLDOWN_MAX: 10,
  keys: new Set(),
  init() {
    document.addEventListener('keydown', (e) => this.keys.add(e.key));
    document.addEventListener('keyup', (e) => this.keys.delete(e.key));
  }
};

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
export function updateIndexY(yIndex, yLength, keyEvent) {
    let dy = 0
    if (keyEvent.key === 'ArrowUp') dy -= 1
    if (keyEvent.key === 'ArrowDown') dy += 1
    return (yIndex + dy + yLength) % yLength
}