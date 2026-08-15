/**
 * Slate — global adjustments.
 *
 * A non-destructive hue/saturation/lightness lens over every master color.
 * "Bake" commits the lens into the masters themselves.
 */

import { RotateCcw } from 'lucide-react';

import type { Adjust } from '../../lib/types';

interface GlobalAdjustPanelProps {
  adjust: Adjust;
  onChange: (next: Adjust) => void;
  onBake: () => void;
  onReset: () => void;
}

const DIMS: Array<{ key: keyof Adjust; label: string; min: number; max: number; suffix: string }> = [
  { key: 'hue', label: 'Hue', min: -180, max: 180, suffix: '°' },
  { key: 'sat', label: 'Saturation', min: -100, max: 100, suffix: '%' },
  { key: 'light', label: 'Lightness', min: -100, max: 100, suffix: '%' },
];

export function GlobalAdjustPanel({ adjust, onChange, onBake, onReset }: GlobalAdjustPanelProps) {
  const dirty = adjust.hue !== 0 || adjust.sat !== 0 || adjust.light !== 0;

  return (
    <div className="slate-adjust-panel">
      <div className="slate-group-label" style={{ marginBottom: 10 }}>
        Global Adjustments
      </div>
      {DIMS.map((d) => (
        <div className="slate-adjust-row" key={d.key}>
          <span className="slate-adjust-label">{d.label}</span>
          <input
            type="range"
            min={d.min}
            max={d.max}
            value={adjust[d.key]}
            className="slate-slider"
            onChange={(e) => onChange({ ...adjust, [d.key]: +e.target.value })}
          />
          <span className="slate-adjust-value">
            {adjust[d.key] > 0 ? '+' : ''}
            {adjust[d.key]}
            {d.suffix}
          </span>
        </div>
      ))}
      {dirty && (
        <div className="slate-adjust-actions">
          <button className="slate-btn sm" style={{ flex: 1 }} onClick={onBake}>
            Bake into Colors
          </button>
          <button className="slate-btn sm ghost" onClick={onReset}>
            <RotateCcw size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
