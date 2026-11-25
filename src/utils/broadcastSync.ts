/**
 * Zero-Latency Multi-Tab Sync Engine via Native Browser BroadcastChannel
 * 
 * Allows instant, 0ms synchronization of habit check-ins, steppers, and state changes
 * across multiple browser tabs and installed PWA windows on the same device without
 * making redundant Firestore network reads or waiting for cloud roundtrips.
 */

export type BroadcastSyncPayload =
  | {
      type: 'HABIT_ENTRY_TOGGLE';
      habitId: string;
      dateKey: string;
      completed: boolean;
      currentValue?: number;
      timerSecondsElapsed?: number;
    }
  | {
      type: 'HABIT_BATCH_TOGGLE';
      dateKey: string;
      updates: Array<{
        habitId: string;
        completed: boolean;
        currentValue?: number;
        timerSecondsElapsed?: number;
      }>;
    }
  | {
      type: 'HABIT_MUTATION';
      action: 'created' | 'updated' | 'archived' | 'deleted' | 'paused';
      habitId: string;
    }
  | {
      type: 'MONTHLY_MATRIX_SYNC';
      monthKey: string;
    };

export type BroadcastSyncMessage = BroadcastSyncPayload & { senderId: string };

const CHANNEL_NAME = 'habitflow_sync_channel';
const STORAGE_FALLBACK_KEY = 'habitflow_tab_sync_event';

// Unique in-memory ID for this specific tab/window session
export const TAB_SESSION_ID =
  typeof window !== 'undefined'
    ? `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    : 'server_tab';

let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (err) {
    console.debug('[BroadcastSync] BroadcastChannel initialization notice:', err);
  }
}

/**
 * Broadcasts a state mutation to all other open tabs/windows
 */
export function broadcastSync(payload: BroadcastSyncPayload): void {
  if (typeof window === 'undefined') return;

  const fullPayload: BroadcastSyncMessage = {
    ...payload,
    senderId: TAB_SESSION_ID,
  };

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(fullPayload);
      return;
    } catch (err) {
      console.debug('[BroadcastSync] PostMessage notice:', err);
    }
  }

  // Cross-tab Storage Event Fallback for environments lacking BroadcastChannel
  try {
    localStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify({ ...fullPayload, ts: Date.now() }));
  } catch {
    // Ignore storage quota or access issues
  }
}

/**
 * Subscribes this tab to receive state mutations from other open tabs
 */
export function subscribeToBroadcastSync(
  callback: (msg: BroadcastSyncMessage) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // 1. BroadcastChannel Listener
  const handleBroadcastMessage = (event: MessageEvent<BroadcastSyncMessage>) => {
    const data = event.data;
    if (data && data.senderId !== TAB_SESSION_ID) {
      callback(data);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  // 2. Storage Event Fallback Listener
  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === STORAGE_FALLBACK_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue) as BroadcastSyncMessage;
        if (parsed && parsed.senderId !== TAB_SESSION_ID) {
          callback(parsed);
        }
      } catch {
        // Ignore parse error
      }
    }
  };

  window.addEventListener('storage', handleStorageEvent);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
    window.removeEventListener('storage', handleStorageEvent);
  };
}
