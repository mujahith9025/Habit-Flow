import { useState, useEffect } from 'react';
import { onSnapshot, getUserDocRef } from '../lib/firebase';
import { useAuth } from './useAuth';
import { UserProfile } from '../types';

export interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Real-time subscription to the current user's profile document at users/{uid}
 */
export function useUserProfile(): UseUserProfileResult {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(authUser);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!authUser?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userDocRef = getUserDocRef(authUser.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data() as UserProfile);
        } else {
          setProfile(authUser);
        }
        setLastUpdated(new Date());
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('Real-time useUserProfile listener warning:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authUser?.uid]);

  return { profile, loading, error, lastUpdated };
}
