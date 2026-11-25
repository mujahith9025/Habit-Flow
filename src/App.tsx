import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppLockProvider } from './context/AppLockContext';
import { AppRoutes } from './routes/AppRoutes';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import { OfflineSyncBanner } from './components/ui/OfflineSyncBanner';
import { PrivacyCurtain } from './components/security/PrivacyCurtain';
import { AppLockScreen } from './components/security/AppLockScreen';

const AppContent: React.FC = () => {
  // Mount background notification scheduler
  useNotificationScheduler();

  return (
    <>
      {/* Mobile App Switcher & Task Manager Privacy Curtain */}
      <PrivacyCurtain />

      {/* Biometric & Hardware App Lock Screen */}
      <AppLockScreen />

      <AppRoutes />
      <OfflineSyncBanner />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppLockProvider>
            <AppContent />
          </AppLockProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
