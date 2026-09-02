import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ExpensePrivacyProvider } from './context/ExpensePrivacyContext';
import { AppRoutes } from './routes/AppRoutes';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';

const AppContent: React.FC = () => {
  // Mount background notification scheduler
  useNotificationScheduler();

  return <AppRoutes />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ExpensePrivacyProvider>
            <AppContent />
          </ExpensePrivacyProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
