import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { PublicOnlyRoute } from '../components/auth/PublicOnlyRoute';
import { PageLoadingFallback } from '../components/ui/PageLoadingFallback';

// Route-Level Code Splitting (React.lazy)
const DashboardPage = lazy(() => import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const HabitDetailPage = lazy(() => import('../pages/HabitDetailPage').then((m) => ({ default: m.HabitDetailPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignUpPage = lazy(() => import('../pages/SignUpPage').then((m) => ({ default: m.SignUpPage })));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const ExpenseTrackerPage = lazy(() => import('../pages/ExpenseTrackerPage').then((m) => ({ default: m.ExpenseTrackerPage })));
const InstallAppPage = lazy(() => import('../pages/InstallAppPage').then((m) => ({ default: m.InstallAppPage })));
const DataLayerDebugPage = lazy(() => import('../pages/DataLayerDebugPage').then((m) => ({ default: m.DataLayerDebugPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
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
            <Route path="/expense" element={<ExpenseTrackerPage />} />
            <Route path="/expenses" element={<ExpenseTrackerPage />} />
            <Route path="/savings" element={<ExpenseTrackerPage />} />
            <Route path="/money" element={<ExpenseTrackerPage />} />
            <Route path="/setting" element={<SettingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/install" element={<InstallAppPage />} />
            <Route path="/debug" element={<DataLayerDebugPage />} />
          </Route>
        </Route>

        {/* Unmatched / 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

