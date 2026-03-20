export const Input = {
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