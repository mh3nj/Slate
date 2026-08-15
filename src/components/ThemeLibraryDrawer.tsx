/**
 * Slate — theme library.
 *
 * Persist named variations of the current project and re-load them later.
 * Backed by the storage adapter (host storage with a localStorage fallback).
 */

import { useCallback, useEffect, useState } from 'react';
import { FolderOpen, Library, Save, Trash2, X } from 'lucide-react';

import { storage } from '../lib/storage';
import type { LibraryItem, Project } from '../lib/types';
import { IconBtn } from './ui/IconBtn';

const THEME_PREFIX = 'theme:';

interface ThemeLibraryDrawerProps {
  onClose: () => void;
  currentProject: Project;
  onLoad: (project: Project) => void;
  toast: (msg: string) => void;
}

export function ThemeLibraryDrawer({
  onClose,
  currentProject,
  onLoad,
  toast,
}: ThemeLibraryDrawerProps) {
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [name, setName] = useState('');

  const refresh = useCallback(async () => {
    try {
      const keys = await storage.list(THEME_PREFIX);
      const loaded: LibraryItem[] = [];
      for (const k of keys) {
        try {
          const value = await storage.get(k);
          if (value) loaded.push({ key: k, ...JSON.parse(value) });
        } catch {
          /* skip unreadable entries */
        }
      }
      loaded.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
      setItems(loaded);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = async () => {
    const label = name.trim() || `Theme ${new Date().toLocaleDateString()}`;
    const id = `${THEME_PREFIX}${Date.now()}`;
    const payload = { ...currentProject, name: label, savedAt: Date.now() };
    try {
      await storage.set(id, JSON.stringify(payload));
      setName('');
      toast('Saved “' + label + '” to your library');
      void refresh();
    } catch {
      toast('Could not save — storage unavailable');
    }
  };

  const remove = async (key: string) => {
    try {
      await storage.delete(key);
      void refresh();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="slate-drawer-backdrop" onClick={onClose}>
      <div className="slate-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="slate-drawer-head">
          <Library size={16} />
          <span className="slate-drawer-title">Theme Library</span>
          <div style={{ flex: 1 }} />
          <IconBtn icon={X} onClick={onClose} title="Close" />
        </div>
        <div className="slate-drawer-body">
          <label className="slate-field-label">Save current theme</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            <input
              className="slate-text-input"
              placeholder="Name this variation…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="slate-btn primary" onClick={save}>
              <Save size={13} /> Save
            </button>
          </div>
          <label className="slate-field-label">Saved variations</label>
          {items === null && <div className="slate-empty">Loading…</div>}
          {items && items.length === 0 && (
            <div className="slate-empty">
              <Library size={22} />
              Nothing saved yet — build a theme you love, then save it here to revisit
              anytime.
            </div>
          )}
          {items &&
            items.map((it) => (
              <div className="slate-lib-item" key={it.key}>
                <div className="slate-lib-swatches">
                  {['masterBg', 'masterAccent', 'masterBubbleOut', 'masterBubbleIn'].map((k) => (
                    <span key={k} style={{ background: it.masters?.[k] || '#333' }} />
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="slate-lib-name">{it.name}</div>
                  <div className="slate-lib-meta">
                    {it.savedAt ? new Date(it.savedAt).toLocaleString() : ''}
                  </div>
                </div>
                <IconBtn
                  icon={FolderOpen}
                  title="Load"
                  onClick={() => {
                    onLoad(it);
                    onClose();
                  }}
                />
                <IconBtn icon={Trash2} title="Delete" danger onClick={() => remove(it.key)} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
