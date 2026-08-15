/**
 * Slate — preview capture.
 *
 * Exports the on-screen device previews (phone + desktop frames) as a single
 * high-resolution picture, with zero third-party dependencies.
 *
 * How it works:
 *   1. The live frame DOM nodes are cloned and layered into an SVG
 *      <foreignObject>, with the app's own stylesheet embedded so the clones
 *      render pixel-for-pixel like the stage preview.
 *   2. The SVG is rasterized onto a canvas at a high scale factor (3× by
 *      default → crisp, "super high quality" exports).
 *   3. The canvas is exported as a PNG and handed back as a data URL.
 *
 * Chromium and Firefox rasterize SVG-foreignObject natively. Browsers that
 * can't (some older Safari builds) throw {@link CaptureUnsupportedError} —
 * callers can then fall back to `captureFramesToSvg()` and download the SVG
 * document instead, which renders identically in any SVG viewer.
 */

export class CaptureUnsupportedError extends Error {
  constructor() {
    super('This browser cannot rasterize SVG foreignObject content.');
    this.name = 'CaptureUnsupportedError';
  }
}

export interface CaptureOptions {
  /** Raster scale factor (device pixels per logical px). Default 3. */
  scale?: number;
  /** Padding around the frames inside the exported picture (logical px). Default 48. */
  padding?: number;
  /** Gap between frames (logical px). Default 32. */
  gap?: number;
  /** Background color of the exported picture. Default #0a0c11 (studio ink). */
  background?: string;
}

const DEFAULT_BG = '#0a0c11';

/* --------------------------------- helpers -------------------------------- */

/**
 * Escape CSS text for safe embedding inside an SVG `<style>` element.
 * Character references round-trip through both the HTML and XML parsers, so
 * escaping `&`, `<` and `>` here cannot corrupt selectors or declarations.
 */
function escapeStyle(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Concatenate every accessible stylesheet rule in the document. */
function collectCssText(): string {
  const parts: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        // Skip @import — external fonts can't load inside an SVG image anyway.
        if (rule.type === CSSRule.IMPORT_RULE) continue;
        parts.push(rule.cssText);
      }
    } catch {
      /* cross-origin stylesheet — skip */
    }
  }
  return parts.join('\n');
}

/**
 * Measure frame sizes, temporarily revealing any `display:none` ancestors
 * (the inactive preview wrapper). All synchronous — the browser never gets a
 * chance to paint the intermediate state.
 */
function measureFrames(frames: HTMLElement[]): { w: number; h: number }[] {
  const revealed: { el: HTMLElement; display: string }[] = [];
  const seen = new Set<HTMLElement>();
  for (const f of frames) {
    let el: HTMLElement | null = f.parentElement;
    while (el && el !== document.body) {
      if (!seen.has(el)) {
        const display = getComputedStyle(el).display;
        if (display === 'none') {
          seen.add(el);
          revealed.push({ el, display });
          el.style.display = 'block';
        }
      }
      el = el.parentElement;
    }
  }
  const sizes = frames.map((f) => ({ w: f.offsetWidth, h: f.offsetHeight }));
  for (const { el, display } of revealed) el.style.display = display;
  return sizes;
}

function parseHexBg(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return h.length >= 6 ? [v(0), v(2), v(4)] : [0, 0, 0];
}

interface Layout {
  W: number;
  H: number;
  svg: string;
}

function layout(frames: HTMLElement[], opts: CaptureOptions): Layout {
  const padding = opts.padding ?? 48;
  const gap = opts.gap ?? 32;
  const bg = opts.background ?? DEFAULT_BG;
  const sizes = measureFrames(frames);
  const innerW =
    sizes.reduce((acc, s) => acc + s.w, 0) + gap * Math.max(0, frames.length - 1);
  const innerH = sizes.reduce((acc, s) => Math.max(acc, s.h), 0);
  const W = Math.max(1, Math.round(innerW + padding * 2));
  const H = Math.max(1, Math.round(innerH + padding * 2));

  const holder = document.createElement('div');
  holder.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  holder.style.cssText = `position:relative;width:${W}px;height:${H}px;background:${bg};`;

  let x = padding;
  frames.forEach((f, i) => {
    const clone = f.cloneNode(true) as HTMLElement;
    clone.style.cssText = `${clone.style.cssText || ''}position:absolute;left:${x}px;top:${padding}px;margin:0;`;
    x += sizes[i].w + gap;
    holder.appendChild(clone);
  });

  const inner = new XMLSerializer().serializeToString(holder);
  const css = escapeStyle(collectCssText());

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<style>${css}</style>` +
    `<rect width="${W}" height="${H}" fill="${bg}"/>` +
    `<foreignObject x="0" y="0" width="${W}" height="${H}">${inner}</foreignObject>` +
    `</svg>`;

  return { W, H, svg };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to rasterize the preview SVG'));
    img.src = src;
  });
}

/**
 * Detect a foreignObject rasterization failure. When it fails, the entire
 * canvas is the SVG background color; when it succeeds, most of the canvas is
 * covered by frame pixels. We grid-sample the canvas and require a meaningful
 * fraction of non-background pixels — robust against rounded frame corners
 * and dark theme colors alike.
 */
function looksUnsupported(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  opts: CaptureOptions,
): boolean {
  const scale = opts.scale ?? 3;
  const [br, bg, bb] = parseHexBg(opts.background ?? DEFAULT_BG);
  const tol = 8;
  const cols = 24;
  const rows = 24;
  let hits = 0;
  let total = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = Math.round(((c + 0.5) / cols) * W * scale);
      const y = Math.round(((r + 0.5) / rows) * H * scale);
      const px = ctx.getImageData(x, y, 1, 1).data;
      total++;
      if (
        Math.abs(px[0] - br) > tol ||
        Math.abs(px[1] - bg) > tol ||
        Math.abs(px[2] - bb) > tol
      ) {
        hits++;
      }
    }
  }
  return hits / total < 0.03; // < 3% non-background → nothing rendered
}

/* ---------------------------------- API ---------------------------------- */

/**
 * Build an SVG document containing the given frames, laid out side by side on
 * the studio background. The SVG is a faithful vector rendition of the stage
 * preview and renders in any browser/SVG viewer.
 */
export function captureFramesToSvg(
  frames: HTMLElement[],
  opts: CaptureOptions = {},
): string {
  return layout(frames, opts).svg;
}

/**
 * Export the given preview frames as a single high-resolution PNG (data URL).
 *
 * @throws CaptureUnsupportedError if the browser can't rasterize the SVG
 * (callers should fall back to {@link captureFramesToSvg}).
 */
export async function captureFramesToPng(
  frames: HTMLElement[],
  opts: CaptureOptions = {},
): Promise<string> {
  if (!frames.length) throw new Error('No frames to capture');
  const { W, H, svg } = layout(frames, opts);
  const scale = opts.scale ?? 3;

  // Load the SVG through a `data:` URL: in Chromium, foreignObject content
  // rasterizes (and stays canvas-clean) from a data: source, while the same
  // SVG from a blob: URL taints the canvas (SecurityError on readback).
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  if (looksUnsupported(ctx, W, H, opts)) throw new CaptureUnsupportedError();
  return canvas.toDataURL('image/png');
}
