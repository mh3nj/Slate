/**
 * Slate: Telegram Theme Studio.
 *
 * Root component: owns the project state (via the history hook), derives the
 * live palette, and wires together the sidebar, previews, wallpaper tools and
 * export/library drawers.
 */

import {
  Camera,
  ChevronDown,
  Download,
  Layers,
  Library,
  Menu,
  Monitor as MonitorIcon,
  Moon,
  Palette as PaletteIcon,
  Redo2,
  Search as SearchIcon,
  Smartphone as SmartphoneIcon,
  Sparkles,
  Sun,
  Undo2,
  Wand2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ExportDrawer } from './components/ExportDrawer';
import Footer from './components/Footer';
import { HarmonyMenu } from './components/HarmonyMenu';
import { PreviewDesktop } from './components/preview/PreviewDesktop';
import { PreviewMobile } from './components/preview/PreviewMobile';
import { FullPaletteInspector } from './components/sidebar/FullPaletteInspector';
import { GlobalAdjustPanel } from './components/sidebar/GlobalAdjustPanel';
import { MasterDeck } from './components/sidebar/MasterDeck';
import { ThemeLibraryDrawer } from './components/ThemeLibraryDrawer';
import { IconBtn } from './components/ui/IconBtn';
import { SegmentedControl } from './components/ui/SegmentedControl';
import { WallpaperPanel } from './components/wallpaper/WallpaperPanel';
import { useHistoryState } from './hooks/useHistoryState';
import { captureFramesToPng, captureFramesToSvg, CaptureUnsupportedError } from './lib/capture';
import { parseAtthemeText, slugify } from './lib/export';
import { randomizeMasters } from './lib/harmony';
import { PRESETS } from './lib/masters';
import { applyGlobalAdjust, emptyProject, normalizeProject } from './lib/project';
import { deriveFullPalette, SEMANTIC_KEYS } from './lib/semantic';
import { storage } from './lib/storage';
import type { Masters, Project } from './lib/types';
import { downloadWallpaperImage } from './lib/wallpaper';
import { base64ToUint8Array, downloadBlob } from './lib/zip';

type ViewMode = 'both' | 'mobile' | 'desktop';
type SidebarTab = 'masters' | 'all';
type UiTheme = 'dark' | 'light';
type CaptureTarget = 'mobile' | 'desktop' | 'both';

const CAPTURE_SCALE = 3; // 3× device pixels → crisp high-res exports
const MOBILE_FRAME_W = 300; // natural width of the phone frame (see preview.css)
const DESKTOP_FRAME_W = 660; // natural width of the desktop frame (see preview.css)
const STACK_THRESHOLD = 0.7; // below this pair scale, stack the frames instead of squeezing them side-by-side

