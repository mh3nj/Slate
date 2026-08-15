/**
 * Slate — wallpaper panel.
 *
 * Photo wallpapers (upload → crop), gradient wallpapers (two stops + angle),
 * and per-mode controls (fill/tile/blur) — all wired into the project state.
 */

import { useRef, useState } from 'react';
import { Download, Image as ImageIcon, Palette, Trash2, Wand2 } from 'lucide-react';

import { randomHex } from '../../lib/harmony';
import type { Wallpaper } from '../../lib/types';
import { ColorControl } from '../ui/ColorControl';
import { SegmentedControl } from '../ui/SegmentedControl';
import { CropModal } from './CropModal';

interface WallpaperPanelProps {
  wallpaper: Wallpaper;
  setWallpaper: (updater: Wallpaper | ((prev: Wallpaper) => Wallpaper)) => void;
  onExportWallpaper?: () => void;
}

export function WallpaperPanel({ wallpaper, setWallpaper, onExportWallpaper }: WallpaperPanelProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const kind = wallpaper ? wallpaper.kind : null;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startGradient = () =>
    setWallpaper({ kind: 'gradient', stops: ['#2b5278', '#0e1621'], angle: 145 });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg"
        style={{ display: 'none' }}
        onChange={onFile}
      />

      {!kind && (
        <>
          <button className="slate-btn sm" onClick={() => fileRef.current?.click()}>
            <ImageIcon size={13} /> Photo Wallpaper
          </button>
          <button className="slate-btn sm" onClick={startGradient}>
            <Palette size={13} /> Gradient Wallpaper
          </button>
        </>
      )}

      {wallpaper?.kind === 'image' && (
        <>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              backgroundImage: `url(${wallpaper?.dataUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid var(--line)',
            }}
          />
          <SegmentedControl
            options={[
              { id: 'scale', label: 'Fill' },
              { id: 'tile', label: 'Tile' },
            ]}
            value={wallpaper?.kind === 'image' ? wallpaper.mode : 'scale'}
            onChange={(m) =>
              setWallpaper((w) => (w ? { ...w, mode: m as 'scale' | 'tile' } : w))
            }
          />
          <button
            className="slate-btn sm"
            onClick={() =>
              setWallpaper((w) =>
                w && w.kind === 'image' ? { ...w, blur: w.blur ? 0 : 14 } : w,
              )
            }
          >
            {wallpaper?.kind === 'image' && wallpaper.blur ? 'Blur On' : 'Blur Off'}
          </button>
          <button className="slate-btn sm" onClick={() => fileRef.current?.click()}>
            Replace
          </button>
          {onExportWallpaper && (
            <button
              className="slate-btn sm"
              title="Export this wallpaper as an image file"
              onClick={onExportWallpaper}
            >
              <Download size={12} />
            </button>
          )}
          <button className="slate-btn sm danger" onClick={() => setWallpaper(null)}>
            <Trash2 size={12} />
          </button>
        </>
      )}

      {wallpaper?.kind === 'gradient' && (
        <>
          <GradientStopEditor wallpaper={wallpaper} setWallpaper={setWallpaper} />
          <button
            className="slate-btn sm"
            title="Shuffle gradient colors"
            onClick={() =>
              setWallpaper((w) =>
                w && w.kind === 'gradient'
                  ? { ...w, stops: [randomHex(), randomHex()] }
                  : w,
              )
            }
          >
            <Wand2 size={12} />
          </button>
          {onExportWallpaper && (
            <button
              className="slate-btn sm"
              title="Export this wallpaper as an image file"
              onClick={onExportWallpaper}
            >
              <Download size={12} />
            </button>
          )}
          <button className="slate-btn sm danger" onClick={() => setWallpaper(null)}>
            <Trash2 size={12} />
          </button>
        </>
      )}

      {cropSrc && (
        <CropModal
          srcDataUrl={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={(dataUrl) => {
            setWallpaper({ kind: 'image', dataUrl, mode: 'scale', blur: 0 });
            setCropSrc(null);
          }}
        />
      )}
    </div>
  );
}

function GradientStopEditor({
  wallpaper,
  setWallpaper,
}: {
  wallpaper: Wallpaper;
  setWallpaper: (updater: Wallpaper | ((prev: Wallpaper) => Wallpaper)) => void;
}) {
  const stops = wallpaper?.kind === 'gradient' ? wallpaper.stops : ['#2b5278', '#0e1621'];
  const angle = wallpaper?.kind === 'gradient' ? wallpaper.angle : 145;
  return (
    <>
      <ColorControl
        hex={stops[0]}
        size="sm"
        onChange={(v) =>
          setWallpaper((w) => (w && w.kind === 'gradient' ? { ...w, stops: [v, w.stops[1]] } : w))
        }
      />
      <ColorControl
        hex={stops[1]}
        size="sm"
        onChange={(v) =>
          setWallpaper((w) => (w && w.kind === 'gradient' ? { ...w, stops: [w.stops[0], v] } : w))
        }
      />
      <input
        type="range"
        min={0}
        max={360}
        value={angle}
        className="slate-slider"
        style={{ width: 70 }}
        onChange={(e) =>
          setWallpaper((w) => (w && w.kind === 'gradient' ? { ...w, angle: +e.target.value } : w))
        }
        title={`Angle: ${angle}°`}
      />
    </>
  );
}
