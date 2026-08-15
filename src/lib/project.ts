/**
 * Slate — project model.
 *
 * Serialization helpers, defensive normalization for older/imported project
 * shapes, the non-destructive global adjustment lens, and the contrast
 * accessibility map used by the palette inspector.
 */

import { clamp, hexToHsl, hslToHex } from './color';
import { DEFAULT_MASTERS } from './masters';
import type { Adjust, Masters, Project } from './types';

export const emptyProject = (name = 'Untitled Theme'): Project => ({
  name,
  masters: { ...DEFAULT_MASTERS },
  overrides: {},
  wallpaper: null,
  adjust: { hue: 0, sat: 0, light: 0 },
});

/**
 * Defensively fills in any fields missing from older/imported project shapes
 * (e.g. projects saved before the adjustment layer or gradient wallpapers).
 */
export function normalizeProject(proj: Partial<Project> | null | undefined): Project {
  return {
    name: proj?.name || 'Untitled Theme',
    masters: { ...DEFAULT_MASTERS, ...(proj?.masters || {}) },
    overrides: proj?.overrides || {},
    wallpaper: proj?.wallpaper || null,
    adjust: { hue: 0, sat: 0, light: 0, ...(proj?.adjust || {}) },
  };
}

/** Apply the non-destructive global adjustment lens over all masters. */
export function applyGlobalAdjust(masters: Masters, adjust?: Adjust | null): Masters {
  if (!adjust || (!adjust.hue && !adjust.sat && !adjust.light)) return masters;
  const out: Masters = { ...masters };
  for (const [k, v] of Object.entries(masters)) {
    const { h, s, l, a } = hexToHsl(v);
    (out as Record<string, string>)[k] = hslToHex(
      h + (adjust.hue || 0),
      clamp(s + (adjust.sat || 0), 0, 100),
      clamp(l + (adjust.light || 0), 0, 100),
      a,
    );
  }
  return out;
}

/** Which background each text-role semantic key is read against (for contrast badges). */
export const CONTRAST_PAIRS: Record<string, string> = {
  textPrimary: 'bgPrimary',
  textSecondary: 'bgPrimary',
  textLink: 'bgPrimary',
  textTertiary: 'bgPrimary',
  bubbleInText: 'bubbleInBg',
  bubbleInLink: 'bubbleInBg',
  bubbleInTime: 'bubbleInBg',
  bubbleOutText: 'bubbleOutBg',
  bubbleOutLink: 'bubbleOutBg',
  bubbleOutTime: 'bubbleOutBg',
  headerText: 'headerBg',
  headerSubtext: 'headerBg',
  listName: 'listBg',
  listMessage: 'listBg',
  listDate: 'listBg',
  inputText: 'inputBg',
  inputPlaceholder: 'inputBg',
  menuText: 'menuBg',
  menuIcon: 'menuBg',
  fileNameIn: 'bubbleInBg',
  fileNameOut: 'bubbleOutBg',
  forwardedNameIn: 'bubbleInBg',
  forwardedNameOut: 'bubbleOutBg',
  pinnedBarTitle: 'pinnedBarBg',
  pinnedBarMessage: 'pinnedBarBg',
};

export type ContrastLevel = 'good' | 'ok' | 'bad';

export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 4.5) return 'good';
  if (ratio >= 3) return 'ok';
  return 'bad';
}
