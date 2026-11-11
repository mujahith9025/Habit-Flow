import { deleteUser, reauthenticateWithCredential, EmailAuthProvider, GoogleAuthProvider, reauthenticateWithPopup, User } from 'firebase/auth';
import {
  collection,
  getDocs,
  deleteDoc,
  db,
  getUserDocRef,
  getHabitsCollectionRef,
  getEntriesCollectionRef,
  getExpenseEntriesCollectionRef,
  getExpenseSettingsDocRef,
} from './firestore';

/** HabitFlow-specific localStorage keys to clear on account deletion */
const HABITFLOW_STORAGE_KEYS = [
  'habitflow_theme',
  'habitflow_cached_profile',
  'habitflow_demo_user',
  'habitflow_device_id',
  'habitflow_sidebar_collapsed',
  'habitflow_notification_settings',
  'habitflow_last_morning_notified',
  'habitflow_last_evening_notified',
  'habitflow_cached_habits',
  'habitflow_pwa_installed',
];

/**
 * Re-authenticates the user before sensitive operations like account deletion.
 * Throws if re-authentication is not possible or is cancelled by user.
 */
export async function reauthenticateUser(user: User, password?: string): Promise<void> {
  const providerId = user.providerData[0]?.providerId;

  if (providerId === 'google.com') {
    const googleProvider = new GoogleAuthProvider();
    await reauthenticateWithPopup(user, googleProvider);
  } else if (providerId === 'password' && password && user.email) {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  } else {
    throw new Error('Re-authentication required. Please sign out and sign back in, then try again.');
  }
}

/**
 * Permanently deletes all Firestore documents and subcollections for a user
 * (Habits, Habit Check-ins, Expenses, Settings, Device Sessions, and User Profile)
 */
export async function deleteAllFirestoreUserData(uid: string): Promise<void> {
  // 1. Delete all Habit Entries subcollections and Habits
  const habitsColRef = getHabitsCollectionRef(uid);
  const habitsSnap = await getDocs(habitsColRef);

  for (const habitDoc of habitsSnap.docs) {
    const habitId = habitDoc.id;
    // Delete all entries in users/{uid}/habits/{habitId}/entries
    const entriesColRef = getEntriesCollectionRef(uid, habitId);
    const entriesSnap = await getDocs(entriesColRef);
    const entryDeletions = entriesSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(entryDeletions);

    // Delete the habit document
    await deleteDoc(habitDoc.ref);
  }

  // 2. Delete all Expense & Savings records in users/{uid}/expense_entries
  const expenseColRef = getExpenseEntriesCollectionRef(uid);
  const expenseSnap = await getDocs(expenseColRef);
  const expenseDeletions = expenseSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
  await Promise.all(expenseDeletions);

  // 3. Delete Expense settings document
  const expenseSettingsRef = getExpenseSettingsDocRef(uid);
  try {
    await deleteDoc(expenseSettingsRef);
  } catch (e) {
    console.warn('Expense settings deletion note:', e);
  }

  // 4. Delete all Device session documents in users/{uid}/devices
  try {
    const devicesColRef = collection(db, 'users', uid, 'devices');
    const devicesSnap = await getDocs(devicesColRef);
    if (!devicesSnap.empty) {
      const deviceDeletions = devicesSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deviceDeletions);
    }
  } catch (e) {
    console.warn('Device sessions deletion note:', e);
  }

  // 5. Delete root User Profile document users/{uid}
  const userRef = getUserDocRef(uid);
  await deleteDoc(userRef);
}

/**
 * Executes a full GDPR / CCPA Article 17 "Right to Erasure" Account Deletion:
 * 1. Re-authenticates the user to ensure fresh credentials
 * 2. Cascades deletion across all Firestore subcollections (including devices)
 * 3. Clears HabitFlow-specific client-side local cache & storage
 * 4. Permanently deletes the Firebase Auth user record
 */
export async function eraseUserAccountAndAllData(user: User, password?: string): Promise<void> {
  const uid = user.uid;

  // 1. If password or credentials provided, re-authenticate proactively
  if (password) {
    await reauthenticateUser(user, password);
  }

  // 2. Wipe all cloud database records (habits, entries, expenses, devices, profile)
  await deleteAllFirestoreUserData(uid);

  // 3. Clear only HabitFlow-specific local client storage keys (not all site data)
  try {
    HABITFLOW_STORAGE_KEYS.forEach((key) => {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    });
    sessionStorage.clear();
  } catch (e) {
    console.warn('Local storage clear note:', e);
  }

  // 4. Delete Firebase Authentication user record
  try {
    await deleteUser(user);
  } catch (authErr: unknown) {
    const errorObj = authErr as { code?: string };
    if (errorObj?.code === 'auth/requires-recent-login') {
      const providerId = user.providerData[0]?.providerId;
      if (providerId === 'google.com') {
        const googleProvider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, googleProvider);
        await deleteUser(user);
      } else {
        throw authErr;
      }
    } else {
      throw authErr;
    }
  }
}
