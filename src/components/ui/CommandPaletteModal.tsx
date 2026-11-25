import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHabits } from '../../hooks/useHabits';
import { useDailyHabitsData } from '../../hooks/useDailyHabitsData';
import { useTheme, type Theme } from '../../hooks/useTheme';
import { announce } from '../../utils/announcer';
import { triggerHaptic } from '../../utils/haptics';
import { playCheckChime } from '../../utils/zenAudio';
import { formatDateKey } from '../../lib/calculations';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewHabitModal?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Habits' | 'Navigation' | 'Appearance' | 'Actions';
  icon: string;
  iconColor?: string;
  badge?: string;
  shortcut?: string;
  perform: () => void | Promise<void>;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenNewHabitModal,
}) => {
  const navigate = useNavigate();
  const { habits } = useHabits('all');
  const today = useMemo(() => new Date(), []);
  const { toggleHabitEntry, isCompleted } = useDailyHabitsData(today);
  const { theme, setTheme } = useTheme();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const todayKey = formatDateKey(today);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      triggerHaptic('selection');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Construct items list
  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];

    // 1. Habits (toggle today)
    habits
      .filter((h) => !h.archived)
      .forEach((habit) => {
        const done = isCompleted(habit.id, todayKey);
        list.push({
          id: `habit_${habit.id}`,
          title: habit.name,
          subtitle: `${habit.category || 'General'} • ${done ? 'Completed today' : 'Tap to check off'}`,
          category: 'Habits',
          icon: done ? 'check_circle' : habit.icon || 'spa',
          iconColor: done ? '#2D5A34' : habit.color || '#2D5A34',
          badge: done ? 'DONE' : 'PENDING',
          perform: async () => {
            triggerHaptic('light');
            playCheckChime();
            await toggleHabitEntry(habit.id, todayKey);
            announce(
              `${done ? 'Unchecked' : 'Checked off'} ${habit.name} for today.`
            );
            onClose();
          },
        });
      });

    // 2. Navigation Actions
    list.push(
      {
        id: 'nav_dashboard',
        title: "Go to Today's Dashboard",
        subtitle: 'Daily routine, checklist & rituals',
        category: 'Navigation',
        icon: 'dashboard',
        shortcut: 'G D',
        perform: () => {
          navigate('/dashboard');
          announce('Navigated to Dashboard');
          onClose();
        },
      },
      {
        id: 'nav_analytics',
        title: 'Go to Analytics & Reports',
        subtitle: 'Consistency heatmaps, streaks & PDF export',
        category: 'Navigation',
        icon: 'insights',
        shortcut: 'G A',
        perform: () => {
          navigate('/habit');
          announce('Navigated to Analytics and Reports');
          onClose();
        },
      },
      {
        id: 'nav_settings',
        title: 'Open Settings',
        subtitle: 'Manage active devices, backup, and themes',
        category: 'Navigation',
        icon: 'tune',
        shortcut: 'G S',
        perform: () => {
          navigate('/settings');
          announce('Navigated to Settings');
          onClose();
        },
      },
      {
        id: 'nav_install',
        title: 'Install PWA Mobile App',
        subtitle: 'Add HabitFlow to home screen',
        category: 'Navigation',
        icon: 'install_mobile',
        perform: () => {
          navigate('/install');
          onClose();
        },
      }
    );

    // 3. Actions
    if (onOpenNewHabitModal) {
      list.push({
        id: 'action_new_habit',
        title: 'Create New Habit',
        subtitle: 'Define a boolean, numeric target, or timer habit',
        category: 'Actions',
        icon: 'add_circle',
        shortcut: 'N',
        perform: () => {
          onClose();
          onOpenNewHabitModal();
        },
      });
    }

    // 4. Appearance & Themes
    const themes: Array<{ name: string; key: Theme; icon: string; desc: string }> = [
      { name: 'Light Organic Mode', key: 'light', icon: 'light_mode', desc: 'Warm Japandi parchment theme' },
      { name: 'Dark Mode', key: 'dark', icon: 'dark_mode', desc: 'Calming dark botanical theme' },
      { name: 'OLED Pure Obsidian Mode', key: 'oled', icon: 'brightness_empty', desc: 'Deep black #0B0C0E AMOLED battery saver' },
    ];

    themes.forEach((t) => {
      const isCurrent = theme === t.key;
      list.push({
        id: `theme_${t.key}`,
        title: `Switch to ${t.name}`,
        subtitle: `${t.desc}${isCurrent ? ' (Active)' : ''}`,
        category: 'Appearance',
        icon: t.icon,
        badge: isCurrent ? 'ACTIVE' : undefined,
        perform: () => {
          setTheme(t.key);
          triggerHaptic('selection');
          announce(`Switched to ${t.name}`);
          onClose();
        },
      });
    });

    return list;
  }, [
    habits,
    isCompleted,
    todayKey,
    theme,
    navigate,
    onClose,
    onOpenNewHabitModal,
    setTheme,
    toggleHabitEntry,
  ]);

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;
    return allCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.subtitle?.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [allCommands, query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev - 1 < 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].perform();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Keep selected item scrolled into view
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-command-item]');
      const activeEl = items[selectedIndex] as HTMLElement | undefined;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface dark:bg-surface-container-low oled:!bg-[#0B0C0E] border border-outline-variant/30 oled:border-outline-variant/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scaleUp transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/20">
          <span className="material-symbols-outlined text-[22px] text-primary shrink-0">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a habit, theme, or command... (e.g. Meditation, Dark, Settings)"
            className="flex-1 bg-transparent border-none outline-hidden text-sm text-on-surface placeholder:text-on-surface-variant/60 font-body-text"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-surface-container-high/60 text-[10px] font-mono text-on-surface-variant font-bold">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-xs text-on-surface-variant space-y-1">
              <span className="material-symbols-outlined text-[28px] opacity-40">
                search_off
              </span>
              <p>No matching habits or commands for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  data-command-item
                  onClick={() => cmd.perform()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'hover:bg-surface-container-high/40 text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-surface-container-high/60 text-primary'
                      }`}
                      style={{
                        color: isSelected ? '#FFFFFF' : cmd.iconColor || undefined,
                      }}
                    >
                      <span className="material-symbols-outlined text-[19px]">
                        {cmd.icon}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isSelected ? 'text-white' : 'text-on-surface'
                          }`}
                        >
                          {cmd.title}
                        </span>
                        {cmd.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                              isSelected
                                ? 'bg-white/25 text-white'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      {cmd.subtitle && (
                        <p
                          className={`text-[11px] truncate mt-0.5 ${
                            isSelected
                              ? 'text-white/80'
                              : 'text-on-surface-variant'
                          }`}
                        >
                          {cmd.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Shortcut Hint or Action Pill */}
                  <div className="shrink-0 flex items-center gap-1">
                    {cmd.shortcut && (
                      <kbd
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-surface-container-highest text-on-surface-variant'
                        }`}
                      >
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <span className="material-symbols-outlined text-[16px] text-white/80">
                        keyboard_return
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 bg-surface-container-low/60 dark:bg-surface-container-low/30 border-t border-outline-variant/15 flex items-center justify-between text-[11px] text-on-surface-variant">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] font-mono">
                ↑↓
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] font-mono">
                ↵
              </kbd>
              <span>to select</span>
            </span>
          </div>
          <span>{filteredCommands.length} command{filteredCommands.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPaletteModal;
