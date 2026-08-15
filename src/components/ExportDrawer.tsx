/**
 * Slate — export & import drawer.
 *
 * Ships the current palette to real Telegram formats:
 *  - `.attheme` for Telegram Android
 *  - `.tdesktop-theme` (a ZIP bundle) for Telegram Desktop
 *  - `.slate.json` project files, plus import of `.json` / `.attheme`.
 */

import { useRef } from 'react';
import { Camera, FileDown, FileJson, Image as ImageIcon, Monitor, Smartphone, Upload, X } from 'lucide-react';

import {
  exportAtthemeText,
  exportTdesktopThemeText,
  toAndroidColorInt,
} from '../lib/export';
import { base64ToUint8Array, buildZip, downloadBlob } from '../lib/zip';
import { rasterizeGradientDataUrl } from '../lib/wallpaper';
import type { Palette, Project, Wallpaper } from '../lib/types';
import { IconBtn } from './ui/IconBtn';

type CaptureTarget = 'mobile' | 'desktop' | 'both';

interface ExportDrawerProps {
  onClose: () => void;
  palette: Palette;
  wallpaper: Wallpaper;
  project: Project;
  onExportPreview: (target: CaptureTarget) => void;
  onExportWallpaper: () => void;
  onImportProject: (project: Project) => void;
  onImportAttheme: (text: string) => void;
  toast: (msg: string) => void;
}

export function ExportDrawer({
  onClose,
  palette,
  wallpaper,
  project,
  onExportPreview,
  onExportWallpaper,
  onImportProject,
  onImportAttheme,
  toast,
}: ExportDrawerProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const exportMobile = () => {
    try {
      let text = exportAtthemeText(palette);
      if (wallpaper?.kind === 'gradient') {
        text += `chat_wallpaper=${toAndroidColorInt(wallpaper.stops[0])}\n`;
        text += `chat_wallpaper_gradient_to=${toAndroidColorInt(wallpaper.stops[1])}\n`;
      }
      downloadBlob(text, 'theme.attheme', 'text/plain');
      toast(
        'Exported theme.attheme' +
          (wallpaper?.kind === 'image'
            ? ' (photo wallpaper not embedded — see note below)'
            : ''),
      );
    } catch (e) {
      toast('Export failed — ' + (e instanceof Error ? e.message : 'unknown error'));
    }
  };

  const exportDesktop = () => {
    try {
      const files = [
        { name: 'colors.tdesktop-theme', data: new TextEncoder().encode(exportTdesktopThemeText(palette)) },
      ];
      if (wallpaper?.kind === 'gradient') {
        const dataUrl = rasterizeGradientDataUrl(wallpaper.stops, wallpaper.angle);
        files.push({ name: 'background.jpg', data: base64ToUint8Array(dataUrl) });
      } else if (wallpaper?.kind === 'image' && wallpaper.dataUrl) {
        files.push({ name: 'background.jpg', data: base64ToUint8Array(wallpaper.dataUrl) });
      }
      const zip = buildZip(files);
      downloadBlob(zip, 'theme.tdesktop-theme', 'application/zip');
      toast('Exported theme.tdesktop-theme');
    } catch (e) {
      toast('Export failed — ' + (e instanceof Error ? e.message : 'unknown error'));
    }
  };

  const exportJson = () => {
    downloadBlob(
      JSON.stringify(project, null, 2),
      `${project.name || 'theme'}.slate.json`,
      'application/json',
    );
    toast('Exported project JSON');
  };

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      if (file.name.endsWith('.json')) {
        try {
          onImportProject(JSON.parse(text));
          toast('Imported ' + file.name);
        } catch {
          toast('Invalid project file');
        }
      } else if (file.name.endsWith('.attheme')) {
        try {
          onImportAttheme(text);
          toast('Imported colors from ' + file.name);
        } catch {
          toast('Could not parse .attheme file');
        }
      } else {
        toast('Unsupported file — use .json or .attheme');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="slate-drawer-backdrop" onClick={onClose}>
      <div className="slate-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="slate-drawer-head">
          <FileDown size={16} />
          <span className="slate-drawer-title">Export &amp; Import</span>
          <div style={{ flex: 1 }} />
          <IconBtn icon={X} onClick={onClose} title="Close" />
        </div>
        <div className="slate-drawer-body">
          <label className="slate-field-label">Export for Telegram</label>
          <button
            className="slate-btn primary"
            style={{ width: '100%', marginBottom: 8, justifyContent: 'flex-start' }}
            onClick={exportMobile}
          >
            <Smartphone size={14} /> Export Mobile (.attheme)
          </button>
          <button
            className="slate-btn primary"
            style={{ width: '100%', marginBottom: 22, justifyContent: 'flex-start' }}
            onClick={exportDesktop}
          >
            <Monitor size={14} /> Export Desktop (.tdesktop-theme)
          </button>

          <label className="slate-field-label">Previews</label>
          <button
            className="slate-btn"
            style={{ width: '100%', marginBottom: 8, justifyContent: 'flex-start' }}
            onClick={() => onExportPreview('both')}
          >
            <Camera size={14} /> Screenshot — Both Devices (PNG)
          </button>
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            <button
              className="slate-btn"
              style={{ flex: 1, justifyContent: 'flex-start' }}
              onClick={() => onExportPreview('mobile')}
            >
              <Smartphone size={14} /> Mobile
            </button>
            <button
              className="slate-btn"
              style={{ flex: 1, justifyContent: 'flex-start' }}
              onClick={() => onExportPreview('desktop')}
            >
              <Monitor size={14} /> Desktop
            </button>
          </div>

          <label className="slate-field-label">Wallpaper</label>
          <button
            className="slate-btn"
            style={{ width: '100%', marginBottom: 22, justifyContent: 'flex-start' }}
            onClick={onExportWallpaper}
          >
            <ImageIcon size={14} /> Export Wallpaper Image
          </button>

          <label className="slate-field-label">Project file</label>
          <button
            className="slate-btn"
            style={{ width: '100%', marginBottom: 8, justifyContent: 'flex-start' }}
            onClick={exportJson}
          >
            <FileJson size={14} /> Export Project JSON
          </button>
          <button
            className="slate-btn"
            style={{ width: '100%', marginBottom: 22, justifyContent: 'flex-start' }}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={14} /> Import (.json or .attheme)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.attheme"
            style={{ display: 'none' }}
            onChange={onFilePicked}
          />

          <div
            style={{
              fontSize: 11,
              color: 'var(--text-2)',
              lineHeight: 1.6,
              borderTop: '1px solid var(--line)',
              paddingTop: 14,
            }}
          >
            Exports use real Telegram key names for both platforms. Desktop themes are
            zipped with your wallpaper (if set) and can be renamed/imported directly in
            Telegram Desktop → Settings → Chat Settings → Theme. Mobile themes import via
            Settings → Chat Settings → Theme → “+”.
            <br />
            <br />
            <b style={{ color: 'var(--text-1)' }}>Wallpaper note:</b> gradient wallpapers
            export natively on both platforms. Uploaded photo wallpapers currently embed on
            Desktop only — Telegram&apos;s mobile theme format doesn&apos;t reliably support
            bundling a custom photo, so set it directly in the app after importing.
          </div>
        </div>
      </div>
    </div>
  );
}
