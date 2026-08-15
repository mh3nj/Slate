/**
 * Slate — color engine.
 *
 * Pure hex/hsl math: parsing, conversion, contrast, readability and
 * accessibility helpers. No React, no DOM — safe to unit test.
 */

import type { HexColor } from './types';

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
  a: number;
}

/** Parse a #RGB, #RGBA, #RRGGBB or #RRGGBBAA string into 0-255 channels. */
export function parseHex(hex: string): Rgba {
  let h = String(hex || '#000000').trim().replace('#', '');
  if (h.length === 3 || h.length === 4) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (h.length < 6) h = h.padEnd(6, '0');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  const a = h.length >= 8 ? parseInt(h.substring(6, 8), 16) : 255;
  return { r, g, b, a: Number.isNaN(a) ? 255 : a };
}

const toHex2 = (n: number): string =>
  clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');

export function rgbaToHex({ r = 0, g = 0, b = 0, a = 255 }: Partial<Rgba>): HexColor {
  return a < 255
    ? `#${toHex2(r)}${toHex2(g)}${toHex2(b)}${toHex2(a)}`
    : `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number;
  let s: number;
  const l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = (((h % 360) + 360) % 360) / 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
}

export const hexToHsl = (hex: string): Hsl => {
  const { r, g, b, a } = parseHex(hex);
  return { ...rgbToHsl(r, g, b), a };
};

export const hslToHex = (h: number, s: number, l: number, a = 255): HexColor => {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbaToHex({ r, g, b, a });
};

export const adjustLightness = (hex: string, deltaPct: number): HexColor => {
  const { h, s, l, a } = hexToHsl(hex);
  return hslToHex(h, s, clamp(l + deltaPct, 0, 100), a);
};

const setAlpha255 = (hex: string, a255: number): HexColor => {
  const { r, g, b } = parseHex(hex);
  return rgbaToHex({ r, g, b, a: a255 });
};

export const alphaFrac = (hex: string, fraction: number): HexColor =>
  setAlpha255(hex, Math.round(clamp(fraction, 0, 1) * 255));

export function mix(hexA: string, hexB: string, t: number): HexColor {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  t = clamp(t, 0, 1);
  return rgbaToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
    a: Math.round(a.a + (b.a - a.a) * t),
  });
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const lin = (c: number): number => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two colors (1-21). */
export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA) + 0.05;
  const l2 = relativeLuminance(hexB) + 0.05;
  return l1 > l2 ? l1 / l2 : l2 / l1;
}

export const isDarkColor = (hex: string): boolean => relativeLuminance(hex) < 0.5;

/** Best-on-black/white text color for a given background. */
export const pickReadableText = (bgHex: string): HexColor =>
  isDarkColor(bgHex) ? '#F2F4F8' : '#14171F';

/** Walk lightness until the fg/bg pair clears the requested contrast ratio. */
export function ensureContrast(fgHex: string, bgHex: string, minRatio = 2.6): HexColor {
  let { h, s, l } = hexToHsl(fgHex);
  let candidate = fgHex;
  const goingLighter = isDarkColor(bgHex);
  let iterations = 0;
  while (contrastRatio(candidate, bgHex) < minRatio && iterations < 40) {
    l = clamp(l + (goingLighter ? 3 : -3), 0, 100);
    candidate = hslToHex(h, s, l);
    iterations++;
  }
  return candidate;
}

export const rotateHue = (hex: string, degrees: number): HexColor => {
  const { h, s, l, a } = hexToHsl(hex);
  return hslToHex(h + degrees, s, l, a);
};

/** Elevate a surface toward "higher" (lighter in light themes, darker in dark). */
export const elevate = (hex: string, deltaPct: number): HexColor =>
  adjustLightness(hex, isDarkColor(hex) ? deltaPct : -deltaPct);
