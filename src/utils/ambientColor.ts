import type { EmotionMeta } from '../constants/emotions.ts';

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function hexToRgb(hex: string): Rgb | null {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return null;
  const num = parseInt(cleaned, 16);
  if (Number.isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHsl(r: number, g: number, b: number): Hsl | null {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
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
 * Blend a soft, warm, desaturated ambient tint from the emotions that are
 * present in a set of reflections. Returns null when there is nothing to feel
 * yet, so callers can fall back to the calm default canvas.
 */
export function getAmbientColor(emotions: EmotionMeta[]): string | null {
  const valid = emotions.filter((e) => e?.dotColor);
  if (valid.length === 0) return null;

  let hueSum = 0;
  let lightnessSum = 0;
  let count = 0;
  for (const emotion of valid) {
    const rgb = hexToRgb(emotion.dotColor);
    const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
    if (!hsl) continue;
    hueSum += hsl.h;
    lightnessSum += hsl.l;
    count += 1;
  }
  if (count === 0) return null;

  const hue = hueSum / count;
  const lightness = lightnessSum / count;
  // Soft pastel wash: low saturation, lifted lightness, never a raw brand hue.
  const l = Math.min(0.97, lightness + 0.12);
  return `hsl(${Math.round(hue)}, 34%, ${Math.round(l * 100)}%)`;
}
