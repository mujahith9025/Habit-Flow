import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useUserProfile } from '../hooks/useUserProfile';
import { useHabits } from '../hooks/useHabits';
import { useEntries } from '../hooks/useEntries';
import { HabitFrequency } from '../types';

export const DataLayerDebugPage: React.FC = () => {
  const { profile, loading: profileLoading, lastUpdated: profileUpdated } = useUserProfile();

  const [freqFilter, setFreqFilter] = useState<HabitFrequency | 'all'>('all');
  const {
    habits,
    loading: habitsLoading,
    lastUpdated: habitsUpdated,
    createHabit,
    deleteHabit,
    seedHabits,
  } = useHabits(freqFilter);

  // Selected habit for entry inspection
  const [selectedHabitId, setSelectedHabitId] = useState<string>('');
  const activeHabitId = selectedHabitId || (habits.length > 0 ? habits[0].id : '');

  // Current Month Key (e.g., "2026-08")
  const currentMonthKey = '2026-08';
  const {
    entries,
    loading: entriesLoading,
    lastUpdated: entriesUpdated,
    toggleEntry,
    isEntryCompleted,
  } = useEntries(activeHabitId, currentMonthKey);

  // Quick form for custom habit creation
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitFreq, setNewHabitFreq] = useState<HabitFrequency>('daily');
  const [isCreating, setIsCreating] = useState(false);
  const [toggleStatusMsg, setToggleStatusMsg] = useState<string | null>(null);

  // Days list for August 2026 test strip (e.g., 2026-08-15 through 2026-08-21)
  const testDates = [
    '2026-08-15',
    '2026-08-16',
    '2026-08-17',
    '2026-08-18',
    '2026-08-19', // Today
    '2026-08-20',
    '2026-08-21',
  ];

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    try {
      setIsCreating(true);
      await createHabit({
        name: newHabitName.trim(),
        frequency: newHabitFreq,
        icon: newHabitFreq === 'daily' ? 'mindfulness' : newHabitFreq === 'weekly' ? 'fitness_center' : 'menu_book',
        color: newHabitFreq === 'daily' ? '#006398' : newHabitFreq === 'weekly' ? '#286b33' : '#a03e40',
        goalCount: 1,
        sortOrder: habits.length,
      });
      setNewHabitName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (dateKey: string) => {
    try {
      const isDone = isEntryCompleted(dateKey);
      setToggleStatusMsg(`Optimistically toggled ${dateKey} to ${!isDone ? 'COMPLETED' : 'PENDING'}...`);
      await toggleEntry(dateKey);
      setToggleStatusMsg(`Server confirmed ${dateKey} write.`);
      setTimeout(() => setToggleStatusMsg(null), 3000);
    } catch (err: unknown) {
      setToggleStatusMsg(`Write failed, rolled back ${dateKey}`);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Banner & Multi-Tab Instructions */}
      <div className="p-4 rounded-2xl bg-primary-container/20 dark:bg-primary-container/10 border border-primary/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            <h1 className="font-app-title text-xl sm:text-2xl font-bold text-primary dark:text-primary-fixed-dim">
              Data Layer & Real-Time Sync Inspector
            </h1>
            <Badge variant="streak" size="sm">Phase A3</Badge>
          </div>
          <p className="font-body-text text-xs sm:text-sm text-on-surface-variant max-w-2xl">
            Real-time Firestore listeners (`onSnapshot`) + IndexedDB multi-tab offline persistence.
            Open this page in <strong>two browser tabs</strong> side-by-side to observe instantaneous multi-tab sync!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => seedHabits().catch(console.error)}
            leftIcon={<span className="material-symbols-outlined text-[16px]">auto_fix_high</span>}
          >
            Seed 3 Habits
          </Button>
        </div>
      </div>

      {/* Grid: Profile Doc & Real-time status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile Card */}
        <Card variant="elevated" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-section-header text-sm font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">person</span>
              useUserProfile()
            </h2>
            {profileLoading ? (
              <span className="text-[10px] text-outline animate-pulse">Syncing...</span>
            ) : (
              <Badge variant="secondary" size="sm">Live</Badge>
            )}
          </div>
          <div className="text-xs space-y-1 font-mono bg-surface-container-low dark:bg-surface-container p-2.5 rounded-xl border border-outline-variant/15 overflow-x-auto">
            <div><strong className="text-on-surface">UID:</strong> {profile?.uid?.substring(0, 12)}...</div>
            <div><strong className="text-on-surface">Name:</strong> {profile?.name}</div>
            <div><strong className="text-on-surface">Email:</strong> {profile?.email}</div>
            <div><strong className="text-on-surface">Provider:</strong> {profile?.authProvider}</div>
            <div><strong className="text-on-surface">Last Sync:</strong> {profileUpdated ? profileUpdated.toLocaleTimeString() : 'Waiting'}</div>
          </div>
        </Card>

        {/* Habits Listener Status */}
        <Card variant="elevated" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-section-header text-sm font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-secondary">task_alt</span>
              useHabits()
            </h2>
            {habitsLoading ? (
              <span className="text-[10px] text-outline animate-pulse">Syncing...</span>
            ) : (
              <Badge variant="secondary" size="sm">{habits.length} Loaded</Badge>
            )}
          </div>
          <div className="text-xs space-y-1 font-mono bg-surface-container-low dark:bg-surface-container p-2.5 rounded-xl border border-outline-variant/15">
            <div><strong className="text-on-surface">Frequency Filter:</strong> {freqFilter.toUpperCase()}</div>
            <div><strong className="text-on-surface">Habits Count:</strong> {habits.length}</div>
            <div><strong className="text-on-surface">Last Snapshot:</strong> {habitsUpdated ? habitsUpdated.toLocaleTimeString() : 'None'}</div>
          </div>
        </Card>

        {/* Entries Listener Status */}
        <Card variant="elevated" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-section-header text-sm font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-tertiary">calendar_month</span>
              useEntries()
            </h2>
            {entriesLoading ? (
              <span className="text-[10px] text-outline animate-pulse">Syncing...</span>
            ) : (
              <Badge variant="secondary" size="sm">{Object.keys(entries).length} Entries</Badge>
            )}
          </div>
          <div className="text-xs space-y-1 font-mono bg-surface-container-low dark:bg-surface-container p-2.5 rounded-xl border border-outline-variant/15">
            <div><strong className="text-on-surface">Month Key:</strong> {currentMonthKey}</div>
            <div><strong className="text-on-surface">Active Habit:</strong> {activeHabitId ? activeHabitId.substring(0, 10) + '...' : 'None'}</div>
            <div><strong className="text-on-surface">Last Snapshot:</strong> {entriesUpdated ? entriesUpdated.toLocaleTimeString() : 'None'}</div>
          </div>
        </Card>
      </div>

      {/* Interactive Habit Entries Grid & Optimistic Toggler */}
      <Card variant="elevated" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-outline-variant/15">
          <div>
            <h2 className="font-section-header text-base font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
              Optimistic Entry Toggler (0ms local response + real-time multi-tab sync)
            </h2>
            <p className="font-body-text text-xs text-on-surface-variant">
              Click any date below to toggle completion status. Changes appear instantly in local tab and propagate to all open tabs.
            </p>
          </div>

          {/* Habit Selector Dropdown */}
          {habits.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="habitSelect" className="font-habit-name text-xs text-on-surface font-medium shrink-0">
                Habit:
              </label>
              <select
                id="habitSelect"
                value={activeHabitId}
                onChange={(e) => setSelectedHabitId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-surface-container-low dark:bg-surface-container border border-outline-variant/30 text-on-surface font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {habits.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.frequency})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {toggleStatusMsg && (
          <div className="p-2.5 rounded-xl bg-secondary-fixed/20 border border-secondary/20 text-secondary dark:text-secondary-fixed text-xs font-mono flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-[16px]">sync</span>
            <span>{toggleStatusMsg}</span>
          </div>
        )}

        {/* Date Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {testDates.map((dateKey) => {
            const isDone = isEntryCompleted(dateKey);
            const isToday = dateKey === '2026-08-19';
            const dayNum = dateKey.split('-')[2];

            return (
              <button
                key={dateKey}
                onClick={() => handleToggle(dateKey)}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-between gap-2 transition-all active:scale-95 duration-150 ${
                  isDone
                    ? 'bg-secondary-container/60 dark:bg-on-secondary-container/40 border-secondary shadow-glow-secondary'
                    : 'bg-surface-container-low dark:bg-surface-container-high/30 border-outline-variant/20 hover:border-primary/40'
                } ${isToday ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-surface-container' : ''}`}
              >
                <div className="flex items-center justify-between w-full text-[11px]">
                  <span className="font-stat-label font-bold text-on-surface">Aug {dayNum}</span>
                  {isToday && (
                    <span className="px-1.5 py-0.2 rounded-full bg-primary text-on-primary text-[9px] font-bold">
                      Today
                    </span>
                  )}
                </div>

                {/* Tactile Check Circle */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isDone
                      ? 'bg-secondary text-on-secondary shadow-sm'
                      : 'border-2 border-outline-variant text-transparent'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: isDone ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    check
                  </span>
                </div>

                <span
                  className={`font-stat-label text-[10px] tracking-wider uppercase font-semibold ${
                    isDone ? 'text-secondary dark:text-secondary-fixed' : 'text-outline'
                  }`}
                >
                  {isDone ? 'Done' : 'Pending'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Entries Raw JSON Inspector */}
        <div className="pt-2">
          <span className="font-stat-label text-xs text-on-surface-variant block mb-1">
            Raw Firestore Entries Map for {currentMonthKey}:
          </span>
          <pre className="text-[11px] font-mono p-3 rounded-xl bg-surface-container-low dark:bg-surface-container text-on-surface border border-outline-variant/15 max-h-36 overflow-y-auto">
            {JSON.stringify(entries, null, 2)}
          </pre>
        </div>
      </Card>

      {/* Habit List & Filter Manager */}
      <Card variant="elevated" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-section-header text-base font-semibold text-on-surface">
              Habits Collection (`users/&#123;uid&#125;/habits`)
            </h2>
            <Badge variant="primary" size="sm">{habits.length}</Badge>
          </div>

          {/* Frequency Filter Tabs */}
          <div className="flex items-center gap-1 bg-surface-container-low dark:bg-surface-container p-1 rounded-full border border-outline-variant/15 text-xs font-habit-name">
            {(['all', 'daily', 'weekly', 'monthly'] as const).map((freq) => (
              <button
                key={freq}
                onClick={() => setFreqFilter(freq)}
                className={`px-3 py-1 rounded-full capitalize transition-all ${
                  freqFilter === freq
                    ? 'bg-primary text-on-primary font-semibold shadow-soft'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Add Habit Form */}
        <form onSubmit={handleCreateHabit} className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            placeholder="New habit name (e.g. Read 15 mins)..."
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            className="flex-1 w-full px-4 py-2 text-xs rounded-xl bg-surface-container-low dark:bg-surface-container border border-outline-variant/30 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <select
            value={newHabitFreq}
            onChange={(e) => setNewHabitFreq(e.target.value as HabitFrequency)}
            className="px-3 py-2 text-xs rounded-xl bg-surface-container-low dark:bg-surface-container border border-outline-variant/30 text-on-surface font-semibold focus:outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <Button
            type="submit"
            size="sm"
            disabled={isCreating || !newHabitName.trim()}
            leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}
          >
            {isCreating ? 'Adding...' : 'Add Habit'}
          </Button>
        </form>

        {/* Habit Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {habits.length === 0 ? (
            <div className="col-span-full text-center py-8 text-xs text-on-surface-variant">
              No habits found for filter '{freqFilter}'. Click 'Seed 3 Habits' or add a custom habit above.
            </div>
          ) : (
            habits.map((habit) => (
              <div
                key={habit.id}
                onClick={() => setSelectedHabitId(habit.id)}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  habit.id === activeHabitId
                    ? 'bg-primary-fixed/20 border-primary ring-1 ring-primary'
                    : 'bg-surface-container-low dark:bg-surface-container border-outline-variant/15 hover:border-outline'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: habit.color || '#006398' }}
                  >
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {habit.icon || 'energy_savings_leaf'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-habit-name text-xs font-semibold text-on-surface truncate">
                      {habit.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-stat-label text-[10px] text-primary capitalize">
                        {habit.frequency}
                      </span>
                      <span className="text-[10px] text-outline">• Goal: {habit.goalCount}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHabit(habit.id).catch(console.error);
                  }}
                  title="Delete habit"
                  className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
