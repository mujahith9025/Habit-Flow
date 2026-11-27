import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { DesktopSidebar } from './DesktopSidebar';
import { TopHeader } from './TopHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { OfflineBanner } from '../ui/OfflineBanner';
import { ExitToast } from '../ui/ExitToast';
import { AriaLiveAnnouncer } from '../ui/AriaLiveAnnouncer';
import { CommandPaletteModal } from '../ui/CommandPaletteModal';
import { useBackButtonHandler } from '../../hooks/useBackButtonHandler';

export const AppShell: React.FC = () => {
  const { showExitToast } = useBackButtonHandler();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('habitflow_sidebar_collapsed');
    if (saved !== null) return saved === 'true';
    // Collapse by default on screens < 1024px (tablets) to maximize chart/grid breathing room
    return typeof window !== 'undefined' && window.innerWidth < 1024;
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Command Palette shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('habitflow_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row antialiased selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
      {/* Screen Reader Live Region Announcer (Polite & Assertive a11y) */}
      <AriaLiveAnnouncer />

      {/* Global Command Palette Modal (Cmd+K / Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Back Button Exit Warning Toast */}
      <ExitToast show={showExitToast} />

      {/* Offline Status Warning Bar */}
      <OfflineBanner />

      {/* Desktop Collapsible Sidebar (visible on md+) */}
      <DesktopSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 overflow-x-hidden">
        {/* Sticky Top Header */}
        <TopHeader
          isSidebarCollapsed={isSidebarCollapsed}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 px-container-padding py-md sm:py-lg pb-28 md:pb-12 max-w-[1500px] mx-auto w-full min-w-0 transition-all duration-300">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation (visible below md) */}
      <MobileBottomNav />
    </div>
  );
};
