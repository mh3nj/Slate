/**
 * Slate — storage adapter.
 *
 * The studio was built to run inside a host that exposes `window.storage`
 * (encrypted key-value storage with prefixed listing). This module wraps that
 * API and transparently falls back to `localStorage` so Slate also runs in any
 * plain browser — e.g. a static deploy on GitHub Pages.
 */

const LS_PREFIX = 'slate:';

interface HostStorage {
  get(key: string, encrypted: boolean): Promise<{ value?: string } | null | undefined>;
  set(key: string, value: string, encrypted: boolean): Promise<unknown>;
  delete(key: string, encrypted: boolean): Promise<unknown>;
  list(prefix: string, encrypted: boolean): Promise<{ keys?: string[] } | null | undefined>;
}

interface StorageAdapter {
  get(key: string, encrypted?: boolean): Promise<string | null>;
  set(key: string, value: string, encrypted?: boolean): Promise<void>;
  delete(key: string, encrypted?: boolean): Promise<void>;
  list(prefix: string, encrypted?: boolean): Promise<string[]>;
}

const localStorageAdapter: StorageAdapter = {
  async get(key) {
    return localStorage.getItem(LS_PREFIX + key);
  },
  async set(key, value) {
    localStorage.setItem(LS_PREFIX + key, value);
  },
  async delete(key) {
    localStorage.removeItem(LS_PREFIX + key);
  },
  async list(prefix) {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LS_PREFIX + prefix)) keys.push(k.slice(LS_PREFIX.length));
    }
    return keys;
  },
};

function detectHost(): HostStorage | null {
  try {
    const w = window as unknown as { storage?: HostStorage };
    if (w.storage && typeof w.storage.get === 'function') return w.storage;
  } catch {
    /* no host storage — fall through */
  }
  return null;
}

const host = detectHost();

export const storage: StorageAdapter = host
  ? {
      async get(key, encrypted) {
        const res = await host.get(key, Boolean(encrypted));
        return res?.value ?? null;
      },
      async set(key, value, encrypted) {
        await host.set(key, value, Boolean(encrypted));
      },
      async delete(key, encrypted) {
        await host.delete(key, Boolean(encrypted));
      },
      async list(prefix, encrypted) {
        const res = await host.list(prefix, Boolean(encrypted));
        return res?.keys || [];
      },
    }
  : localStorageAdapter;

export type { StorageAdapter };
