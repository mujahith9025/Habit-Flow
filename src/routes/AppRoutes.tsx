import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { PublicOnlyRoute } from '../components/auth/PublicOnlyRoute';
import { DashboardPage } from '../pages/DashboardPage';
import { HabitDetailPage } from '../pages/HabitDetailPage';
import { LoginPage } from '../pages/LoginPage';
import { SignUpPage } from '../pages/SignUpPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ExpenseTrackerPage } from '../pages/ExpenseTrackerPage';
import { InstallAppPage } from '../pages/InstallAppPage';
import { DataLayerDebugPage } from '../pages/DataLayerDebugPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Only Authentication Routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/signup" element={<SignUpPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/habit" element={<HabitDetailPage />} />
          <Route path="/habits" element={<HabitDetailPage />} />
          <Route path="/habit/:id" element={<HabitDetailPage />} />
          <Route path="/expenses" element={<ExpenseTrackerPage />} />
          <Route path="/savings" element={<ExpenseTrackerPage />} />
          <Route path="/money" element={<ExpenseTrackerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/install" element={<InstallAppPage />} />
          <Route path="/debug" element={<DataLayerDebugPage />} />
        </Route>
      </Route>

      {/* Unmatched / 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
