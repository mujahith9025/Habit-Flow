import React from 'react';
import { Outlet } from 'react-router-dom';
import { DesktopSidebar } from './DesktopSidebar';
import { TopHeader } from './TopHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { OfflineBanner } from '../ui/OfflineBanner';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* Offline Status Warning Bar */}
      <OfflineBanner />

      {/* Desktop Sidebar (visible on md+) */}
      <DesktopSidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Top Header */}
        <TopHeader />

        {/* Dynamic Route Content */}
        <main className="flex-1 px-container-padding py-md sm:py-lg pb-28 md:pb-12 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation (visible below md) */}
      <MobileBottomNav />
    </div>
  );
};
