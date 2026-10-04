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
const AUTH_PROFILE_KEY = 'habitflow_cached_auth_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    // 1. Instant 0ms session recovery from cached profile or demo user
    try {
      const cached = localStorage.getItem(AUTH_PROFILE_KEY);
      if (cached) return JSON.parse(cached);
      const demo = localStorage.getItem(DEMO_STORAGE_KEY);
      if (demo) return JSON.parse(demo);
    } catch {
      // Ignore JSON parse errors
    }
    return null;
  });
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => {
    // If cached session exists, never block startup rendering!
    try {
      return !localStorage.getItem(AUTH_PROFILE_KEY) && !localStorage.getItem(DEMO_STORAGE_KEY);
    } catch {
      return true;
    }
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.info('Firebase is running in local/demo mode with placeholder keys.');
      setLoading(false);
      return;
    }

    // Safety timeout: Ensure app NEVER hangs on splash/loading for more than 1.5s on weak mobile connections
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (fbUser: User | null) => {
          clearTimeout(safetyTimer);
          setFirebaseUser(fbUser);
          if (fbUser) {
            // Instant 0ms optimistic profile from local Firebase Auth session
            const baseProfile: UserProfile = {
              uid: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Habit Flow User',
              email: fbUser.email || '',
              photoURL: fbUser.photoURL || '',
              createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
              lastLoginAt: fbUser.metadata.lastSignInTime || new Date().toISOString(),
              authProvider: fbUser.providerData[0]?.providerId.includes('google') ? 'google' : 'password',
            };
            
            setUser((prev) => {
              const updated = prev?.uid === fbUser.uid ? { ...baseProfile, ...prev } : baseProfile;
              try {
                localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(updated));
              } catch {
                // Ignore storage quota
              }
              return updated;
            });
            setLoading(false); // Unblock rendering immediately!

            // Asynchronously fetch extended Firestore profile in the background
            getUserProfile(fbUser.uid)
              .then((profile) => {
                if (profile) {
                  setUser((prev) => {
                    const merged = { ...prev, ...profile };
                    try {
                      localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(merged));
                    } catch {}
                    return merged;
                  });
                }
              })
              .catch((e) => {
                console.debug('Background profile sync notice:', e);
              });
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
              try {
                localStorage.removeItem(AUTH_PROFILE_KEY);
              } catch {}
              setUser(null);
            }
            setLoading(false);
          }
        },
        (err) => {
          clearTimeout(safetyTimer);
          console.warn('Firebase Auth State warning:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => {
        clearTimeout(safetyTimer);
        unsubscribe();
      };
    } catch (e) {
      clearTimeout(safetyTimer);
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
      localStorage.removeItem(AUTH_PROFILE_KEY);
    } catch (e) {
      console.warn('Could not write demo session:', e);
    }
    setUser(demoUser);
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      localStorage.removeItem(AUTH_PROFILE_KEY);
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
