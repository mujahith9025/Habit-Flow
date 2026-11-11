import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 animate-fadeIn">
      <Card variant="elevated" className="text-center p-8 sm:p-10 max-w-md space-y-5 rounded-3xl border border-outline-variant/20 shadow-soft">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center shadow-xs">
          <span className="material-symbols-outlined text-[32px]">spa</span>
        </div>
        <div className="space-y-2">
          <span className="text-[11px] font-stat-label font-bold text-primary uppercase tracking-wider">
            404 • Path Unknown
          </span>
          <h1 className="font-app-title text-2xl font-bold text-on-surface">A Quiet Turn</h1>
          <p className="font-body-text text-xs text-on-surface-variant italic leading-relaxed">
            &ldquo;A path not taken.<br />
            Return to what you are building, one day at a time.&rdquo;
          </p>
        </div>
        <div className="pt-2">
          <Link to="/dashboard">
            <Button variant="primary" size="md" className="rounded-full px-6 shadow-soft hover:shadow-glow">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
