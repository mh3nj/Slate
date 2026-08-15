/**
 * Slate — wallpaper helpers.
 *
 * Rasterizes gradients for export and computes the live CSS background used
 * by both preview frames.
 */

import type { CSSProperties } from 'react';

import { mix } from './color';
import type { Palette, Wallpaper } from './types';
import { base64ToUint8Array, downloadBlob } from './zip';

/**
 * Rasterize a gradient into a data URL (JPEG by default, PNG for wallpapers).
 * Used both for .tdesktop-theme bundles and standalone wallpaper exports.
 */
export function rasterizeGradientDataUrl(
  stops: [string, string],
  angle: number,
  w = 1920,
  h = 1080,
  mime: 'image/jpeg' | 'image/png' = 'image/jpeg',
): string {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const rad = (angle * Math.PI) / 180;
  const x1 = w / 2 - (Math.cos(rad) * w) / 2;
  const y1 = h / 2 - (Math.sin(rad) * h) / 2;
  const x2 = w / 2 + (Math.cos(rad) * w) / 2;
  const y2 = h / 2 + (Math.sin(rad) * h) / 2;
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, stops[0]);
  grad.addColorStop(1, stops[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  return mime === 'image/png'
    ? canvas.toDataURL('image/png')
    : canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Download the current wallpaper as a standalone image file.
 *
 * Gradients are rendered at phone-wallpaper resolution (1080×2340) as lossless
 * PNG; photo wallpapers are downloaded at their stored 1920×1080 resolution.
 * Returns false when there is no wallpaper to export.
 */
export function downloadWallpaperImage(wallpaper: Wallpaper, baseName: string): boolean {
  if (!wallpaper) return false;
  if (wallpaper.kind === 'gradient') {
    const dataUrl = rasterizeGradientDataUrl(
      wallpaper.stops,
      wallpaper.angle,
      1080,
      2340,
      'image/png',
    );
    downloadBlob(base64ToUint8Array(dataUrl), `${baseName}-wallpaper.png`, 'image/png');
    return true;
  }
  if (wallpaper.dataUrl) {
    downloadBlob(
      base64ToUint8Array(wallpaper.dataUrl),
      `${baseName}-wallpaper.jpg`,
      'image/jpeg',
    );
    return true;
  }
  return false;
}

/** Compute the live CSS background for the chat body of both previews. */
export function wallpaperCssBackground(
  wallpaper: Wallpaper,
  p: Palette,
): CSSProperties {
  const fallback = {
    background: `linear-gradient(165deg, ${p.bgPrimary}, ${mix(p.bgPrimary, p.accentPrimary, 0.08)})`,
  };
  if (!wallpaper) return fallback;
  if (wallpaper.kind === 'gradient') {
    return {
      background: `linear-gradient(${wallpaper.angle}deg, ${wallpaper.stops[0]}, ${wallpaper.stops[1]})`,
    };
  }
  if (wallpaper.dataUrl) {
    return {
      backgroundColor: p.bgPrimary,
      backgroundImage: `linear-gradient(${p.bgOverlay}, ${p.bgOverlay}), url(${wallpaper.dataUrl})`,
      backgroundSize: wallpaper.mode === 'tile' ? '240px' : 'cover',
      backgroundRepeat: wallpaper.mode === 'tile' ? 'repeat' : 'no-repeat',
      filter: wallpaper.blur ? `blur(${wallpaper.blur}px)` : undefined,
    };
  }
  return fallback;
}
