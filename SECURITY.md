# Security Policy

Slate runs **100% in your browser** — no server, no accounts, no data leaves
your machine. All project data lives in `localStorage` on your device, and
exports are generated client-side.

That said, we take security seriously.

## Supported Versions

| Version | Supported |
| --- | --- |
| latest release | ✔ |
| `main` branch | ✔ (best-effort) |
| older releases | ✖ |

## Reporting a Vulnerability

Please **do not open a public issue** for security problems. Instead, email the
maintainer directly at the address listed on the [GitHub profile](https://github.com/mh3nj)
with:

- A description of the vulnerability and its impact
- Steps to reproduce (browser, OS, theme file if relevant)
- Any proof-of-concept you can share privately

You'll get an acknowledgment within **72 hours** and a status update as we
assess and fix the issue. We ask that you keep the details private until a fix
is released.

## Scope

Things that are *in* scope:

- Theme files (`.attheme`, `.tdesktop-theme`, `.slate.json`) that crash, hang,
  or exploit the app on import
- XSS / injection via project names, overrides, or wallpaper metadata
- LocalStorage misuse or data loss

Things that are *out* of scope:

- The browser or OS itself
- Third-party CDN assets (Google Fonts) — report those upstream

## Security Checklist for Contributors

- Never render imported strings as HTML — use React text nodes.
- Sanitize anything fed into `style` attributes, `url(...)` or `img.src`
  (wallpapers are data URLs by design — keep it that way).
- Keep the dependency tree as small as it already is; each dependency is an
  attack surface.
