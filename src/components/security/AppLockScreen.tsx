import React, { useState, useEffect, useCallback } from 'react';
import { useAppLock } from '../../context/AppLockContext';
import { HabitFlowLogo } from '../ui/HabitFlowLogo';
import { triggerHaptic } from '../../utils/haptics';

export const AppLockScreen: React.FC = () => {
  const {
    isLocked,
    isBiometricsSupported,
    hasPin,
    authenticateBiometric,
    unlockWithPin,
  } = useAppLock();

  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPinPad, setShowPinPad] = useState(false);

  // Auto-prompt biometrics once when lock screen appears
  useEffect(() => {
    if (isLocked && isBiometricsSupported && !showPinPad) {
      const timer = setTimeout(() => {
        handleBiometricPrompt();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLocked, isBiometricsSupported]);

  const handleBiometricPrompt = async () => {
    setIsAuthenticating(true);
    setErrorMsg('');
    try {
      const success = await authenticateBiometric();
      if (!success) {
        if (hasPin) {
          setShowPinPad(true);
        } else {
          setErrorMsg('Biometric authentication cancelled. Tap below to retry.');
        }
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleKeyPress = useCallback(
    async (digit: string) => {
      triggerHaptic('selection');
      setErrorMsg('');

      if (digit === 'backspace') {
        setPinInput((prev) => prev.slice(0, -1));
        return;
      }

      if (pinInput.length >= 6) return;

      const nextPin = pinInput + digit;
      setPinInput(nextPin);

      // Auto-submit if 4 or 6 digits
      if (nextPin.length === 4 || nextPin.length === 6) {
        setIsAuthenticating(true);
        const valid = await unlockWithPin(nextPin);
        setIsAuthenticating(false);
        if (!valid) {
          setErrorMsg('Incorrect PIN. Please try again.');
          setPinInput('');
        }
      }
    },
    [pinInput, unlockWithPin]
  );

  if (!isLocked) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="HabitFlow Security Lock Screen"
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-surface/98 dark:bg-[#0B0C0E]/98 backdrop-blur-2xl px-6 py-10 select-none animate-fadeIn"
    >
      {/* Top Header */}
      <div className="flex flex-col items-center text-center space-y-3 pt-6 sm:pt-10">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg">
            <HabitFlowLogo size={48} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[16px]">lock</span>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="font-app-title text-2xl font-bold text-on-surface tracking-tight">
            HabitFlow Locked
          </h1>
          <p className="font-body-text text-xs text-on-surface-variant max-w-xs">
            Authenticate with Touch ID, Face ID, Windows Hello, or PIN to continue.
          </p>
        </div>

        {errorMsg && (
          <div className="px-3.5 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-bold animate-shake">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Middle: Biometrics or PIN Pad */}
      <div className="w-full max-w-xs flex flex-col items-center justify-center my-auto space-y-6">
        {/* PIN Dots Indicator */}
        {(hasPin || showPinPad) && (
          <div className="flex items-center justify-center gap-4 py-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                  pinInput.length > idx
                    ? 'bg-primary border-primary scale-110 shadow-xs'
                    : 'border-outline-variant/60 bg-surface-container-high/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Biometrics Action Button */}
        {isBiometricsSupported && !showPinPad && (
          <div className="w-full space-y-3">
            <button
              type="button"
              disabled={isAuthenticating}
              onClick={handleBiometricPrompt}
              className="w-full py-4 px-6 rounded-2xl bg-primary text-on-primary font-bold font-stat-label text-sm flex items-center justify-center gap-3 shadow-md hover:bg-primary/95 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[24px]">fingerprint</span>
              <span>{isAuthenticating ? 'Scanning...' : 'Unlock with Biometrics'}</span>
            </button>

            {hasPin && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowPinPad(true);
                }}
                className="w-full py-2.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                Use PIN Instead
              </button>
            )}
          </div>
        )}

        {/* Numeric PIN Keypad */}
        {(showPinPad || (!isBiometricsSupported && hasPin)) && (
          <div className="w-full space-y-4">
            <div className="grid grid-cols-3 gap-3.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-surface-container-low dark:bg-surface-container-high/40 hover:bg-surface-container-high active:scale-90 border border-outline-variant/20 flex items-center justify-center text-xl font-bold font-mono text-on-surface transition-all cursor-pointer mx-auto shadow-xs"
                >
                  {num}
                </button>
              ))}

              {/* Bottom row: Switch back to Biometrics, 0, Backspace */}
              {isBiometricsSupported ? (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setShowPinPad(false);
                    handleBiometricPrompt();
                  }}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 active:scale-90 transition-all cursor-pointer mx-auto"
                  title="Switch to Biometrics"
                >
                  <span className="material-symbols-outlined text-[26px]">fingerprint</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-surface-container-low dark:bg-surface-container-high/40 hover:bg-surface-container-high active:scale-90 border border-outline-variant/20 flex items-center justify-center text-xl font-bold font-mono text-on-surface transition-all cursor-pointer mx-auto shadow-xs"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => handleKeyPress('backspace')}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-90 transition-all cursor-pointer mx-auto"
                title="Backspace"
              >
                <span className="material-symbols-outlined text-[24px]">backspace</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="text-center text-[11px] text-on-surface-variant/70 pb-2">
        <span>Hardware-backed encryption • Zero-Knowledge HabitFlow</span>
      </div>
    </div>
  );
};
