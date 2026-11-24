import type { EmotionMeta } from '../constants/emotions.ts';

export type TimeOfDay = 'dawn' | 'day' | 'dusk';

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
 * Rough time-of-day tone: dawn is soft and warm, day is neutral, and dusk is
 * deeper and quieter.
 */
export function getTimeOfDay(hour: number = new Date().getHours()): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'dawn';
  if (hour >= 12 && hour < 18) return 'day';
  if (hour >= 18) return 'dusk';
  return 'day';
}

/**
 * Blend a soft, warm, desaturated ambient tint from the emotions that are
 * present in a set of reflections. Returns null when there is nothing to feel
 * yet, so callers can fall back to the calm default canvas.
 *
 * The time-of-day shifts the wash slightly: lighter at dawn, deeper at dusk.
 */
export function getAmbientColor(emotions: EmotionMeta[], timeOfDay: TimeOfDay = getTimeOfDay()): string | null {
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
  const lBase = lightnessSum / count + 0.12;
  const shifted =
    timeOfDay === 'dawn' ? Math.min(0.99, lBase + 0.05) : timeOfDay === 'dusk' ? lBase - 0.05 : lBase;
  const lightness = Math.max(0.4, Math.min(0.99, shifted));

  // Soft pastel wash: low saturation, lifted lightness, never a raw brand hue.
  return `hsl(${Math.round(hue)}, 34%, ${Math.round(lightness * 100)}%)`;
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
  // Calm moods (high lightness) drift slower; agitated ones drift a touch faster.
  return Math.round((0.78 + avgLightness * 0.4) * 100) / 100;
}
