# Contributing to Slate

First off; thank you for taking the time to contribute!

Slate is a small, dependency-conscious project: a theme studio for Telegram
built with React + TypeScript where everything (color math, ZIP writer, export
engine, screenshot capture) is hand-rolled. We value clean, minimal, well-tested
code over cleverness.

This document covers how to set up the project, what we expect from code, and
how to get changes merged.

---

## Table of Contents

- [Contributing to Slate](#contributing-to-slate)
  - [Table of Contents](#table-of-contents)
  - [Code of Conduct](#code-of-conduct)
  - [Ways to Contribute](#ways-to-contribute)
  - [Development Setup](#development-setup)
  - [Project Overview](#project-overview)
    - [The color pipeline (important!)](#the-color-pipeline-important)
  - [Code Style](#code-style)
  - [Testing](#testing)
  - [Assets](#assets)
  - [Pull Request Process](#pull-request-process)
  - [Commit Guidelines](#commit-guidelines)
  - [Release Process](#release-process)

---

## Code of Conduct

Be kind. Be constructive. Assume good faith. Harassment or discrimination of
any kind will not be tolerated. If you see a problem, report it to the
maintainers privately.

## Ways to Contribute

- **Report bugs** — open an issue using the [bug report template](https://github.com/mh3nj/slate/issues/new?assignees=&labels=bug&template=bug_report.yml).
- **Request features** — use the [feature request template](https://github.com/mh3nj/slate/issues/new?assignees=&labels=enhancement&template=feature_request.yml).
- **Fix things** — pick any open issue, or fix something you found.
- **Share themes** — post your exported `.slate.json` / `.attheme` in Discussions.
- **Improve docs** — typos, clarifications, better examples, localization.

## Development Setup

```bash
git clone https://github.com/mh3nj/slate.git
cd slate
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). The dev server hot-reloads
on save — including styles and state logic.

> **Windows note:** the repo is developed in Git Bash; all scripts are
> POSIX-compatible (`mv`/`rm`, heredocs). If you use PowerShell, prefix commands
> with `bash -c "…"` where needed.

## Project Overview

```
src/
├── App.tsx                 # root: state, palette derivation, layout wiring
├── components/
│   ├── preview/            # mobile + desktop Telegram mockups (pixel-accurate)
│   ├── sidebar/            # master controls, full palette inspector
│   ├── ui/                 # buttons, sliders, segmented controls, color popover
│   └── wallpaper/          # wallpaper panel + crop modal
├── hooks/useHistoryState.ts# undo/redo with input batching
├── lib/                    # THE core: color math, semantic palette, exporters
│   ├── color.ts            # hex/hsl math, contrast
│   ├── semantic.ts         # masters → 140+ semantic colors
│   ├── harmony.ts          # harmony & randomization
│   ├── export.ts           # .attheme / .tdesktop-theme serialization + key maps
│   ├── zip.ts              # dependency-free ZIP writer
│   ├── capture.ts          # high-res SVG→PNG preview screenshot capture
│   └── wallpaper.ts        # gradient rasterization + wallpaper export
└── styles/                 # studio design system + preview frame CSS
```

### The color pipeline (important!)

The whole app is a pipeline:

```
master colors (23)  →  deriveFullPalette()  →  semantic palette (140+)  →  previews & exports
```

- **Masters** are the user-facing controls (`masterBg`, `masterAccent`, …).
- `deriveFullPalette()` in `src/lib/semantic.ts` expands them into every
  semantic key Telegram understands (`windowBg`, `msgOutBg`, `chats_name`, …).
- `src/lib/export.ts` maps semantic keys → **real** Telegram key names for both
  platforms and serializes `.attheme` / `.tdesktop-theme`.

When adding a color, decide which layer it belongs to: a new *master* (drives
many derived colors), a *derived semantic* (computed from masters), or an
*override* (user-set). Keep the layering intact.

## Code Style

- **TypeScript everywhere.** New files must be `.ts`/`.tsx` with strict-mode
  clean types. Run `npx tsc --noEmit` before pushing.
- **No new runtime dependencies.** This is a hard rule — the zero-runtime-deps
  story is a feature. Canvas APIs, SVG, and the DOM are all you need.
  If you genuinely need a library, open an issue first and argue for it.
- **Small, focused files.** One responsibility per module; components stay thin.
- **Comment the "why", not the "what".** Non-obvious logic (color math, the ZIP
  spec, capture taint workarounds) deserves a short comment with the reason.
- **Match existing conventions** — 2-space indent, single quotes, semicolons,
  kebab-case CSS classes, PascalCase components, `interface` over `type` for
  objects, `camelCase` files under `src/lib`.
- **Keep exports minimal** — export only what other modules consume.

## Testing

```bash
npm test          # Jest (watch mode)
npm test -- --watchAll=false
```

There are no tests yet — help wanted! When you add a pure-logic module
(`src/lib/` is a great candidate), add a test next to it
(`src/lib/__tests__/color.test.ts`).

What to test first:

- `color.ts` — hex↔hsl conversions, mixing, contrast math (pure functions, easy win)
- `semantic.ts` — master → palette derivation invariants
- `zip.ts` — archives round-trip (entries + CRC32)
- `export.ts` — `.attheme` / `.tdesktop-theme` text output

## Assets

The repo's visual assets (README banner, preview SVGs, app icons) are
generated and then hand-edited:

```bash
npm run assets
```

This runs `scripts/generate-assets.mjs`, which renders the **real** Midnight
palette from `scripts/palette-midnight.json` into:

- `docs/banner.svg`, `docs/screenshots/*.svg`
- `public/logo192.png`, `logo512.png`, `favicon.ico`

If you change the preview markup or the semantic palette, regenerate and commit
the updated assets.

## Pull Request Process

1. **Fork** the repo and create a branch: `git checkout -b feat/your-change`.
2. **Make the change** — small commits, meaningful messages (see below).
3. **Verify locally:**
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run build
   ```
   All three must pass.
4. **Add tests** for new logic in `src/lib/` where feasible.
5. **Push and open a PR** against `main`. Use the PR description to explain the
   *why*, include screenshots for UI changes (the **Screenshot** button in the
   studio makes this trivial), and reference any related issue (`Fixes #12`).
6. **Keep it reviewable** — one logical change per PR, rebased on latest `main`.
   Large refactors should be discussed in an issue first.

Maintainers will review, request changes if needed, and merge once CI is green.

## Commit Guidelines

Prefer conventional, lowercase-prefixed messages:

```
feat: add wallpaper blur toggle
fix: correct hex parse for 3-digit colors
docs: refresh README export matrix
refactor: extract color popover into ui component
test: cover harmony randomization
```

One commit per logical unit; keep messages descriptive of intent, not mechanics.

## Release Process

Maintainers only. Releasing is scripted:

```bash
npm run release          # builds + creates releases/slate-<version>.zip
```

1. Update `CHANGELOG.md` with the new version's entries.
2. Bump `version` in `package.json`, commit as `chore: release vX.Y.Z`.
3. Tag it: `git tag vX.Y.Z && git push origin vX.Y.Z`.
4. The [release workflow](.github/workflows/release.yml) builds the zip and
   publishes the GitHub Release automatically. Verify the asset attached.

---

Questions? Open a discussion or drop a comment on the relevant issue.
