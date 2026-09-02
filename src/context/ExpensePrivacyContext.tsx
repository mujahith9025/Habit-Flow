import React, { createContext, useContext, useState, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface ExpensePrivacyContextType {
  isDiscreetMode: boolean;
  toggleDiscreetMode: () => void;
  setDiscreetMode: (enabled: boolean) => void;
}

const STORAGE_KEY = 'habitflow_discreet_balance_mode';

const ExpensePrivacyContext = createContext<ExpensePrivacyContextType | undefined>(undefined);

export const ExpensePrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDiscreetMode, setIsDiscreetModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isDiscreetMode));
    } catch (e) {
      console.warn('Could not save discreet balance mode preference:', e);
    }
  }, [isDiscreetMode]);

  const toggleDiscreetMode = () => {
    triggerHaptic('light');
    setIsDiscreetModeState((prev) => !prev);
  };

  const setDiscreetMode = (enabled: boolean) => {
    triggerHaptic('light');
    setIsDiscreetModeState(enabled);
  };

  return (
    <ExpensePrivacyContext.Provider
      value={{
        isDiscreetMode,
        toggleDiscreetMode,
        setDiscreetMode,
      }}
    >
      {children}
    </ExpensePrivacyContext.Provider>
  );
};

export function useExpensePrivacy(): ExpensePrivacyContextType {
  const context = useContext(ExpensePrivacyContext);
  if (!context) {
    throw new Error('useExpensePrivacy must be used within an ExpensePrivacyProvider');
  }
  return context;
}
