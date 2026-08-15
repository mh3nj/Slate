/**
 * Slate — harmony menu.
 *
 * Generates complementary / analogous / triadic / split-complementary palettes
 * from the current accent, plus a seeded "Surprise Me" randomizer.
 */

import { Sparkles } from 'lucide-react';

import { harmonize, randomHex, type HarmonyKind } from '../lib/harmony';
import type { Masters } from '../lib/types';

const KINDS: Array<{ id: HarmonyKind; label: string }> = [
  { id: 'complementary', label: 'Complementary' },
  { id: 'analogous', label: 'Analogous' },
  { id: 'triadic', label: 'Triadic' },
  { id: 'splitComplementary', label: 'Split Complement' },
];

interface HarmonyMenuProps {
  masters: Masters;
  onApply: (patch: Partial<Masters>) => void;
  onClose: () => void;
}

export function HarmonyMenu({ masters, onApply, onClose }: HarmonyMenuProps) {
  return (
    <>
      <div className="slate-popover-backdrop" onClick={onClose} />
      <div
        className="slate-popover"
        style={{ top: 52, right: 200, left: 'auto', width: 210 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="slate-field-label" style={{ marginBottom: 10 }}>
          Generate from Accent
        </div>
        {KINDS.map((k) => {
          const preview = harmonize(masters.masterAccent, k.id);
          return (
            <button
              key={k.id}
              className="slate-btn"
              style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 6 }}
              onClick={() => {
                onApply(harmonize(masters.masterAccent, k.id));
                onClose();
              }}
            >
              <div style={{ display: 'flex', marginRight: 4 }}>
                {Object.values(preview).map((c, i) => (
                  <span
                    key={i}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: c,
                      marginLeft: i ? -4 : 0,
                      border: '1.5px solid var(--ink-2)',
                    }}
                  />
                ))}
              </div>
              {k.label}
            </button>
          );
        })}
        <button
          className="slate-btn"
          style={{ width: '100%', justifyContent: 'flex-start' }}
          onClick={() => {
            onApply({ masterAccent: randomHex() });
            onClose();
          }}
        >
          <Sparkles size={13} /> Surprise Me
        </button>
      </div>
    </>
  );
}
