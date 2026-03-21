export function drawText(p, text, x, y, size, alignX, alignY, style) {
    p.textSize(size || 0);
    p.textAlign(alignX || p.LEFT, alignY || p.BASELINE);
    p.textStyle(style || p.NORMAL);
    p.text(text, x, y);
}
export function setDrawData(p, color, stroke, strokeColor) {
    if (stroke && (strokeColor || strokeColor == 0)) {
        p.strokeWeight(stroke);
        if (Array.isArray(strokeColor)) {
            p.stroke(...strokeColor);
        } else {
            p.stroke(strokeColor);
        }
    } else {
        p.noStroke();
    }
    if (color || color == 0) {
        if (Array.isArray(color)) {
            p.fill(...color);
        } else {
            p.fill(color);
        }
    } else {
        p.noFill();
    }
}

//I don't think these will be used but they stay for now
export function drawRect(p, x, y, length, width) {
    p.rect(x, y, length, width);
}
export function drawCircle(p, x, y, size) {
    p.circle(x, y, size);
}