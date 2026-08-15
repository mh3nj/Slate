# Changelog

All notable changes to Slate are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and the project aims
for [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **High-resolution preview screenshots** — export the mobile, desktop, or both
  device previews as a crisp 3× PNG from the stage toolbar or the Export drawer
  (`src/lib/capture.ts`, dependency-free SVG→canvas rasterizer with an SVG
  fallback for browsers that can't rasterize `foreignObject`).
- **Standalone wallpaper export** — export just the wallpaper as an image:
  gradients render at 1080×2340 lossless PNG, photo wallpapers at their stored
  1920×1080 resolution. Available from the Export drawer and the wallpaper panel.
- **Release tooling** — `npm run release` builds the app and packages
  `releases/slate-<version>.zip`; GitHub Actions workflows for CI, releases and
  GitHub Pages demos.
- **Community files** — professional README with banner/badges/screenshots,
  `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `LICENSE`, and GitHub issue
  templates.
- **Site footer** — a quiet, minimalist strip with the maintainer's links
  (portfolio, software studio, brand studio, GitHub, Xing) and an MIT
  open-source note, themed to match the studio chrome.
- **Responsive down to 320px** — the mobile and desktop preview frames now
  scale-to-fit any screen: side-by-side while the pair fits at a readable
  size, then stacked full-width on phones. The device frames scale via a CSS
  transform so screenshot exports still capture at full resolution.
- **Mobile drawer controls** — the sidebar no longer closes when switching
  tabs; it closes only via the backdrop or a new ✕ button in the header.
- **Mobile centering** — the topbar and footer links center on phones.
- **Teal accent** — the studio's accent moved from amber to a teal signature:
  `#71d5bd` in the dark theme, `#174c42` in the light theme (buttons, focus
  rings, scrollbar, crop handles, footer heart).

### Fixed

- TypeScript 4.9 compatibility restored — dev `@types/*` pinned to versions
  that match the project's toolchain, so `tsc --noEmit` passes cleanly.
- Favicon finally renders — `index.html` and the live-swap script referenced
  `.png` favicons that no longer existed; they now point at the real 64×64
  `favicon-*-theme.jpg` files (and the built app is regenerated to match).

## [1.0.0] — 2026-08-15

### Added

- Master-driven color system: 23 master controls expand into 140+ semantic
  Telegram colors in real time.
- Pixel-accurate mobile & desktop preview frames driven entirely by the live
  palette.
- Wallpaper engine: photo wallpapers (upload → 16:9 crop) and gradients
  (two stops + angle), with fill/tile/blur modes.
- Global non-destructive adjustments (hue/saturation/lightness) with bake.
- Color harmony presets and a shuffle generator.
- Export to real Telegram formats: `.attheme` (Android) and `.tdesktop-theme`
  (Desktop, zipped with wallpaper), plus `.slate.json` project files.
- Import `.slate.json` projects and parse existing `.attheme` files.
- Theme library with autosave to localStorage.
- Undo/redo with smart input batching.
- Dependency-free ZIP writer, color engine and export serializers.
- Generated brand assets (README banner, screenshots, app icons) via
  `scripts/generate-assets.mjs`.
