#!/usr/bin/env node
/**
 * Slate — release packager.
 *
 *   1. Ensures a fresh production build exists.
 *   2. Packages `build/` into `releases/slate-<version>.zip`
 *      (dependency-free STORE-method ZIP writer — no archiver needed).
 *   3. Prints a GitHub release checklist.
 *
 * Usage:  npm run release
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const buildDir = path.join(root, 'build');
const outDir = path.join(root, 'releases');
const zipPath = path.join(outDir, `slate-${version}.zip`);

/* ------------------------------ 1. build --------------------------------- */

if (!fs.existsSync(path.join(buildDir, 'index.html'))) {
  console.log('▶ No build found — running `npm run build`…');
  execSync('npm run build', { cwd: root, stdio: 'inherit' });
} else {
  console.log('▶ Using existing build/ (run `npm run build` to refresh).');
}

/* --------------------------- 2. collect files ----------------------------- */

const entries = [];
function walk(dir, prefix) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.posix.join(prefix, name);
    if (fs.statSync(full).isDirectory()) walk(full, rel);
    else entries.push({ name: rel, data: fs.readFileSync(full) });
  }
}
walk(buildDir, '');
if (!entries.length) {
  console.error('✗ build/ is empty — nothing to package.');
  process.exit(1);
}

/* --------------------------- 3. ZIP (STORE) ------------------------------- */

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const enc = new TextEncoder();
function u32(arr, o, v) { arr[o] = v & 0xff; arr[o + 1] = (v >>> 8) & 0xff; arr[o + 2] = (v >>> 16) & 0xff; arr[o + 3] = (v >>> 24) & 0xff; }
function u16(arr, o, v) { arr[o] = v & 0xff; arr[o + 1] = (v >>> 8) & 0xff; }

const localChunks = [];
const centralChunks = [];
let offset = 0;

for (const file of entries) {
  const nameBytes = enc.encode(file.name);
  const data = file.data;
  const crc = crc32(data);

  const local = new Uint8Array(30 + nameBytes.length);
  u32(local, 0, 0x04034b50);
  u16(local, 4, 20);   // version needed
  u16(local, 6, 0);    // flags
  u16(local, 8, 0);    // method: STORE
  u16(local, 10, 0);   // mod time
  u16(local, 12, 0x21); // mod date
  u32(local, 14, crc);
  u32(local, 18, data.length);
  u32(local, 22, data.length);
  u16(local, 26, nameBytes.length);
  u16(local, 28, 0);
  local.set(nameBytes, 30);
  localChunks.push(local, data);

  const central = new Uint8Array(46 + nameBytes.length);
  u32(central, 0, 0x02014b50);
  u16(central, 4, 20);
  u16(central, 6, 20);
  u16(central, 8, 0);
  u16(central, 10, 0);
  u16(central, 12, 0);
  u16(central, 14, 0x21);
  u32(central, 16, crc);
  u32(central, 20, data.length);
  u32(central, 24, data.length);
  u16(central, 28, nameBytes.length);
  u16(central, 30, 0);
  u16(central, 32, 0);
  u16(central, 34, 0);
  u16(central, 36, 0);
  u32(central, 38, 0);
  u32(central, 42, offset);
  central.set(nameBytes, 46);
  centralChunks.push(central);

  offset += local.length + data.length;
}

const centralStart = offset;
const centralSize = centralChunks.reduce((a, c) => a + c.length, 0);
const end = new Uint8Array(22);
u32(end, 0, 0x06054b50);
u16(end, 4, 0);
u16(end, 6, 0);
u16(end, 8, entries.length);
u16(end, 10, entries.length);
u32(end, 12, centralSize);
u32(end, 16, centralStart);
u16(end, 20, 0);

const out = Buffer.alloc(offset + centralSize + 22);
let p = 0;
for (const c of localChunks) { out.set(c, p); p += c.length; }
for (const c of centralChunks) { out.set(c, p); p += c.length; }
out.set(end, p);

/* -------------------------------- 4. write -------------------------------- */

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(zipPath, out);

const sizeKb = (out.length / 1024).toFixed(1);
console.log(`\n✓ ${path.relative(root, zipPath)} (${sizeKb} KB, ${entries.length} files)`);

/* ------------------------------ 5. checklist ------------------------------ */

console.log(`
───────────────────────────────────────────────────────────────
  Next steps for the GitHub release:
───────────────────────────────────────────────────────────────
  1. Update CHANGELOG.md and bump "version" in package.json.
  2. Commit:  git commit -am "chore: release v${version}"
  3. Tag:     git tag v${version} && git push origin v${version}
  4. The release workflow builds & attaches this zip automatically.
     (Manual fallback: GitHub → Releases → "Draft a new release"
      → tag v${version} → attach ${path.relative(root, zipPath)})
  5. Double-check the README badges + live demo after publishing.
───────────────────────────────────────────────────────────────`);
