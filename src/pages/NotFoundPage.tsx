import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card variant="elevated" className="text-center p-8 max-w-md space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed/30 text-tertiary mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px]">error_outline</span>
        </div>
        <h1 className="font-app-title text-2xl font-bold text-on-surface">Page Not Found</h1>
        <p className="font-body-text text-sm text-on-surface-variant">
          The requested page could not be located in HabitFlow.
        </p>
        <div className="pt-2">
          <Link to="/dashboard">
            <Button variant="primary" size="md">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
