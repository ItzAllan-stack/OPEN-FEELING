import type { EmotionMeta } from '../constants/emotions.ts';

interface Rgb { r: number; g: number; b: number; }
interface Hsl { h: number; s: number; l: number; }

function hexToRgb(hex: string): Rgb | null {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return null;
  const num = parseInt(cleaned, 16);
  if (Number.isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHsl(r: number, g: number, b: number): Hsl | null {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d) + (gn < bn ? 6 : 0);
  else if (max === gn) h = ((bn - rn) / d) + 2;
  else h = ((rn - gn) / d) + 4;
  return { h: h * 60, s, l };
}

/**
 * Gentle pace for ambient motion: calmer emotions drift a little slower than
 * agitated ones. Returns a multiplier close to 1 for a neutral mood.
 */
export function getAmbientPace(emotions: EmotionMeta[]): number {
  const valid = emotions.filter((e) => e?.dotColor);
  if (valid.length === 0) return 1;
  let lightnessSum = 0;
  let count = 0;
  for (const emotion of valid) {
    const rgb = hexToRgb(emotion.dotColor);
    const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
    if (!hsl) continue;
    lightnessSum += hsl.l;
    count += 1;
  }
  if (count === 0) return 1;
  const avgLightness = lightnessSum / count;
  return Math.round((0.78 + avgLightness * 0.4) * 100) / 100;
}