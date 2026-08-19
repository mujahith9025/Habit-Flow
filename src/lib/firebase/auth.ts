import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  AuthError,
} from 'firebase/auth';
import { app } from './config';
import { syncUserDocument } from './userSync';
import { UserProfile } from '../../types';

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign up with Email and Password
 */
export async function signUpWithEmail(
  name: string,
  email: string,
  pass: string
): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const user = credential.user;

  // Update profile display name on Auth object
  if (name.trim()) {
    try {
      await updateProfile(user, { displayName: name.trim() });
    } catch (e) {
      console.warn('Could not set displayName on auth user:', e);
    }
  }

  // Create Firestore document at users/{uid}
  return await syncUserDocument(user, name.trim(), 'password');
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(
  email: string,
  pass: string
): Promise<UserProfile> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const user = credential.user;

  // Update lastLoginAt in Firestore
  return await syncUserDocument(user, null, 'password');
}

/**
 * Sign in with Google (Popup with fallback to Redirect)
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return await syncUserDocument(result.user, result.user.displayName, 'google');
  } catch (error: unknown) {
    const authErr = error as AuthError;
    // On mobile or popup-blocked browsers, try redirect
    if (authErr.code === 'auth/popup-blocked' || authErr.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, googleProvider);
      throw new Error('Redirecting to Google Sign-In...');
    }
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn('Firebase sign-out note:', e);
  }
}

/**
 * Translates Firebase Auth error codes to user-friendly messages matching Stitch UI
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  
  const err = error as { code?: string; message?: string };
  const code = err.code || '';
  const message = err.message || '';

  if (code.includes('api-key-not-valid') || message.includes('api-key-not-valid') || code.includes('invalid-api-key')) {
    return 'Firebase API Key is not configured or invalid in .env.local. You can add your real Firebase API Key, or click "Explore with Demo Account" below to test the app immediately.';
  }

  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/weak-password':
      return 'Password should be at least 8 characters long.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few moments and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before finishing.';
    default:
      return err.message || 'Authentication failed. Please verify your details.';
  }
}

export { onAuthStateChanged, type User };
