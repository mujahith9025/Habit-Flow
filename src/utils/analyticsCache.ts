/**
 * High-Performance Local Analytics Cache for HabitFlow
 * 
 * Provides a two-tier caching pipeline:
 * 1. Fast-Path In-Memory LRU Cache (0ms synchronous lookup for instant UI rendering)
 * 2. Persistent IndexedDB Cache ('HabitFlowAnalyticsDB') for cross-session offline instant hydration
 */

export interface CachedReportEntry<T> {
  key: string;
  uid: string;
  monthKey: string;
  category: string;
  data: T;
  timestamp: number;
  expiresAt: number;
}

const DB_NAME = 'HabitFlowAnalyticsDB';
const DB_VERSION = 1;
const STORE_MONTHLY = 'monthly_reports';
const STORE_LIFETIME = 'lifetime_reports';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// Tier 1: Fast-Path In-Memory LRU Cache
const memoryCache = new Map<string, { data: unknown; expiresAt: number }>();
const MAX_MEMORY_ENTRIES = 60;

function setMemoryEntry(key: string, data: unknown, ttlMs: number): void {
  if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
    // Evict oldest entry
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function getMemoryEntry<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

// Tier 2: IndexedDB Persistent Cache
let dbPromise: Promise<IDBDatabase | null> | null = null;

function getAnalyticsDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_MONTHLY)) {
            const store = db.createObjectStore(STORE_MONTHLY, { keyPath: 'key' });
            store.createIndex('uid', 'uid', { unique: false });
            store.createIndex('expiresAt', 'expiresAt', { unique: false });
          }
          if (!db.objectStoreNames.contains(STORE_LIFETIME)) {
            const store = db.createObjectStore(STORE_LIFETIME, { keyPath: 'key' });
            store.createIndex('uid', 'uid', { unique: false });
          }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('Analytics IndexedDB could not be opened, using memory cache only');
          resolve(null);
        };
      } catch (err) {
        console.warn('Analytics IndexedDB init error, fallback to memory cache:', err);
        resolve(null);
      }
    });
  }

  return dbPromise;
}

function buildMonthlyKey(uid: string, monthKey: string, category: string): string {
  return `${uid}__${monthKey}__${category.trim().toLowerCase()}`;
}

/**
 * Retrieve cached monthly analytics report (Memory -> IndexedDB -> null)
 */
export async function getCachedMonthlyReport<T>(
  uid: string,
  monthKey: string,
  category: string
): Promise<T | null> {
  const key = buildMonthlyKey(uid, monthKey, category);

  // 1. Tier 1: Instant In-Memory lookup
  const mem = getMemoryEntry<T>(key);
  if (mem) return mem;

  // 2. Tier 2: IndexedDB persistent lookup
  try {
    const db = await getAnalyticsDB();
    if (!db) return null;

    return new Promise<T | null>((resolve) => {
      try {
        const tx = db.transaction(STORE_MONTHLY, 'readonly');
        const store = tx.objectStore(STORE_MONTHLY);
        const req = store.get(key);

        req.onsuccess = () => {
          const entry = req.result as CachedReportEntry<T> | undefined;
          if (!entry) {
            resolve(null);
            return;
          }

          if (Date.now() > entry.expiresAt) {
            // Expired: delete asynchronously
            try {
              const delTx = db.transaction(STORE_MONTHLY, 'readwrite');
              delTx.objectStore(STORE_MONTHLY).delete(key);
            } catch {
              // Ignore deletion error
            }
            resolve(null);
          } else {
            // Warm up Tier 1 memory cache
            setMemoryEntry(key, entry.data, entry.expiresAt - Date.now());
            resolve(entry.data);
          }
        };

        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

/**
 * Persist monthly analytics report to Tier 1 and Tier 2 caches
 */
export async function setCachedMonthlyReport<T>(
  uid: string,
  monthKey: string,
  category: string,
  data: T,
  ttlMs = DEFAULT_TTL_MS
): Promise<void> {
  const key = buildMonthlyKey(uid, monthKey, category);
  const now = Date.now();
  const expiresAt = now + ttlMs;

  // 1. Store in Tier 1 memory cache
  setMemoryEntry(key, data, ttlMs);

  // 2. Store in Tier 2 IndexedDB
  try {
    const db = await getAnalyticsDB();
    if (!db) return;

    const entry: CachedReportEntry<T> = {
      key,
      uid,
      monthKey,
      category,
      data,
      timestamp: now,
      expiresAt,
    };

    const tx = db.transaction(STORE_MONTHLY, 'readwrite');
    tx.objectStore(STORE_MONTHLY).put(entry);
  } catch {
    // Memory cache already set, ignore disk errors
  }
}

/**
 * Invalidate cached report for a user and monthKey (e.g. after a check-in is toggled)
 */
export async function invalidateMonthlyReportCache(
  uid: string,
  monthKey?: string
): Promise<void> {
  // Clear memory cache keys matching prefix
  const prefix = monthKey ? `${uid}__${monthKey}` : `${uid}__`;
  for (const k of memoryCache.keys()) {
    if (k.startsWith(prefix)) {
      memoryCache.delete(k);
    }
  }

  try {
    const db = await getAnalyticsDB();
    if (!db) return;

    const tx = db.transaction(STORE_MONTHLY, 'readwrite');
    const store = tx.objectStore(STORE_MONTHLY);
    const index = store.index('uid');
    const req = index.getAll(uid);

    req.onsuccess = () => {
      const records = req.result as CachedReportEntry<unknown>[] || [];
      records.forEach((rec) => {
        if (!monthKey || rec.monthKey === monthKey) {
          store.delete(rec.key);
        }
      });
    };
  } catch {
    // Ignore
  }
}

// Sparkline Cache Helper for Smooth Catmull-Rom Curves
export function getCachedSparkline<T>(habitId: string, baseDateKey: string): T | null {
  return getMemoryEntry<T>(`spark__${habitId}__${baseDateKey}`);
}

export function setCachedSparkline<T>(habitId: string, baseDateKey: string, data: T): void {
  // Cache sparkline for 1 hour in memory
  setMemoryEntry(`spark__${habitId}__${baseDateKey}`, data, 1000 * 60 * 60);
}

/**
 * Clear all cached analytics data
 */
export async function clearAllAnalyticsCache(): Promise<void> {
  memoryCache.clear();
  try {
    const db = await getAnalyticsDB();
    if (!db) return;
    const tx = db.transaction([STORE_MONTHLY, STORE_LIFETIME], 'readwrite');
    tx.objectStore(STORE_MONTHLY).clear();
    tx.objectStore(STORE_LIFETIME).clear();
  } catch {
    // Ignore
  }
}
