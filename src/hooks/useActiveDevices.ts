import { useState, useEffect, useCallback } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
import {
  UserDeviceSession,
  getOrCreateDeviceId,
  getDevicesCollectionRef,
  registerDeviceSession,
  revokeDeviceSession as revokeDeviceService,
  revokeAllOtherDevices as revokeAllOtherService,
} from '../lib/firebase/sessionManager';

export interface UseActiveDevicesResult {
  devices: UserDeviceSession[];
  currentDeviceId: string;
  loading: boolean;
  revokeDevice: (deviceId: string) => Promise<void>;
  revokeAllOtherDevices: () => Promise<void>;
  refreshHeartbeat: () => Promise<void>;
}

export function useActiveDevices(): UseActiveDevicesResult {
  const { user, signOut } = useAuth();
  const [devices, setDevices] = useState<UserDeviceSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const currentDeviceId = getOrCreateDeviceId();

  // 1. Register device session & listen in real-time
  useEffect(() => {
    if (!user?.uid) {
      setDevices([]);
      setLoading(false);
      return;
    }

    // Register current session immediately
    registerDeviceSession(user.uid).catch((err) => {
      console.debug('Device session heartbeat notice:', err);
    });

    const colRef = getDevicesCollectionRef(user.uid);

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: UserDeviceSession[] = [];
        let currentStillActive = false;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as UserDeviceSession;
          const isCurrent = data.id === currentDeviceId;
          if (isCurrent) {
            currentStillActive = true;
          }
          list.push({
            ...data,
            isCurrent,
          });
        });

        // Sort current device first, then newest lastActive
        list.sort((a, b) => {
          if (a.isCurrent) return -1;
          if (b.isCurrent) return 1;
          return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
        });

        setDevices(list);
        setLoading(false);

        // If another device remotely revoked this device's session, sign out gracefully
        if (!currentStillActive && snapshot.docs.length > 0 && list.length > 0) {
          console.warn('[Security] This device session was remotely revoked.');
          signOut().catch(() => {});
        }
      },
      (err) => {
        console.warn('Error listening to active device sessions:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, currentDeviceId, signOut]);

  // 2. Revoke specific device
  const revokeDevice = useCallback(
    async (deviceId: string): Promise<void> => {
      if (!user?.uid) return;
      await revokeDeviceService(user.uid, deviceId);
    },
    [user?.uid]
  );

  // 3. Revoke all other devices
  const revokeAllOtherDevices = useCallback(async (): Promise<void> => {
    if (!user?.uid) return;
    await revokeAllOtherService(user.uid, currentDeviceId);
  }, [user?.uid, currentDeviceId]);

  // 4. Manual heartbeat
  const refreshHeartbeat = useCallback(async (): Promise<void> => {
    if (!user?.uid) return;
    await registerDeviceSession(user.uid);
  }, [user?.uid]);

  return {
    devices,
    currentDeviceId,
    loading,
    revokeDevice,
    revokeAllOtherDevices,
    refreshHeartbeat,
  };
}
