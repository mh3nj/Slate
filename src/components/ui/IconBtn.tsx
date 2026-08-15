/**
 * Slate — UI primitives.
 * Small, reusable building blocks for the studio chrome.
 */

import type { LucideIcon } from 'lucide-react';

interface IconBtnProps {
  icon: LucideIcon;
  onClick?: () => void;
  title?: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  size?: number;
  className?: string;
}

/** Ghost icon button used in topbars, drawers and modal headers. */
export function IconBtn({
  icon: Icon,
  onClick,
  title,
  active,
  danger,
  disabled,
  size = 15,
  className,
}: IconBtnProps) {
  return (
    <button
      type="button"
      className={`slate-btn icon ghost${active ? ' primary' : ''}${danger ? ' danger' : ''}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      <Icon size={size} />
    </button>
  );
}

interface SwatchProps {
  hex: string;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

/** Checkerboard-backed color swatch button. */
export function Swatch({ hex, size = 'md', onClick }: SwatchProps) {
  return (
    <button
      type="button"
      className={`slate-swatch${size === 'sm' ? ' sm' : ''}`}
      onClick={onClick}
      aria-label={`Color ${hex}`}
    >
      <span className="slate-swatch-fill" style={{ background: hex }} />
    </button>
  );
}
