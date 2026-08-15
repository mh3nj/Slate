/**
 * Slate — minimal ZIP writer.
 *
 * A small, dependency-free ZIP archive builder (STORE method, no compression)
 * used to package `.tdesktop-theme` bundles (colors + optional wallpaper).
 * Spec: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
 */

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

let _crc32Table: Uint32Array | null = null;

function crc32(bytes: Uint8Array): number {
  if (!_crc32Table) {
    _crc32Table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      _crc32Table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = _crc32Table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeU32LE(arr: Uint8Array, offset: number, val: number): void {
  arr[offset] = val & 0xff;
  arr[offset + 1] = (val >>> 8) & 0xff;
  arr[offset + 2] = (val >>> 16) & 0xff;
  arr[offset + 3] = (val >>> 24) & 0xff;
}

function writeU16LE(arr: Uint8Array, offset: number, val: number): void {
  arr[offset] = val & 0xff;
  arr[offset + 1] = (val >>> 8) & 0xff;
}

/** Build a STORE-method ZIP archive from the given entries. */
export function buildZip(files: ZipEntry[]): Uint8Array {
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;
  const enc = new TextEncoder();

  for (const file of files) {
    const nameBytes = enc.encode(file.name);
    const data = file.data;
    const crc = crc32(data);

    const local = new Uint8Array(30 + nameBytes.length);
    writeU32LE(local, 0, 0x04034b50);
    writeU16LE(local, 4, 20);
    writeU16LE(local, 6, 0);
    writeU16LE(local, 8, 0);
    writeU16LE(local, 10, 0);
    writeU16LE(local, 12, 0x21);
    writeU32LE(local, 14, crc);
    writeU32LE(local, 18, data.length);
    writeU32LE(local, 22, data.length);
    writeU16LE(local, 26, nameBytes.length);
    writeU16LE(local, 28, 0);
    local.set(nameBytes, 30);
    localChunks.push(local, data);

    const central = new Uint8Array(46 + nameBytes.length);
    writeU32LE(central, 0, 0x02014b50);
    writeU16LE(central, 4, 20);
    writeU16LE(central, 6, 20);
    writeU16LE(central, 8, 0);
    writeU16LE(central, 10, 0);
    writeU16LE(central, 12, 0);
    writeU16LE(central, 14, 0x21);
    writeU32LE(central, 16, crc);
    writeU32LE(central, 20, data.length);
    writeU32LE(central, 24, data.length);
    writeU16LE(central, 28, nameBytes.length);
    writeU16LE(central, 30, 0);
    writeU16LE(central, 32, 0);
    writeU16LE(central, 34, 0);
    writeU16LE(central, 36, 0);
    writeU32LE(central, 38, 0);
    writeU32LE(central, 42, offset);
    central.set(nameBytes, 46);
    centralChunks.push(central);

    offset += local.length + data.length;
  }

  const centralStart = offset;
  let centralSize = 0;
  for (const c of centralChunks) centralSize += c.length;

  const end = new Uint8Array(22);
  writeU32LE(end, 0, 0x06054b50);
  writeU16LE(end, 4, 0);
  writeU16LE(end, 6, 0);
  writeU16LE(end, 8, files.length);
  writeU16LE(end, 10, files.length);
  writeU32LE(end, 12, centralSize);
  writeU32LE(end, 16, centralStart);
  writeU16LE(end, 20, 0);

  const total = offset + centralSize + 22;
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of localChunks) {
    out.set(c, p);
    p += c.length;
  }
  for (const c of centralChunks) {
    out.set(c, p);
    p += c.length;
  }
  out.set(end, p);
  return out;
}

/** Trigger a browser download for a blob/string/binary payload. */
export function downloadBlob(bytesOrString: Uint8Array | string, filename: string, mime: string): void {
  const blob = new Blob([bytesOrString], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Decode a data: URL (or raw base64) into bytes. */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binStr = atob(base64.split(',').pop() || '');
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  return bytes;
}
