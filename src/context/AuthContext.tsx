import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User, auth, isFirebaseConfigured, getUserProfile, signOutUser } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  signInDemo: (name?: string, email?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'habitflow_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Check if demo user session exists in localStorage
    try {
      const saved = localStorage.getItem(DEMO_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore JSON parse errors
    }
    return null;
  });
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.info('Firebase is running in local/demo mode with placeholder keys.');
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (fbUser: User | null) => {
          setFirebaseUser(fbUser);
          if (fbUser) {
            try {
              // Retrieve Firestore profile
              const profile = await getUserProfile(fbUser.uid);
              if (profile) {
                setUser(profile);
              } else {
                setUser({
                  uid: fbUser.uid,
                  name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Habit Flow User',
                  email: fbUser.email || '',
                  photoURL: fbUser.photoURL || '',
                  createdAt: new Date().toISOString(),
                  lastLoginAt: new Date().toISOString(),
                  authProvider: 'password',
                });
              }
            } catch (e) {
              console.warn('Error loading user profile:', e);
              setUser({
                uid: fbUser.uid,
                name: fbUser.displayName || 'Habit Flow User',
                email: fbUser.email || '',
                photoURL: fbUser.photoURL || '',
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                authProvider: 'password',
              });
            }
          } else {
            // Check if demo user is active
            const demo = localStorage.getItem(DEMO_STORAGE_KEY);
            if (demo) {
              try {
                setUser(JSON.parse(demo));
              } catch {
                setUser(null);
              }
            } else {
              setUser(null);
            }
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Firebase Auth State warning:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase auth initialization warning:', e);
      setLoading(false);
    }
  }, []);

  const signInDemo = (name: string = 'Alex River', email: string = 'alex@example.com') => {
    const demoUser: UserProfile = {
      uid: 'demo-user-12345',
      name,
      email,
      photoURL: '',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      authProvider: 'password',
    };
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser));
    } catch (e) {
      console.warn('Could not write demo session:', e);
    }
    setUser(demoUser);
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      await signOutUser();
    } catch (err: unknown) {
      console.warn('Sign out warning:', err);
    } finally {
      setUser(null);
      setFirebaseUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        error,
        isAuthenticated: !!user,
        signOut: handleSignOut,
        signInDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