export default function App() {
  const hist = useHistoryState<Project>(emptyProject());
  const { present } = hist;

  const [uiTheme, setUiTheme] = useState<UiTheme>('dark');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('masters');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [showHarmony, setShowHarmony] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2600);
  }, []);

  // Load the autosaved project on first mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const value = await storage.get('current-project');
        if (!cancelled && value) {
          const parsed = JSON.parse(value) as Project;
          if (parsed && parsed.masters) hist.loadWithoutHistory(normalizeProject(parsed));
        }
      } catch {
        /* no autosave yet — start fresh */
      } finally {
        if (!cancelled) setBooted(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the browser-tab favicon in sync with the OS/browser color scheme.
  // Updates live when the user switches their system theme while the app is open.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const applyFavicon = () => {
      const theme = mq.matches ? 'dark' : 'light';
      document
        .querySelectorAll<HTMLLinkElement>("link[rel='icon']")
        .forEach((link) => {
          link.href = `${process.env.PUBLIC_URL}/favicon-${theme}-theme.jpg`;
        });
    };
    applyFavicon();
    mq.addEventListener('change', applyFavicon);
    return () => mq.removeEventListener('change', applyFavicon);
  }, []);

  // Autosave (debounced).
  useEffect(() => {
    if (!booted) return;
    const t = setTimeout(() => {
      storage.set('current-project', JSON.stringify(present)).catch(() => {});
    }, 700);
    return () => clearTimeout(t);
  }, [present, booted]);

  const adjust = present.adjust;
  const effectiveMasters = useMemo(
    () => applyGlobalAdjust(present.masters, adjust),
    [present.masters, adjust],
  );
  const palette = useMemo(
    () => deriveFullPalette(effectiveMasters, present.overrides),
    [effectiveMasters, present.overrides],
  );

  /* ------------------------- project mutations ------------------------- */

  const onMasterChange = (key: string, value: string) =>
    hist.apply((prev) => ({ ...prev, masters: { ...prev.masters, [key]: value } }));

  const onOverride = (key: string, value: string) =>
    hist.apply((prev) => ({ ...prev, overrides: { ...prev.overrides, [key]: value } }));

  const onResetOverride = (key: string) =>
    hist.apply((prev) => {
      const o = { ...prev.overrides };
      delete o[key];
      return { ...prev, overrides: o };
    });

  const setWallpaper: React.Dispatch<React.SetStateAction<Project['wallpaper']>> = (updater) =>
    hist.apply((prev) => ({
      ...prev,
      wallpaper: typeof updater === 'function' ? updater(prev.wallpaper) : updater,
    }));

  const applyHarmony = (patch: Partial<Masters>) =>
    hist.apply((prev) => ({ ...prev, masters: { ...prev.masters, ...patch } as Masters }));

  const applyPreset = (id: string) => {
    hist.replace(
      normalizeProject({
        ...present,
        name: PRESETS[id].label,
        masters: { ...PRESETS[id].masters },
        overrides: {},
        adjust: { hue: 0, sat: 0, light: 0 },
      }),
    );
    toast('Loaded “' + PRESETS[id].label + '” preset');
  };

  const shuffle = () =>
    hist.apply((prev) => ({
      ...prev,
      masters: { ...prev.masters, ...randomizeMasters(prev.masters) } as Masters,
    }));

  const onAdjustChange = (next: Project['adjust']) => hist.apply((prev) => ({ ...prev, adjust: next }));

  const onBakeAdjust = () =>
    hist.apply((prev) => ({
      ...prev,
      masters: applyGlobalAdjust(prev.masters, prev.adjust),
      adjust: { hue: 0, sat: 0, light: 0 },
    }));

  const onResetAdjust = () => hist.apply((prev) => ({ ...prev, adjust: { hue: 0, sat: 0, light: 0 } }));

  const renameProject = (name: string) => hist.apply((prev) => ({ ...prev, name }));

  /* ------------------------- preview capture / export ----------------------- */

  const mobileFrameRef = useRef<HTMLDivElement | null>(null);
  const desktopFrameRef = useRef<HTMLDivElement | null>(null);
  const stageCanvasRef = useRef<HTMLDivElement | null>(null);

  const exportPreview = useCallback(
    async (target: CaptureTarget) => {
      const frames: HTMLElement[] = [];
      if (target !== 'desktop' && mobileFrameRef.current) frames.push(mobileFrameRef.current);
      if (target !== 'mobile' && desktopFrameRef.current) frames.push(desktopFrameRef.current);
      if (!frames.length) {
        toast('No previews to capture');
        return;
      }
      const base = slugify(present.name);
      try {
        const dataUrl = await captureFramesToPng(frames, { scale: CAPTURE_SCALE });
        downloadBlob(base64ToUint8Array(dataUrl), `${base}-preview.png`, 'image/png');
        toast('Exported high-res preview screenshot');
      } catch (err) {
        if (err instanceof CaptureUnsupportedError) {
          const svg = captureFramesToSvg(frames, { scale: CAPTURE_SCALE });
          downloadBlob(svg, `${base}-preview.svg`, 'image/svg+xml');
          toast('Exported preview as SVG (raster unsupported in this browser)');
        } else {
          toast('Screenshot failed — ' + (err instanceof Error ? err.message : 'unknown error'));
        }
      }
    },
    [present.name, toast],
  );

  const exportWallpaper = useCallback(() => {
    const ok = downloadWallpaperImage(present.wallpaper, slugify(present.name));
    toast(ok ? 'Exported wallpaper image' : 'No wallpaper set yet');
  }, [present.name, present.wallpaper, toast]);

  /* --------------------- responsive frame scaling ----------------------- */

  // Scale the device frames down (via CSS transform, which doesn't disturb
  // the layout size the screenshot exporter measures) so the previews fit
  // down to 320px-wide screens. Side-by-side while the pair fits at a decent
  // size, then stacked full-width below the threshold.
  const [frameFit, setFrameFit] = useState({ mobile: 1, desktop: 1 });
  const naturalRef = useRef<{ mw: number; mh: number; dw: number; dh: number } | null>(null);

  useEffect(() => {
    const canvas = stageCanvasRef.current;
    if (!canvas) return;
    if (!naturalRef.current) {
      naturalRef.current = {
        mw: mobileFrameRef.current?.offsetWidth || MOBILE_FRAME_W,
        mh: mobileFrameRef.current?.offsetHeight || 636,
        dw: desktopFrameRef.current?.offsetWidth || DESKTOP_FRAME_W,
        dh: desktopFrameRef.current?.offsetHeight || 480,
      };
    }
    const compute = () => {
      const cs = getComputedStyle(canvas);
      const avail =
        canvas.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const gap = parseFloat(cs.columnGap) || 28;
      const { mw, dw } = naturalRef.current!;
      const showMobile = viewMode !== 'desktop';
      const showDesktop = viewMode !== 'mobile';
      if (showMobile && showDesktop) {
        const sPair = Math.min(1, (avail - gap) / (mw + dw));
        if (sPair < STACK_THRESHOLD) {
          // Too small side-by-side — stack them, each filling the width.
          setFrameFit({
            mobile: Math.min(1, avail / mw),
            desktop: Math.min(1, avail / dw),
          });
        } else {
          setFrameFit({ mobile: sPair, desktop: sPair });
        }
      } else if (showMobile) {
        setFrameFit({ mobile: Math.min(1, avail / mw), desktop: 1 });
      } else {
        setFrameFit({ mobile: 1, desktop: Math.min(1, avail / dw) });
      }
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [viewMode]);

  /* ------------------------- keyboard shortcuts ------------------------ */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        hist.undo();
      } else if ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y') {
        e.preventDefault();
        hist.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------- render ------------------------------ */

  return (
    <div className={`slate-root theme-${uiTheme}`}>
      <div className="slate-topbar">
        <IconBtn
          icon={Menu}
          onClick={() => setMobileSidebarOpen((o) => !o)}
          title="Toggle controls"
          size={17}
          className="slate-mobile-menu"
        />

        <img
          className="slate-logo"
          src={`${process.env.PUBLIC_URL}/logomark-logotype-${uiTheme}-theme-horizontal.png`}
          alt="Slate: Telegram Theme Studio"
        />

        <div className="slate-topbar-divider" />

        <div className="slate-topbar-group">
          <IconBtn icon={Undo2} onClick={hist.undo} disabled={!hist.canUndo} title="Undo (⌘Z)" />
          <IconBtn icon={Redo2} onClick={hist.redo} disabled={!hist.canRedo} title="Redo (⇧⌘Z)" />
          <IconBtn icon={Wand2} onClick={shuffle} title="Shuffle a fresh variation" />
        </div>

        <div className="slate-topbar-divider" />

        <div className="slate-topbar-group" style={{ position: 'relative' }}>
          <button className="slate-btn sm" onClick={() => setShowPresets((s) => !s)}>
            <Layers size={12} /> Presets <ChevronDown size={11} />
          </button>
          {showPresets && (
            <>
              <div className="slate-popover-backdrop" onClick={() => setShowPresets(false)} />
              <div
                className="slate-popover"
                style={{ top: 46, left: 0, width: 200 }}
                onClick={(e) => e.stopPropagation()}
              >
                {Object.entries(PRESETS).map(([id, p]) => (
                  <button
                    key={id}
                    className="slate-btn"
                    style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 6 }}
                    onClick={() => {
                      applyPreset(id);
                      setShowPresets(false);
                    }}
                  >
                    <div style={{ display: 'flex', marginRight: 4 }}>
                      {['masterBg', 'masterAccent', 'masterBubbleOut'].map((k, i) => (
                        <span
                          key={k}
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: p.masters[k],
                            marginLeft: i ? -4 : 0,
                            border: '1.5px solid var(--ink-2)',
                          }}
                        />
                      ))}
                    </div>
                    {p.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="slate-topbar-spacer" />

        <input
          className="slate-text-input"
          style={{ width: 160 }}
          value={present.name}
          onChange={(e) => renameProject(e.target.value)}
          spellCheck={false}
        />

        <button className="slate-btn" onClick={() => setShowLibrary(true)}>
          <Library size={14} /> Library
        </button>
        <button className="slate-btn primary" onClick={() => setShowExport(true)}>
          <Download size={14} /> Export
        </button>
        <IconBtn
          icon={uiTheme === 'dark' ? Sun : Moon}
          onClick={() => setUiTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          title="Toggle studio appearance"
        />
      </div>

      <div className="slate-body">
        {mobileSidebarOpen && (
          <div className="slate-mobile-backdrop" onClick={() => setMobileSidebarOpen(false)} />
        )}
        <div className={`slate-sidebar${mobileSidebarOpen ? ' mobile-open' : ''}`}>
          <div className="slate-sidebar-tabs">
            <div
              className={`slate-sidebar-tab${sidebarTab === 'masters' ? ' active' : ''}`}
              onClick={() => setSidebarTab('masters')}
            >
              Masters
            </div>
            <div
              className={`slate-sidebar-tab${sidebarTab === 'all' ? ' active' : ''}`}
              onClick={() => setSidebarTab('all')}
            >
              All Colors · {SEMANTIC_KEYS.length}
            </div>
            <IconBtn
              icon={X}
              onClick={() => setMobileSidebarOpen(false)}
              title="Close panel"
              size={15}
              className="slate-sidebar-close"
            />
          </div>
          <div className="slate-search">
            <SearchIcon size={13} />
            <input
              placeholder={sidebarTab === 'masters' ? 'Filter masters…' : 'Search any color key…'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="slate-sidebar-scroll">
            {sidebarTab === 'masters' ? (
              <>
                <GlobalAdjustPanel
                  adjust={adjust}
                  onChange={onAdjustChange}
                  onBake={onBakeAdjust}
                  onReset={onResetAdjust}
                />
                <MasterDeck masters={effectiveMasters} onMasterChange={onMasterChange} search={search} />
              </>
            ) : (
              <FullPaletteInspector
                palette={palette}
                overrides={present.overrides}
                onOverride={onOverride}
                onReset={onResetOverride}
                search={search}
              />
            )}
          </div>
        </div>

        <div className="slate-stage">
          <div className="slate-stage-toolbar">
            <SegmentedControl
              options={[
                { id: 'both', label: 'Both', icon: Layers },
                { id: 'mobile', label: 'Mobile', icon: SmartphoneIcon },
                { id: 'desktop', label: 'Desktop', icon: MonitorIcon },
              ]}
              value={viewMode}
              onChange={(id) => setViewMode(id as ViewMode)}
            />
            <div className="slate-topbar-divider" />
            <WallpaperPanel
              wallpaper={present.wallpaper}
              setWallpaper={setWallpaper}
              onExportWallpaper={exportWallpaper}
            />
            <div style={{ flex: 1 }} />
            <div className="slate-topbar-divider" />
            <button
              className="slate-btn sm"
              onClick={() => void exportPreview('both')}
              title="Export both device previews as a high-res PNG"
            >
              <Camera size={13} /> Screenshot
            </button>
            <button className="slate-btn sm" onClick={() => setShowHarmony((s) => !s)}>
              <PaletteIcon size={13} /> Harmony
            </button>
            {showHarmony && (
              <HarmonyMenu
                masters={present.masters}
                onApply={applyHarmony}
                onClose={() => setShowHarmony(false)}
              />
            )}
          </div>

          <div className="slate-stage-canvas" ref={stageCanvasRef}>
            {/* Both frames stay mounted (the inactive one is hidden) so the
                screenshot exporter can always capture the full device pair.
                The slot reserves the scaled size; the frame inside is scaled
                with a CSS transform so capture still measures full size. */}
            <div
              className="slate-frame-slot"
              style={{
                display: viewMode === 'desktop' ? 'none' : undefined,
                width: MOBILE_FRAME_W * frameFit.mobile,
                height: (naturalRef.current?.mh ?? 636) * frameFit.mobile,
              }}
            >
              <div
                style={{
                  width: MOBILE_FRAME_W,
                  transform: `scale(${frameFit.mobile})`,
                  transformOrigin: 'top left',
                }}
              >
                <div ref={mobileFrameRef}>
                  <PreviewMobile p={palette} wallpaper={present.wallpaper} />
                </div>
              </div>
            </div>
            <div
              className="slate-frame-slot"
              style={{
                display: viewMode === 'mobile' ? 'none' : undefined,
                width: DESKTOP_FRAME_W * frameFit.desktop,
                height: (naturalRef.current?.dh ?? 480) * frameFit.desktop,
              }}
            >
              <div
                style={{
                  width: DESKTOP_FRAME_W,
                  transform: `scale(${frameFit.desktop})`,
                  transformOrigin: 'top left',
                }}
              >
                <div ref={desktopFrameRef}>
                  <PreviewDesktop p={palette} wallpaper={present.wallpaper} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer uiTheme={uiTheme} />

      {showLibrary && (
        <ThemeLibraryDrawer
          onClose={() => setShowLibrary(false)}
          currentProject={present}
          toast={toast}
          onLoad={(proj) => {
            hist.replace(normalizeProject(proj));
            toast('Loaded “' + (proj.name || 'theme') + '”');
          }}
        />
      )}

      {showExport && (
        <ExportDrawer
          onClose={() => setShowExport(false)}
          palette={palette}
          wallpaper={present.wallpaper}
          project={present}
          toast={toast}
          onExportPreview={(target) => void exportPreview(target)}
          onExportWallpaper={exportWallpaper}
          onImportProject={(proj) => hist.replace(normalizeProject({ ...proj, name: proj.name || 'Imported Theme' }))}
          onImportAttheme={(text) => {
            const { semanticOverrides } = parseAtthemeText(text);
            hist.apply((prev) => ({ ...prev, overrides: { ...prev.overrides, ...semanticOverrides } }));
          }}
        />
      )}

      {toastMsg && (
        <div className="slate-toast">
          <Sparkles size={13} color="var(--amber)" /> {toastMsg}
        </div>
      )}
    </div>
  );
}
