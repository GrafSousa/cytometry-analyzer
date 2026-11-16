import { APP } from "@/config";
import { CALC_VERSION, type FileReport } from "@/core/types";

/** What is stored: the computed result, without id or file name. Never the spreadsheet content. */
export type CachedResult = FileReport extends infer R
  ? R extends FileReport
    ? Omit<R, "id" | "fileName" | "cached">
    : never
  : never;

export type ResultCache = {
  get(key: string): CachedResult | undefined;
  set(key: string, value: CachedResult): void;
  clear(): void;
  readonly size: number;
};

const DEFAULT_MAX_ENTRIES = 500;
const keyPrefix = `v${CALC_VERSION}:`;

/** Content fingerprint: SHA-256 of the bytes plus the rules version. The file name is not part of it. */
export async function cacheKey(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${keyPrefix}${hex}`;
}

/** In-memory cache: lasts while the page is open. */
export function createMemoryCache(): ResultCache {
  const entries = new Map<string, CachedResult>();
  return {
    get: (key) => entries.get(key),
    set: (key, value) => void entries.set(key, value),
    clear: () => entries.clear(),
    get size() {
      return entries.size;
    },
  };
}

/** The part of Storage we use (localStorage in the browser, a fake object in tests). */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type Entry = {
  savedAt: number;
  value: CachedResult;
};

type PersistentCacheOptions = { storageKey?: string; maxEntries?: number };

const isCurrentEntry = (key: string, entry: Entry | undefined): entry is Entry =>
  key.startsWith(keyPrefix) &&
  typeof entry?.savedAt === "number" &&
  typeof entry.value === "object" &&
  "status" in entry.value;

/** Loads the stored entries, dropping old rule versions and malformed data. */
function loadEntries(storage: KeyValueStorage, storageKey: string): Map<string, Entry> {
  const entries = new Map<string, Entry>();
  try {
    const raw = storage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as Record<string, Entry | undefined>) : {};
    for (const [key, entry] of Object.entries(parsed)) {
      if (isCurrentEntry(key, entry)) entries.set(key, entry);
    }
  } catch {
    // Corrupted data: start empty.
  }
  return entries;
}

function saveEntries(storage: KeyValueStorage, storageKey: string, entries: Map<string, Entry>) {
  try {
    if (entries.size === 0) storage.removeItem(storageKey);
    else storage.setItem(storageKey, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Storage full or blocked: keep working from memory.
  }
}

/**
 * Cache that survives a page reload, kept in the browser (localStorage).
 * Holds up to `maxEntries` results and drops the oldest past that. Any storage failure is
 * ignored: the app only recomputes, it never breaks because of the cache.
 */
export function createPersistentCache(
  storage: KeyValueStorage,
  {
    storageKey = `${APP.storagePrefix}:cache`,
    maxEntries = DEFAULT_MAX_ENTRIES,
  }: PersistentCacheOptions = {},
): ResultCache {
  const entries = loadEntries(storage, storageKey);
  const persist = () => saveEntries(storage, storageKey, entries);

  return {
    get: (key) => entries.get(key)?.value,
    set(key, value) {
      // Delete first so the key moves to the end of the Map's insertion order.
      entries.delete(key);
      entries.set(key, { savedAt: Date.now(), value });
      while (entries.size > maxEntries) entries.delete(entries.keys().next().value as string);
      persist();
    },
    clear() {
      entries.clear();
      persist();
    },
    get size() {
      return entries.size;
    },
  };
}

/** The browser cache when localStorage is available; otherwise memory only. */
export function createBrowserCache(): ResultCache {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return createPersistentCache(window.localStorage);
    }
  } catch {
    // localStorage blocked (for example a strict private window).
  }
  return createMemoryCache();
}
