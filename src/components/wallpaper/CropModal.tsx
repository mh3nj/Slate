/**
 * Slate — wallpaper cropping modal.
 *
 * Upload an image, drag a 16:9 (or freeform) crop box, and rasterize the
 * selection to a 1920x1080 JPEG data URL ready for preview + export.
 */

import { useEffect, useRef, useState } from 'react';
import { Check, Crop as CropIcon, Lock, Unlock, X } from 'lucide-react';

import { clamp } from '../../lib/color';
import { IconBtn } from '../ui/IconBtn';

const DISPLAY_W = 560;
const DISPLAY_H = 380;

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
  dw: number;
  dh: number;
  scale: number;
}

interface CropModalProps {
  srcDataUrl: string;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}

export function CropModal({ srcDataUrl, onCancel, onConfirm }: CropModalProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<CropBox | null>(null);
  const [locked, setLocked] = useState(true);
  const dragRef = useRef<{ mode: string; startX: number; startY: number; startBox: CropBox } | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(DISPLAY_W / img.width, DISPLAY_H / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const bw = Math.min(dw, dh * (16 / 9));
      const bh = bw * (9 / 16);
      const b: CropBox = {
        x: (dw - bw) / 2,
        y: (dh - bh) / 2,
        w: bw,
        h: bh,
        dw,
        dh,
        scale,
      };
      imgRef.current = img;
      setBox(b);
      drawCanvas(img, b);
    };
    img.src = srcDataUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcDataUrl]);

  function drawCanvas(img: HTMLImageElement, b: CropBox) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = b.dw;
    canvas.height = b.dh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, b.dw, b.dh);
    ctx.drawImage(img, 0, 0, b.dw, b.dh);
  }

  useEffect(() => {
    if (imgRef.current && box) drawCanvas(imgRef.current, box);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box]);

  const onDrag = (e: MouseEvent) => {
    if (!dragRef.current) return;
    const { mode, startX, startY, startBox } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    setBox((prev) => {
      if (!prev) return prev;
      let { x, y, w, h, dw, dh, scale } = startBox;
      if (mode === 'move') {
        x = clamp(startBox.x + dx, 0, dw - w);
        y = clamp(startBox.y + dy, 0, dh - h);
      } else if (mode === 'resize-br') {
        w = clamp(startBox.w + dx, 40, dw - startBox.x);
        h = locked ? (w * 9) / 16 : clamp(startBox.h + dy, 30, dh - startBox.y);
        if (locked && startBox.y + h > dh) h = dh - startBox.y;
        if (locked) w = (h * 16) / 9;
      }
      return { x, y, w, h, dw, dh, scale };
    });
  };

  const endDrag = () => {
    dragRef.current = null;
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', endDrag);
  };

  const startDrag = (e: React.MouseEvent, mode: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!box) return;
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, startBox: { ...box } };
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', endDrag);
  };

  const doCrop = () => {
    if (!imgRef.current || !box) return;
    const out = document.createElement('canvas');
    out.width = 1920;
    out.height = 1080;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    const sx = box.x / box.scale;
    const sy = box.y / box.scale;
    const sw = box.w / box.scale;
    const sh = box.h / box.scale;
    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, 1920, 1080);
    onConfirm(out.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="slate-modal-backdrop" onClick={onCancel}>
      <div className="slate-modal" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <div className="slate-modal-head">
          <CropIcon size={16} />
          <span className="slate-drawer-title">Crop Wallpaper</span>
          <div style={{ flex: 1 }} />
          <button className="slate-btn sm" onClick={() => setLocked((l) => !l)}>
            {locked ? <Lock size={12} /> : <Unlock size={12} />} {locked ? '16:9' : 'Freeform'}
          </button>
          <IconBtn icon={X} onClick={onCancel} title="Cancel" />
        </div>
        <div className="slate-modal-body">
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              width: box?.dw || DISPLAY_W,
              height: box?.dh || DISPLAY_H,
              margin: '0 auto',
              background: '#000',
            }}
          >
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
            {box && (
              <div
                onMouseDown={(e) => startDrag(e, 'move')}
                style={{
                  position: 'absolute',
                  left: box.x,
                  top: box.y,
                  width: box.w,
                  height: box.h,
                  border: '2px solid var(--amber)',
                  boxShadow: '0 0 0 2000px rgba(0,0,0,0.55)',
                  cursor: 'move',
                }}
              >
                <div
                  onMouseDown={(e) => startDrag(e, 'resize-br')}
                  style={{
                    position: 'absolute',
                    right: -6,
                    bottom: -6,
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: 'var(--amber)',
                    cursor: 'nwse-resize',
                  }}
                />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button className="slate-btn" onClick={onCancel}>
              Cancel
            </button>
            <button className="slate-btn primary" onClick={doCrop}>
              <Check size={14} /> Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
