import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
          <p className="font-body-text text-xs text-on-surface-variant animate-pulse">
            Loading HabitFlow...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect unauthenticated users to /login and preserve destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
