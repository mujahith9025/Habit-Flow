import { deleteUser, User } from 'firebase/auth';
import {
  getDocs,
  deleteDoc,
  getUserDocRef,
  getHabitsCollectionRef,
  getEntriesCollectionRef,
  getExpenseEntriesCollectionRef,
  getExpenseSettingsDocRef,
} from './firestore';

/**
 * Permanently deletes all Firestore documents and subcollections for a user
 * (Habits, Habit Check-ins, Expenses, Settings, and User Profile)
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

  // 4. Delete root User Profile document users/{uid}
  const userRef = getUserDocRef(uid);
  await deleteDoc(userRef);
}

/**
 * Executes a full GDPR / CCPA Article 17 "Right to Erasure" Account Deletion:
 * 1. Cascades deletion across all Firestore subcollections
 * 2. Clears all client-side local cache & storage
 * 3. Permanently deletes the Firebase Auth user record
 */
export async function eraseUserAccountAndAllData(user: User): Promise<void> {
  const uid = user.uid;

  // 1. Wipe all cloud database records
  await deleteAllFirestoreUserData(uid);

  // 2. Clear all local client storage and cache
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    console.warn('Local storage clear note:', e);
  }

  // 3. Delete Firebase Authentication user record
  await deleteUser(user);
}
