export function drawBox(p, boxStyle) {
    const color = boxStyle.COLOR;
    const colorOutline = boxStyle.COLOR_OUTLINE;
    const sizeOutline = boxStyle.SIZE_OUTLINE;
    const posX = boxStyle.X;
    const posY = boxStyle.Y;
    const sizeX = boxStyle.SIZE_X;
    const sizeY = boxStyle.SIZE_Y
    setDrawData(p, color, sizeOutline, colorOutline);
    deleteCachedBox(boxStyle);
    p.rect(posX, posY, sizeX, sizeY);          
}
import { TextBattleLogData, TextBattleData, TextMenuData } from '../data/text.js';

export function setText(p, content, style, msgIndex) {
    //We want to store a number of lines to be displayed in BattleLog, like Showdown does ?
    if (style === TextBattleData) updateBattleLogText(content);

    const color = style.COLOR;
    const colorOutline = style.COLOR_OUTLINE;
    const sizeOutline = style.SIZE_OUTLINE;
    const posX = style.X;
    const posY = style.Y;
    const size = style.SIZE;
    const maxCharLine = style.MAX_CHAR || 10000;

    setDrawData(p, color, sizeOutline, colorOutline);
    deleteCachedMsg(style); //For later?
    if (content.length <= maxCharLine) {
        if (style === TextMenuData) {
            drawText(p, content, posX, posY + msgIndex * size, size);
            return;
        }
        if (style !== TextBattleLogData) {
            drawText(p, content, posX, posY, size);
            return;
        }
        drawText(p, content, posX, posY + msgIndex * size, size);
        return;
    }
    const lineLength = (content.length / 2 + 1);
    const lines = [];
    for (let i = 0; i < content.length; i += lineLength) {
        lines.push(content.slice(i, i + lineLength));
    }
    const displayLines = lines.slice(0, 2);

    displayLines.forEach((line, index) => {
        drawText(p, line, posX + index * 12 , posY + index * size, size);
    });
}
export function updateBattleLogText(line) {
    //if (GlobalData.BATTLE_LOG.lenght >= TextBattleLogData.MAX_LINE) remove first item in array
    //add item to the next index in the array
}
export function deleteCachedBox(style) {
   //if (style.ID === 0) 
   //if (style.ID === 1) 
   //if (style.ID === 2) 
   //if (style.ID === 3) 
}
export function deleteCachedMsg(style) {
   //if (style.ID === 0) 
   //if (style.ID === 1) 
   //if (style.ID === 2) 
   //if (style.ID === 3) 
}
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
    p.rect(x, y, length, width)
}
export function drawCircle(p, x, y, size) {
    p.circle(x, y, size)
}