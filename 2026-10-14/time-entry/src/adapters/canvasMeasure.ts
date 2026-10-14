import type { TextMeasure } from '../ports';

let context: CanvasRenderingContext2D | null = null;

export const canvasMeasure: TextMeasure = {
  width(text, font) {
    context ??= document.createElement('canvas').getContext('2d');
    if (!context) return text.length * font.sizePx * 0.5;
    context.font = `${font.weight} ${font.sizePx}px ${font.family}`;
    return context.measureText(text).width;
  },
  ready: () => (document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve()),
};
