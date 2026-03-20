export function FpsRecorder() {
    return {
        fps: 0,
        lastNow: 0,

        update() {
            const now = performance.now();
            const deltaMs = now - this.lastNow;

            if (deltaMs > 0) {
                const currentFps = Math.round(1000 / deltaMs);
                if (currentFps !== this.fps) {
                    this.fps = currentFps;
                }
            }
            this.lastNow = now;
        }
    }
}