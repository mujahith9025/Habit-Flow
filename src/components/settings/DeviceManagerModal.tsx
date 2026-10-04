import React, { useState } from 'react';
import { useActiveDevices } from '../../hooks/useActiveDevices';
import { triggerHaptic } from '../../utils/haptics';

interface DeviceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceManagerModal: React.FC<DeviceManagerModalProps> = ({ isOpen, onClose }) => {
  const { devices, currentDeviceId, loading, revokeDevice, revokeAllOtherDevices } = useActiveDevices();
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  if (!isOpen) return null;

  const otherDevices = devices.filter((d) => !d.isCurrent && d.id !== currentDeviceId);

  const handleRevokeSingle = async (deviceId: string) => {
    try {
      setRevokingId(deviceId);
      triggerHaptic('warning');
      await revokeDevice(deviceId);
    } catch (err) {
      console.error('Failed to revoke device session:', err);
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOther = async () => {
    try {
      setIsRevokingAll(true);
      triggerHaptic('warning');
      await revokeAllOtherDevices();
    } catch (err) {
      console.error('Failed to revoke other devices:', err);
    } finally {
      setIsRevokingAll(false);
    }
  };

  const formatLastActive = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));

      if (diffMins < 1) return 'Active just now';
      if (diffMins < 60) return `Active ${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Active ${diffHours}h ago`;
      return `Active on ${date.toLocaleDateString()}`;
    } catch {
      return 'Recently active';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-surface-container-lowest dark:bg-surface-container rounded-3xl p-6 sm:p-7 shadow-2xl border border-outline-variant/20 space-y-6 animate-scaleUp overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-manager-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">devices</span>
            </div>
            <div>
              <h3 id="device-manager-title" className="font-app-title text-lg sm:text-xl font-bold text-on-surface">
                Active Devices & Sessions
              </h3>
              <p className="font-body-text text-xs text-on-surface-variant">
                Manage all phones, tablets, and PCs logged into this account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Action: Sign Out All Other Devices */}
        {otherDevices.length > 0 && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-error-container/15 border border-error/20">
            <div>
              <p className="text-xs font-bold text-error">Unrecognized session?</p>
              <p className="text-[11px] text-on-surface-variant">
                Sign out of {otherDevices.length} other active device{otherDevices.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRevokeAllOther}
              disabled={isRevokingAll}
              className="px-3 py-1.5 rounded-xl text-xs font-bold font-stat-label bg-error text-white hover:bg-error/90 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isRevokingAll ? 'Revoking...' : 'Sign Out Others'}
            </button>
          </div>
        )}

        {/* Devices List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-on-surface-variant animate-pulse flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[28px] animate-spin text-primary">sync</span>
              <span>Loading registered devices...</span>
            </div>
          ) : devices.length === 0 ? (
            <div className="py-8 text-center text-xs text-on-surface-variant">
              No other active devices registered.
            </div>
          ) : (
            devices.map((device) => {
              const isCurrent = device.isCurrent || device.id === currentDeviceId;
              const isRevoking = revokingId === device.id;

              return (
                <div
                  key={device.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-primary/5 dark:bg-primary/10 border-primary/30 ring-1 ring-primary/20'
                      : 'bg-surface-container-low dark:bg-surface-container border-outline-variant/15'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {device.type === 'mobile'
                          ? 'smartphone'
                          : device.type === 'tablet'
                          ? 'tablet'
                          : 'laptop'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-habit-name text-xs sm:text-sm font-bold text-on-surface truncate">
                          {device.name}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold font-stat-label flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            This Device
                          </span>
                        )}
                      </div>
                      <p className="font-body-text text-[11px] text-on-surface-variant mt-0.5">
                        {isCurrent ? 'Current Session' : formatLastActive(device.lastActive)}
                      </p>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSingle(device.id)}
                      disabled={isRevoking}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold font-stat-label bg-surface-container-highest hover:bg-error/15 text-error border border-error/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isRevoking ? 'Revoking...' : 'Revoke'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-outline-variant/15 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-bold font-stat-label bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceManagerModal;
