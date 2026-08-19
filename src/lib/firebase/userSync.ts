import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firestore';
import { UserProfile, AuthProviderType } from '../../types';

/**
 * Synchronizes Firebase Auth user with the Firestore users/{uid} document.
 * On first login: creates users/{uid} document with profile data.
 * On subsequent logins: updates lastLoginAt field.
 */
export async function syncUserDocument(
  firebaseUser: User,
  customName?: string | null,
  provider: AuthProviderType = 'password'
): Promise<UserProfile> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const now = new Date().toISOString();

  try {
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      // First sign-up / first login: create user document
      const initialProfile: UserProfile = {
        uid: firebaseUser.uid,
        name: customName || firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Habit Hero'),
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || '',
        createdAt: now,
        lastLoginAt: now,
        authProvider: provider,
        themePreference: 'light',
      };

      await setDoc(userRef, initialProfile);
      return initialProfile;
    } else {
      // Subsequent login: update lastLoginAt
      const existingData = snap.data() as UserProfile;
      const updates: Partial<UserProfile> = {
        lastLoginAt: now,
      };

      // If user signed in with Google and had empty name/photo, update with latest
      if (firebaseUser.displayName && !existingData.name) {
        updates.name = firebaseUser.displayName;
      }
      if (firebaseUser.photoURL && !existingData.photoURL) {
        updates.photoURL = firebaseUser.photoURL;
      }

      await updateDoc(userRef, updates);
      return {
        ...existingData,
        ...updates,
      };
    }
  } catch (err) {
    console.warn('Firestore user document sync fallback (offline or dev mode):', err);
    // Graceful fallback profile
    return {
      uid: firebaseUser.uid,
      name: customName || firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Habit Hero'),
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || '',
      createdAt: now,
      lastLoginAt: now,
      authProvider: provider,
    };
  }
}

/**
 * Fetches user profile from Firestore users/{uid}
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching user profile from Firestore:', err);
    return null;
  }
}
