import { doc, collection, setDoc, deleteDoc, getDocs, DocumentReference, CollectionReference } from 'firebase/firestore';
import { db } from './firestore';

export interface UserDeviceSession {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  lastActive: string;
  createdAt: string;
  isCurrent?: boolean;
}

const DEVICE_ID_KEY = 'habitflow_device_uuid';

/**
 * Returns or creates a persistent unique ID for the current browser/device
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_session';
  try {
    let devId = localStorage.getItem(DEVICE_ID_KEY);
    if (!devId) {
      devId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(DEVICE_ID_KEY, devId);
    }
    return devId;
  } catch {
    return 'fallback_device_session';
  }
}

/**
 * Parses user agent string into friendly Device Name, OS, and Browser
 */
export function parseDeviceInfo(): { name: string; type: 'mobile' | 'desktop' | 'tablet'; os: string; browser: string } {
  if (typeof window === 'undefined') {
    return { name: 'Web Client', type: 'desktop', os: 'Unknown OS', browser: 'Browser' };
  }

  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  let type: 'mobile' | 'desktop' | 'tablet' = 'desktop';

  if (/iPad|Tablet/i.test(ua)) {
    type = 'tablet';
    os = 'iPadOS / Tablet';
  } else if (/iPhone/i.test(ua)) {
    type = 'mobile';
    os = 'iOS (iPhone)';
  } else if (/Android/i.test(ua)) {
    type = /Mobile/i.test(ua) ? 'mobile' : 'tablet';
    os = 'Android';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  let browser = 'Browser';
  if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome/i.test(ua)) browser = 'Google Chrome';
  else if (/Safari/i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';

  const name = `${os} • ${browser}`;
  return { name, type, os, browser };
}

/**
 * Helper to get references to devices collection
 */
export const getDevicesCollectionRef = (uid: string): CollectionReference<UserDeviceSession> => {
  return collection(db, 'users', uid, 'devices') as CollectionReference<UserDeviceSession>;
};

export const getDeviceDocRef = (uid: string, deviceId: string): DocumentReference<UserDeviceSession> => {
  return doc(db, 'users', uid, 'devices', deviceId) as DocumentReference<UserDeviceSession>;
};

/**
 * Registers or updates the current device session heartbeat in Firestore
 */
export async function registerDeviceSession(uid: string): Promise<UserDeviceSession> {
  const deviceId = getOrCreateDeviceId();
  const info = parseDeviceInfo();
  const now = new Date().toISOString();

  const sessionData: UserDeviceSession = {
    id: deviceId,
    name: info.name,
    type: info.type,
    browser: info.browser,
    os: info.os,
    lastActive: now,
    createdAt: now,
  };

  const devRef = getDeviceDocRef(uid, deviceId);
  await setDoc(devRef, sessionData, { merge: true });
  return sessionData;
}

/**
 * Revokes / Deletes a specific device session
 */
export async function revokeDeviceSession(uid: string, targetDeviceId: string): Promise<void> {
  const devRef = getDeviceDocRef(uid, targetDeviceId);
  await deleteDoc(devRef);
}

/**
 * Revokes / Deletes all device sessions except the current one
 */
export async function revokeAllOtherDevices(uid: string, currentDeviceId: string): Promise<void> {
  const colRef = getDevicesCollectionRef(uid);
  const snap = await getDocs(colRef);

  const deletePromises = snap.docs
    .filter((d) => d.id !== currentDeviceId)
    .map((d) => deleteDoc(d.ref));

  await Promise.all(deletePromises);
}
