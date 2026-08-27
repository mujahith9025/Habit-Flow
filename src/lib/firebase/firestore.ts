import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Firestore,
  CollectionReference,
  DocumentReference,
  DocumentData,
  Query,
} from 'firebase/firestore';
import { app } from './config';
import { Habit, HabitEntry, UserProfile, DailyMoneyEntry, ExpenseTrackerSettings } from '../../types';

// Initialize Firestore with Multi-Tab IndexedDB Persistence for offline support
let dbInstance: Firestore;

try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (e) {
  // If Firestore is already initialized or persistence fails, fallback to getFirestore
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

// Helper to get typed Document References
export const getUserDocRef = (uid: string): DocumentReference<UserProfile> => {
  return doc(db, 'users', uid) as DocumentReference<UserProfile>;
};

export const getHabitsCollectionRef = (uid: string): CollectionReference<Habit> => {
  return collection(db, 'users', uid, 'habits') as CollectionReference<Habit>;
};

export const getHabitDocRef = (uid: string, habitId: string): DocumentReference<Habit> => {
  return doc(db, 'users', uid, 'habits', habitId) as DocumentReference<Habit>;
};

export const getEntriesCollectionRef = (
  uid: string,
  habitId: string
): CollectionReference<HabitEntry> => {
  return collection(db, 'users', uid, 'habits', habitId, 'entries') as CollectionReference<HabitEntry>;
};

export const getEntryDocRef = (
  uid: string,
  habitId: string,
  dateKey: string
): DocumentReference<HabitEntry> => {
  return doc(db, 'users', uid, 'habits', habitId, 'entries', dateKey) as DocumentReference<HabitEntry>;
};

export const getExpenseEntriesCollectionRef = (
  uid: string
): CollectionReference<DailyMoneyEntry> => {
  return collection(db, 'users', uid, 'expense_entries') as CollectionReference<DailyMoneyEntry>;
};

export const getExpenseEntryDocRef = (
  uid: string,
  dateKey: string
): DocumentReference<DailyMoneyEntry> => {
  return doc(db, 'users', uid, 'expense_entries', dateKey) as DocumentReference<DailyMoneyEntry>;
};

export const getExpenseSettingsDocRef = (
  uid: string
): DocumentReference<ExpenseTrackerSettings> => {
  return doc(db, 'users', uid, 'expense_settings', 'config') as DocumentReference<ExpenseTrackerSettings>;
};

export {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  type DocumentData,
  type Query,
};
