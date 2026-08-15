/**
 * Slate — collapsible category.
 */

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleProps {
  title: string;
  hint?: string;
  count?: number;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  children: React.ReactNode;
}

export function Collapsible({
  title,
  hint,
  count,
  defaultOpen = false,
  forceOpen = false,
  children,
}: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  return (
    <div className="slate-category">
      <div className="slate-category-head" onClick={() => setOpen((o) => !o)}>
        {open ? (
          <ChevronDown size={13} color="var(--text-2)" />
        ) : (
          <ChevronRight size={13} color="var(--text-2)" />
        )}
        <span className="slate-category-title">{title}</span>
        <span className="slate-category-hint">{hint}</span>
        {count != null && <span className="slate-category-count">{count}</span>}
      </div>
      {open && <div className="slate-category-body">{children}</div>}
    </div>
  );
}
