/**
 * Slate — segmented control.
 */

import type { LucideIcon } from 'lucide-react';

export interface SegmentedOption {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (id: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className="slate-segmented">
      {options.map((opt) => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            className={value === opt.id ? 'active' : ''}
            onClick={() => onChange(opt.id)}
          >
            {Icon && <Icon size={12} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
