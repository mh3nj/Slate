/**
 * Slate — full palette inspector.
 *
 * Every derived semantic color, grouped by category and filterable. Shows a
 * live WCAG contrast badge where a text role is read against a background,
 * and marks colors that have been manually overridden.
 */

import { RotateCcw, Search } from 'lucide-react';

import { contrastRatio } from '../../lib/color';
import { contrastLevel, CONTRAST_PAIRS } from '../../lib/project';
import { CATEGORY_DEFS, SEMANTIC_DEFS, SEMANTIC_LABELS } from '../../lib/semantic';
import type { Palette } from '../../lib/types';
import { Collapsible } from '../ui/Collapsible';
import { ColorControl } from '../ui/ColorControl';

interface FullPaletteInspectorProps {
  palette: Palette;
  overrides: Record<string, string>;
  onOverride: (key: string, value: string) => void;
  onReset: (key: string) => void;
  search: string;
}

export function FullPaletteInspector({
  palette,
  overrides,
  onOverride,
  onReset,
  search,
}: FullPaletteInspectorProps) {
  const q = search.trim().toLowerCase();
  const grouped = CATEGORY_DEFS.map((cat) => ({
    ...cat,
    items: SEMANTIC_DEFS.filter(
      ([key, catId, label]) =>
        catId === cat.id &&
        (!q || label.toLowerCase().includes(q) || key.toLowerCase().includes(q)),
    ),
  })).filter((c) => c.items.length);

  return (
    <div>
      {grouped.map((cat) => (
        <Collapsible
          key={cat.id}
          title={cat.label}
          hint={cat.hint}
          count={cat.items.length}
          forceOpen={!!q}
        >
          {cat.items.map(([key, , label]) => (
            <div className="slate-row" key={key}>
              <div className="slate-row-swatch-btn">
                <ColorControl hex={palette[key]} onChange={(v) => onOverride(key, v)} size="sm" />
                {overrides[key] && <span className="slate-override-dot" />}
              </div>
              <span className="slate-row-label" title={label}>
                {label}
              </span>
              {CONTRAST_PAIRS[key] && (
                <ContrastBadge fg={palette[key]} bgKey={CONTRAST_PAIRS[key]} palette={palette} />
              )}
              <input
                className="slate-row-hex slate-mono"
                value={palette[key]}
                onChange={(e) => onOverride(key, e.target.value)}
                spellCheck={false}
              />
              {overrides[key] && (
                <button
                  className="slate-btn icon ghost slate-row-reset"
                  title="Reset to derived value"
                  onClick={() => onReset(key)}
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
          ))}
        </Collapsible>
      ))}
      {q && !grouped.length && (
        <div className="slate-empty">
          <Search size={22} style={{ display: 'block', margin: '0 auto 8px' }} />
          No colors match “{search}”
        </div>
      )}
    </div>
  );
}

function ContrastBadge({
  fg,
  bgKey,
  palette,
}: {
  fg: string;
  bgKey: string;
  palette: Palette;
}) {
  const ratio = contrastRatio(fg, palette[bgKey]);
  const level = contrastLevel(ratio);
  const bgLabel = SEMANTIC_LABELS[bgKey] || bgKey;
  const tip =
    level === 'bad'
      ? ' — hard to read'
      : level === 'ok'
        ? ' — readable for large text'
        : ' — meets AA text contrast';
  return (
    <span
      className={`slate-contrast-badge ${level}`}
      title={`Contrast ${ratio.toFixed(1)}:1 against ${bgLabel}${tip}`}
    >
      {ratio.toFixed(1)}
    </span>
  );
}
