/**
 * Slate — harmony utilities.
 *
 * Color-harmony generation (complementary / analogous / triadic / split
 * complementary), plus a seeded randomizer for "surprise me" workflows.
 */

import { adjustLightness, hslToHex, isDarkColor, mix, rotateHue } from './color';
import type { Masters } from './types';

export type HarmonyKind = 'complementary' | 'analogous' | 'triadic' | 'splitComplementary';

/** Generate a harmony patch from an accent color. */
export function harmonize(hex: string, kind: HarmonyKind): Partial<Masters> {
  switch (kind) {
    case 'complementary':
      return { masterAccent: hex, masterPositive: rotateHue(hex, 150) };
    case 'analogous':
      return { masterAccent: hex, masterPeer1: rotateHue(hex, -30), masterPeer4: rotateHue(hex, 30) };
    case 'triadic':
      return { masterAccent: hex, masterPeer1: rotateHue(hex, 120), masterPeer4: rotateHue(hex, 240) };
    case 'splitComplementary':
      return { masterAccent: hex, masterPeer1: rotateHue(hex, 150), masterPeer4: rotateHue(hex, 210) };
    default:
      return { masterAccent: hex };
  }
}

export function randomHex(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 45 + Math.random() * 40;
  const l = 40 + Math.random() * 30;
  return hslToHex(h, s, l);
}

/** Randomize accent + peers into a coherent fresh variation of the current theme. */
export function randomizeMasters(current: Masters): Partial<Masters> {
  const dark = isDarkColor(current.masterBg);
  const accentHue = Math.random() * 360;
  const accent = hslToHex(
    accentHue,
    55 + Math.random() * 30,
    dark ? 52 + Math.random() * 10 : 42 + Math.random() * 10,
  );
  const patch: Partial<Masters> = {
    masterAccent: accent,
    masterBubbleOut: dark ? adjustLightness(accent, -14) : mix(accent, '#ffffff', 0.55),
    masterOnline: hslToHex((accentHue + 100) % 360, 55, dark ? 58 : 45),
  };
  for (let i = 1; i <= 8; i++) {
    patch[`masterPeer${i}`] = hslToHex(
      (accentHue + i * 47) % 360,
      55 + Math.random() * 20,
      dark ? 62 : 46,
    );
  }
  return patch;
}
