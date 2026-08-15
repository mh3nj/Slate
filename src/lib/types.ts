/**
 * Slate — core domain types.
 *
 * These types describe the shape of a Slate project (masters + overrides +
 * wallpaper + global adjustments) and the derived palette that every preview
 * and export consumes.
 */

export type HexColor = string;

/** Non-destructive global adjustment lens applied over all master colors. */
export interface Adjust {
  hue: number;
  sat: number;
  light: number;
}

/** The ~23 master controls that drive the entire theme. */
export interface Masters {
  masterBg: HexColor;
  masterSurface: HexColor;
  masterChatList: HexColor;
  masterHeader: HexColor;
  masterInput: HexColor;
  masterDivider: HexColor;
  masterText: HexColor;
  masterTextMuted: HexColor;
  masterAccent: HexColor;
  masterBubbleIn: HexColor;
  masterBubbleOut: HexColor;
  masterOnline: HexColor;
  masterDestructive: HexColor;
  masterPositive: HexColor;
  masterServiceBg: HexColor;
  masterPeer1: HexColor;
  masterPeer2: HexColor;
  masterPeer3: HexColor;
  masterPeer4: HexColor;
  masterPeer5: HexColor;
  masterPeer6: HexColor;
  masterPeer7: HexColor;
  masterPeer8: HexColor;
  [key: string]: HexColor;
}

export type WallpaperImage = {
  kind: 'image';
  dataUrl: string;
  mode: 'scale' | 'tile';
  blur: number;
};

export type WallpaperGradient = {
  kind: 'gradient';
  stops: [HexColor, HexColor];
  angle: number;
};

export type Wallpaper = WallpaperImage | WallpaperGradient | null;

/** A serializable Slate project — what gets saved, loaded and exported as JSON. */
export interface Project {
  name: string;
  masters: Masters;
  overrides: Record<string, HexColor>;
  wallpaper: Wallpaper;
  adjust: Adjust;
}

/** The fully derived semantic palette (semantic key -> hex). */
export type Palette = Record<string, HexColor>;

/** A stored library entry: project payload + its storage key. */
export interface LibraryItem extends Project {
  key: string;
  savedAt?: number;
}
