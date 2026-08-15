/**
 * Slate — color control.
 *
 * `ColorControl` renders a swatch that opens a HSL + hex `ColorPopover`.
 * The popover positions itself relative to the anchor and flips when it
 * would overflow the viewport.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { hexToHsl, hslToHex } from '../../lib/color';
import { Swatch } from './IconBtn';

interface ColorPopoverProps {
  hex: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  anchorRect?: DOMRect | null;
}

export function ColorPopover({ hex, onChange, onClose, anchorRect }: ColorPopoverProps) {
  const { h, s, l, a } = hexToHsl(hex);
  const [hexText, setHexText] = useState(hex.replace('#', '').toUpperCase());
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHexText(hex.replace('#', '').toUpperCase());
  }, [hex]);

  // The popover is portaled to the app root (see below) so it escapes the
  // scrollable/transformed sidebar while still inheriting the studio's CSS
  // variables. It's anchored to the viewport (position: fixed) and placed
  // using the swatch's real viewport rect and the popover's *measured* size,
  // flipping above/below when it would overflow. Runs before paint, so the
  // user never sees the popover anywhere but in its final spot.
  useLayoutEffect(() => {
    const el = popRef.current;
    if (!el || !anchorRect) return;
    const popW = el.offsetWidth;
    const popH = el.offsetHeight;
    const pad = 10;
    let top = anchorRect.bottom + 8;
    let left = anchorRect.left;
    if (left + popW + pad > window.innerWidth) {
      left = Math.max(pad, window.innerWidth - popW - pad);
    }
    if (top + popH + pad > window.innerHeight) {
      top = Math.max(pad, anchorRect.top - popH - 8);
    }
    el.style.top = `${Math.round(top)}px`;
    el.style.left = `${Math.round(left)}px`;
  }, [anchorRect]);

  const commitHex = (val: string) => {
    const cleaned = val.trim().replace('#', '');
    if (
      /^[0-9a-fA-F]{6}$/.test(cleaned) ||
      /^[0-9a-fA-F]{8}$/.test(cleaned) ||
      /^[0-9a-fA-F]{3}$/.test(cleaned)
    ) {
      onChange('#' + cleaned);
    }
  };

  // Portal to the app root, not document.body: the studio's design tokens
  // (--ink-*, --font-*, …) live on .slate-root, so the popover keeps its real
  // background/border/shadow while remaining viewport-anchored (fixed) and
  // immune to the sidebar's transforms and scroll containers.
  const rootEl = document.querySelector<HTMLElement>('.slate-root') ?? document.body;

  return createPortal(
    <>
      <div className="slate-popover-backdrop" onClick={onClose} />
      <div
        className="slate-popover"
        style={{ position: 'fixed', top: -9999, left: -9999 }}
        ref={popRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="slate-popover-preview">
          <div className="slate-popover-preview-fill" style={{ background: hex }} />
        </div>
        <div className="slate-slider-row">
          <div className="slate-slider-label">
            <span>Hue</span>
            <span>{Math.round(h)}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            value={h}
            className="slate-slider"
            style={{
              background:
                'linear-gradient(90deg, red, yellow, lime, cyan, blue, magenta, red)',
              borderRadius: 5,
            }}
            onChange={(e) => onChange(hslToHex(+e.target.value, s, l, a))}
          />
        </div>
        <div className="slate-slider-row">
          <div className="slate-slider-label">
            <span>Saturation</span>
            <span>{Math.round(s)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={s}
            className="slate-slider"
            style={{
              background: `linear-gradient(90deg, ${hslToHex(h, 0, l)}, ${hslToHex(h, 100, l)})`,
              borderRadius: 5,
            }}
            onChange={(e) => onChange(hslToHex(h, +e.target.value, l, a))}
          />
        </div>
        <div className="slate-slider-row">
          <div className="slate-slider-label">
            <span>Lightness</span>
            <span>{Math.round(l)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={l}
            className="slate-slider"
            style={{
              background: `linear-gradient(90deg, #000, ${hslToHex(h, s, 50)}, #fff)`,
              borderRadius: 5,
            }}
            onChange={(e) => onChange(hslToHex(h, s, +e.target.value, a))}
          />
        </div>
        <div className="slate-slider-row" style={{ marginBottom: 4 }}>
          <div className="slate-slider-label">
            <span>Alpha</span>
            <span>{Math.round((a / 255) * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={255}
            value={a}
            className="slate-slider"
            style={{
              background: `linear-gradient(90deg, transparent, ${hslToHex(h, s, l)})`,
              borderRadius: 5,
            }}
            onChange={(e) => onChange(hslToHex(h, s, l, +e.target.value))}
          />
        </div>
        <input
          className="slate-hex-input"
          value={hexText}
          onChange={(e) => {
            setHexText(e.target.value.toUpperCase());
            commitHex(e.target.value);
          }}
          spellCheck={false}
        />
        <div className="slate-popover-footer">
          <button className="slate-btn sm" style={{ flex: 1 }} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </>,
    rootEl,
  );
}

interface ColorControlProps {
  hex: string;
  onChange: (hex: string) => void;
  size?: 'sm' | 'md';
}

/** A swatch wired to a positioned color popover. */
export function ColorControl({ hex, onChange, size = 'md' }: ColorControlProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={btnRef} style={{ display: 'inline-block' }}>
      <Swatch
        hex={hex}
        size={size}
        onClick={() => {
          const el = btnRef.current;
          if (el) setRect(el.getBoundingClientRect());
          setOpen(true);
        }}
      />
      {open && (
        <ColorPopover hex={hex} anchorRect={rect} onChange={onChange} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
