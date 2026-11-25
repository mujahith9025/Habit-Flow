import { atomicBatchUpdateHabits, atomicToggleEntry } from '../lib/firebase/monthlyMatrixService';

/**
 * Offline Mutation Queue & Background Sync Manager
 * 
 * Persists uncommitted habit check-ins and edits into browser IndexedDB when offline,
 * and automatically flushes them atomically via the W3C Background Sync API / online event
 * when network connectivity returns.
 */

export interface QueuedMutation {
  id: string;
  type: 'TOGGLE_ENTRY' | 'BATCH_TOGGLE' | 'UPDATE_VALUE';
  uid: string;
  dateKey: string;
  payload: {
    habitId?: string;
    completed?: boolean;
    currentValue?: number;
    timerSecondsElapsed?: number;
    updates?: Array<{
      habitId: string;
      completed: boolean;
      currentValue?: number;
      timerSecondsElapsed?: number;
    }>;
  };
  timestamp: number;
  retries: number;
}

const DB_NAME = 'HabitFlowOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_mutations';

let dbPromise: Promise<IDBDatabase> | null = null;

function getOfflineDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB not supported in this environment'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return dbPromise;
}

/**
 * Enqueues an offline habit mutation into IndexedDB
 */
export async function enqueueOfflineMutation(
  mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retries'>
): Promise<string> {
  const id = `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const record: QueuedMutation = {
    ...mutation,
    id,
    timestamp: Date.now(),
    retries: 0,
  };

  try {
    const db = await getOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Request Service Worker Background Sync if supported
    await requestServiceWorkerBackgroundSync();
  } catch (err) {
    console.debug('[OfflineQueue] Enqueue notice:', err);
  }

  return id;
}

/**
 * Retrieves all pending offline mutations sorted by timestamp
 */
export async function getQueuedMutations(): Promise<QueuedMutation[]> {
  try {
    const db = await getOfflineDB();
    return new Promise<QueuedMutation[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const req = index.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Deletes a flushed mutation from the queue
 */
export async function removeQueuedMutation(id: string): Promise<void> {
  try {
    const db = await getOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.debug('[OfflineQueue] Remove mutation notice:', err);
  }
}

/**
 * Flushes all queued offline mutations to Firestore atomically
 */
export async function flushOfflineMutations(): Promise<{ flushedCount: number; errors: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { flushedCount: 0, errors: 0 };
  }

  const mutations = await getQueuedMutations();
  if (mutations.length === 0) {
    return { flushedCount: 0, errors: 0 };
  }

  let flushedCount = 0;
  let errors = 0;

  for (const mut of mutations) {
    try {
      if (mut.type === 'BATCH_TOGGLE' && mut.payload.updates) {
        await atomicBatchUpdateHabits(mut.uid, mut.dateKey, mut.payload.updates);
      } else if (mut.type === 'TOGGLE_ENTRY' && mut.payload.habitId) {
        await atomicToggleEntry(
          mut.uid,
          mut.payload.habitId,
          mut.dateKey,
          mut.payload.completed ?? true,
          {
            currentValue: mut.payload.currentValue,
            timerSecondsElapsed: mut.payload.timerSecondsElapsed,
          }
        );
      } else if (mut.type === 'UPDATE_VALUE' && mut.payload.habitId) {
        await atomicToggleEntry(
          mut.uid,
          mut.payload.habitId,
          mut.dateKey,
          mut.payload.completed ?? true,
          {
            currentValue: mut.payload.currentValue,
            timerSecondsElapsed: mut.payload.timerSecondsElapsed,
          }
        );
      }

      await removeQueuedMutation(mut.id);
      flushedCount++;
    } catch (err) {
      console.warn('[OfflineQueue] Flush mutation retry notice:', err);
      errors++;
    }
  }

  return { flushedCount, errors };
}

/**
 * Triggers the browser Service Worker Background Sync API
 */
export async function requestServiceWorkerBackgroundSync(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    if ('sync' in reg) {
      await (reg as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register(
        'habitflow-offline-sync'
      );
    }
  } catch {
    // If Background Sync API is not permitted or unavailable, online event listener handles it
  }
}

// Automatically flush pending mutations whenever the browser regains internet connectivity
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOfflineMutations().catch((err) =>
      console.debug('[OfflineQueue] Online event flush notice:', err)
    );
  });
}
