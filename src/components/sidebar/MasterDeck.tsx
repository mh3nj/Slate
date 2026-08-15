/**
 * Slate — master deck.
 *
 * The ~23 high-level color controls rendered as a grid of full-width tiles,
 * grouped by MASTER_GROUPS. Each tile opens the shared color popover.
 */

import { useRef, useState } from 'react';

import { MASTER_DEFS, MASTER_GROUPS } from '../../lib/masters';
import type { Masters } from '../../lib/types';
import { ColorPopover } from '../ui/ColorControl';

interface MasterDeckProps {
  masters: Masters;
  onMasterChange: (key: string, value: string) => void;
  search: string;
}

export function MasterDeck({ masters, onMasterChange, search }: MasterDeckProps) {
  const q = search.trim().toLowerCase();
  const groups = MASTER_GROUPS.map((g) => ({
    ...g,
    items: MASTER_DEFS.filter(
      (d) => d.group === g.id && (!q || d.label.toLowerCase().includes(q)),
    ),
  })).filter((g) => g.items.length);

  if (q && !groups.length) return null;

  return (
    <div>
      {groups.map((g) => (
        <div key={g.id} className="slate-master-group">
          <div className="slate-group-label">{g.label}</div>
          <div className="slate-master-grid">
            {g.items.map((d) => (
              <div key={d.key} className="slate-master-cell">
                <ColorControlBlock
                  hex={masters[d.key]}
                  onChange={(v) => onMasterChange(d.key as string, v)}
                />
                <span className="slate-master-label">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Full-width square master tile wired to the color popover. */
function ColorControlBlock({ hex, onChange }: { hex: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <div
        className="slate-master-swatch"
        style={{ background: hex, cursor: 'pointer' }}
        onClick={() => {
          const el = ref.current;
          if (el) setRect(el.getBoundingClientRect());
          setOpen(true);
        }}
      />
      {open && <ColorPopover hex={hex} anchorRect={rect} onChange={onChange} onClose={() => setOpen(false)} />}
    </div>
  );
}
