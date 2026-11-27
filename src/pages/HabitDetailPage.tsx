import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useHabits } from '../hooks/useHabits';
import { useSingleHabitHistory } from '../hooks/useSingleHabitHistory';
import { useDailyHabitsData } from '../hooks/useDailyHabitsData';
import { HabitStatsGrid } from '../components/habit/HabitStatsGrid';
import { HabitWeeklyGraphsView } from '../components/habit/HabitWeeklyGraphsView';
import { HabitCalendarHeatmap } from '../components/habit/HabitCalendarHeatmap';
import { HabitAllTimeAnalyticsCard } from '../components/habit/HabitAllTimeAnalyticsCard';
import { CategoryAggregateGraphsView } from '../components/habit/CategoryAggregateGraphsView';
import { ExecutivePerformancePulse } from '../components/habit/ExecutivePerformancePulse';
import { HabitEmotionalROIMatrix } from '../components/habit/HabitEmotionalROIMatrix';
import { HabitFlowForecastCard } from '../components/habit/HabitFlowForecastCard';
import { HabitSynergyMatrixCard } from '../components/habit/HabitSynergyMatrixCard';
import { ShareableMilestoneModal } from '../components/habit/ShareableMilestoneModal';
import { HabitLaurelCeremonyModal, LaurelHabitData } from '../components/habit/HabitLaurelCeremonyModal';
import { HabitEmotionalAuraCloud } from '../components/habit/HabitEmotionalAuraCloud';
import { HabitUnifiedHeader } from '../components/habit/HabitUnifiedHeader';
import { HabitStickyMiniHud } from '../components/habit/HabitStickyMiniHud';
import { HabitSectionQuickJumpTabs, SectionTabItem } from '../components/habit/HabitSectionQuickJumpTabs';
import { HabitTargetSimulatorCard } from '../components/habit/HabitTargetSimulatorCard';
import { HabitPlainEnglishStoryView } from '../components/habit/HabitPlainEnglishStoryView';
import { generatePlainEnglishStory } from '../utils/plainEnglishStory';
import { HabitAriaLiveNarrative } from '../components/habit/HabitAriaLiveNarrative';
import { HabitShortcutsHelpModal } from '../components/habit/HabitShortcutsHelpModal';
import { useReportShortcutsAndGestures } from '../hooks/useReportShortcutsAndGestures';
import { HabitFormModal } from '../components/dashboard/HabitFormModal';
import { formatMonthYear } from '../components/dashboard/DateNavigator';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { HabitFlowLogo } from '../components/ui/HabitFlowLogo';
import { isHabitActiveInMonth } from '../types';
import { getCategoryIcon } from '../lib/calculations';
import { exportToPDF, exportToExcel, ExportData } from '../utils/exportUtils';
import { calculateFlowForecast } from '../utils/flowForecast';
import { analyzeHabitSynergy } from '../utils/habitSynergy';
import { triggerHaptic } from '../utils/haptics';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const HabitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    habits,
    loading: habitsLoading,
    createHabit,
    removeHabitFromMonth,
    deleteHabit,
  } = useHabits();

  // Selected date defaults to current date / current month on initial entry
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [activeAnalyticsView, setActiveAnalyticsView] = useState<'graphs' | 'calendar' | 'alltime'>('graphs');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isLaurelModalOpen, setIsLaurelModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ isExporting: boolean; percent: number; message: string } | null>(null);
  const [densityMode, setDensityMode] = useState<'spacious' | 'compact'>(() => {
    try {
      return (localStorage.getItem('habitflow_report_density') as 'spacious' | 'compact') || 'spacious';
    } catch {
      return 'spacious';
    }
  });
  const [isMiniHudVisible, setIsMiniHudVisible] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('overview');
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isMonthPickerControlledOpen, setIsMonthPickerControlledOpen] = useState(false);

  // "Plain English Story" Mode (Executive TL;DR) vs Deep Analytics
  const [reportMode, setReportMode] = useState<'analytics' | 'story'>(() => {
    try {
      return (localStorage.getItem('habitflow_report_view_mode') as 'analytics' | 'story') || 'analytics';
    } catch {
      return 'analytics';
    }
  });

  // Colorblind-Safe Palette Mode (Protanopia / Deuteranopia a11y)
  const [isColorblindSafe, setIsColorblindSafe] = useState<boolean>(() => {
    try {
      return localStorage.getItem('habitflow_colorblind_mode') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleReportMode = () => {
    triggerHaptic('selection');
    setReportMode((prev) => {
      const next = prev === 'analytics' ? 'story' : 'analytics';
      try {
        localStorage.setItem('habitflow_report_view_mode', next);
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleToggleColorblindMode = () => {
    triggerHaptic('selection');
    setIsColorblindSafe((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('habitflow_colorblind_mode', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleToggleDensityMode = () => {
    triggerHaptic('selection');
    setDensityMode((prev) => {
      const next = prev === 'spacious' ? 'compact' : 'spacious';
      try {
        localStorage.setItem('habitflow_report_density', next);
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const currentMonthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  const { formattedTitle } = formatMonthYear(selectedDate);

  // Active habits list filtered for the currently selected month
  const activeHabits = useMemo(
    () => habits.filter((h) => isHabitActiveInMonth(h, currentMonthKey)),
    [habits, currentMonthKey]
  );

  // Group habits by category
  const categoryHabitsMap = useMemo(() => {
    const map: Record<string, typeof activeHabits> = {};
    activeHabits.forEach((h) => {
      const cat = h.category?.trim() || 'General';
      if (!map[cat]) {
        map[cat] = [];
      }
      map[cat].push(h);
    });
    return map;
  }, [activeHabits]);

  const categories = useMemo(() => Object.keys(categoryHabitsMap).sort(), [categoryHabitsMap]);

  // Match habit if URL ID passed
  const matchedHabit = id ? activeHabits.find((h) => h.id === id) : undefined;

  // Sync category and habit selection from URL or defaults
  useEffect(() => {
    if (matchedHabit) {
      const habitCat = matchedHabit.category?.trim() || 'General';
      setSelectedCategory(habitCat);
      setSelectedHabitId(matchedHabit.id);
    } else {
      if (categories.length > 0 && !selectedCategory) {
        setSelectedCategory(categories[0]);
      }
      setSelectedHabitId('all');
    }
  }, [id, matchedHabit, categories]);

  const currentCategory = selectedCategory || (categories.length > 0 ? categories[0] : 'General');
  const habitsInCurrentCategory = categoryHabitsMap[currentCategory] || [];

  // Effective habit for single-habit deep dive
  const effectiveHabit =
    selectedHabitId !== 'all'
      ? habitsInCurrentCategory.find((h) => h.id === selectedHabitId) || habitsInCurrentCategory[0]
      : habitsInCurrentCategory[0];

  // Data for single habit
  const {
    habit,
    metrics: singleMetrics,
    isCompleted: isSingleCompleted,
    toggleEntry: toggleSingleEntry,
    updateHabit,
    archiveHabit,
  } = useSingleHabitHistory(effectiveHabit?.id, selectedDate);

  // Data for aggregate category (all habits under current tracker board)
  const {
    daysInMonth,
    habitMetricsMap: aggregateMetricsMap,
    entriesByHabit,
    isCompleted: isAggregateCompleted,
    toggleHabitEntry: toggleAggregateEntry,
  } = useDailyHabitsData(selectedDate, currentCategory);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedHabitId('all');
    navigate('/habit');
  };

  const handleSelectHabit = (habitId: string) => {
    setSelectedHabitId(habitId);
    if (habitId !== 'all') {
      navigate(`/habit/${habitId}`);
    } else {
      navigate('/habit');
    }
  };

  const categoryHabitIds = useMemo(() => {
    return ['all', ...habitsInCurrentCategory.map((h) => h.id)];
  }, [habitsInCurrentCategory]);

  const handleNextHabit = () => {
    if (categoryHabitIds.length <= 1) return;
    const currentIndex = categoryHabitIds.indexOf(selectedHabitId);
    const nextIndex = (currentIndex + 1) % categoryHabitIds.length;
    handleSelectHabit(categoryHabitIds[nextIndex]);
  };

  const handlePrevHabit = () => {
    if (categoryHabitIds.length <= 1) return;
    const currentIndex = categoryHabitIds.indexOf(selectedHabitId);
    const prevIndex = (currentIndex - 1 + categoryHabitIds.length) % categoryHabitIds.length;
    handleSelectHabit(categoryHabitIds[prevIndex]);
  };

  const handleMonthChange = (offset: number) => {
    setSelectedDate((prev) => {
      return new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
    });
  };

  const handleSelectMonthIndex = (monthIdx: number) => {
    setSelectedDate((prev) => {
      return new Date(prev.getFullYear(), monthIdx, 1);
    });
  };

  const handleSelectYear = (offset: number) => {
    setSelectedDate((prev) => {
      return new Date(prev.getFullYear() + offset, prev.getMonth(), 1);
    });
  };

  // Sections list for Tab Navigation
  const aggregateSections: SectionTabItem[] = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: 'bar_chart' },
      { id: 'insights', label: 'Insights & Synergy', icon: 'insights' },
      { id: 'simulator', label: 'What-If Simulator', icon: 'tune' },
    ],
    []
  );

  const singleHabitSections: SectionTabItem[] = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: 'bar_chart' },
      { id: 'simulator', label: 'What-If Simulator', icon: 'tune' },
      { id: 'alltime', label: 'All-Time', icon: 'all_inclusive' },
    ],
    []
  );

  const currentSections = selectedHabitId === 'all' ? aggregateSections : singleHabitSections;

  const handleSelectSection = (sectionId: string) => {
    triggerHaptic('selection');
    setActiveSectionId(sectionId);
  };

  // Scroll listener for sticky mini-HUD visibility
  useEffect(() => {
    const handleScroll = () => {
      setIsMiniHudVisible(window.scrollY > 220);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hook for desktop hotkeys ([, ], M, P, ?) and mobile touch swipe between months
  useReportShortcutsAndGestures({
    onNextHabit: handleNextHabit,
    onPrevHabit: handlePrevHabit,
    onOpenMonthPicker: () => setIsMonthPickerControlledOpen((prev) => !prev),
    onExportPDF: () => handleExportReport('pdf'),
    onToggleShortcutsModal: () => setIsShortcutsModalOpen((prev) => !prev),
    onSwipeLeft: () => handleMonthChange(1),
    onSwipeRight: () => handleMonthChange(-1),
    enabled: true,
  });

  const handleExportReport = async (format: 'pdf' | 'csv') => {
    triggerHaptic('selection');
    const exportData: ExportData = {
      profile: user,
      habits: activeHabits,
      habitMetricsMap: aggregateMetricsMap,
    };
    try {
      if (format === 'pdf') {
        setExportProgress({ isExporting: true, percent: 10, message: 'Initiating report engine...' });
        await exportToPDF(exportData, (percent, message) => {
          setExportProgress({ isExporting: true, percent, message });
        });
        setTimeout(() => setExportProgress(null), 2500);
      } else {
        exportToExcel(exportData);
      }
    } catch (err) {
      console.error('Failed to export report:', err);
      setExportProgress(null);
    }
  };

  const handleDelete = async () => {
    if (!habit) return;
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${habit.name}" across ALL months?\n\nThis will remove the habit and its logs permanently.\n\nTip: To remove it from ${formattedTitle} only, use the Edit button.`
      )
    ) {
      try {
        await deleteHabit(habit.id);
        setSelectedHabitId('all');
        navigate('/habit');
      } catch (err) {
        console.error('Failed to delete habit:', err);
      }
    }
  };

  const handleRemoveFromMonth = async (habitId: string, monthKey: string) => {
    try {
      await removeHabitFromMonth(habitId, monthKey);
      setSelectedHabitId('all');
      navigate('/habit');
    } catch (err) {
      console.error('Failed to remove habit from month:', err);
    }
  };

  const handleArchive = async () => {
    if (!habit) return;
    if (window.confirm(`Archive "${habit.name}"? Historical logs will be preserved.`)) {
      try {
        await archiveHabit(true);
        setSelectedHabitId('all');
        navigate('/habit');
      } catch (err) {
        console.error('Failed to archive habit:', err);
      }
    }
  };

  const handleSaveEdit = async (data: {
    name: string;
    category?: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    goalCount: number;
    color?: string;
    icon?: string;
    startMonth?: string;
    endMonth?: string;
  }) => {
    await updateHabit(data);
  };

  const handleCreateHabit = async (data: {
    name: string;
    category?: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    goalCount: number;
    color?: string;
    icon?: string;
    startMonth?: string;
    endMonth?: string;
  }) => {
    const newHabit = await createHabit(data);
    setIsCreateModalOpen(false);
    navigate(`/habit/${newHabit.id}`);
  };

  const selectedMonthIdx = selectedDate.getMonth();

  const milestoneStats = useMemo(() => {
    const isSingle = selectedHabitId !== 'all' && habit != null;
    if (isSingle && singleMetrics) {
      const peakDay = singleMetrics.peakDayOfWeek?.day || 'Wednesday';
      return {
        completionRate: Math.round(singleMetrics.monthCompletionPercent || 0),
        longestStreak: singleMetrics.longestStreak || singleMetrics.currentStreak || 0,
        totalChecks: singleMetrics.monthCompletedDays || 0,
        totalHabits: 1,
        peakDayName: peakDay,
      };
    }

    const habitKeys = Object.keys(aggregateMetricsMap);
    if (habitKeys.length === 0) {
      return {
        completionRate: 0,
        longestStreak: 0,
        totalChecks: 0,
        totalHabits: habitsInCurrentCategory.length,
        peakDayName: 'Wednesday',
      };
    }

    const totalRate = habitKeys.reduce((acc, hid) => acc + (aggregateMetricsMap[hid]?.monthProgressPercent || 0), 0);
    const avgRate = Math.round(totalRate / habitKeys.length);
    const maxStreak = Math.max(0, ...habitKeys.map((hid) => aggregateMetricsMap[hid]?.streakCount || 0));
    const sumChecks = habitKeys.reduce((acc, hid) => acc + (aggregateMetricsMap[hid]?.completedCount || 0), 0);

    const daySums: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    daysInMonth.forEach((d) => {
      const dObj = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d.dayNum);
      const dName = days[dObj.getDay()];
      let dayCompleted = 0;
      habitsInCurrentCategory.forEach((h) => {
        if (entriesByHabit[h.id]?.[d.dateKey]?.completed) {
          dayCompleted += 1;
        }
      });
      daySums[dName] = (daySums[dName] || 0) + dayCompleted;
    });

    const sortedDays = Object.entries(daySums).sort((a, b) => b[1] - a[1]);
    const peakDay = sortedDays.length > 0 && sortedDays[0][1] > 0 ? sortedDays[0][0] : 'Wednesday';

    return {
      completionRate: avgRate,
      longestStreak: maxStreak,
      totalChecks: sumChecks,
      totalHabits: habitsInCurrentCategory.length,
      peakDayName: peakDay,
    };
  }, [
    selectedHabitId,
    habit,
    singleMetrics,
    aggregateMetricsMap,
    habitsInCurrentCategory,
    daysInMonth,
    selectedDate,
    entriesByHabit,
  ]);

  const flowForecast = useMemo(() => {
    return calculateFlowForecast(
      habitsInCurrentCategory,
      entriesByHabit,
      daysInMonth,
      selectedDate
    );
  }, [habitsInCurrentCategory, entriesByHabit, daysInMonth, selectedDate]);

  const habitSynergy = useMemo(() => {
    return analyzeHabitSynergy(habitsInCurrentCategory, entriesByHabit, daysInMonth);
  }, [habitsInCurrentCategory, entriesByHabit, daysInMonth]);

  // Laurel Habit of the Month (most resilient habit in category)
  const laurelHabit = useMemo<LaurelHabitData | null>(() => {
    if (habitsInCurrentCategory.length === 0) return null;
    let bestHabit = habitsInCurrentCategory[0];
    let bestChecks = -1;
    let bestStreak = -1;
    let bestRate = 0;

    habitsInCurrentCategory.forEach((h) => {
      const m = aggregateMetricsMap[h.id];
      const checks = m?.completedCount || 0;
      const streak = m?.streakCount || 0;
      const rate = Math.round(m?.monthProgressPercent || 0);

      if (checks > bestChecks || (checks === bestChecks && streak > bestStreak)) {
        bestHabit = h;
        bestChecks = checks;
        bestStreak = streak;
        bestRate = rate;
      }
    });

    return {
      id: bestHabit.id,
      name: bestHabit.name,
      icon: bestHabit.icon,
      color: bestHabit.color,
      completedChecks: Math.max(0, bestChecks),
      streakCount: Math.max(0, bestStreak),
      completionRate: bestRate,
    };
  }, [habitsInCurrentCategory, aggregateMetricsMap]);

  // Check if viewing the final days of the month or a past completed month to auto-trigger Laurel Ceremony once
  useEffect(() => {
    if (!laurelHabit || laurelHabit.completedChecks === 0) return;

    const today = new Date();
    const isViewingCurrentMonth =
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth();

    const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    const isFinalDays = isViewingCurrentMonth && today.getDate() >= lastDayOfMonth - 1;
    const isPastCompletedMonth =
      selectedDate.getFullYear() < today.getFullYear() ||
      (selectedDate.getFullYear() === today.getFullYear() && selectedDate.getMonth() < today.getMonth());

    if (isFinalDays || isPastCompletedMonth) {
      const laurelStorageKey = `habitflow_laurel_seen_${currentMonthKey}`;
      try {
        const hasSeen = localStorage.getItem(laurelStorageKey);
        if (!hasSeen) {
          setIsLaurelModalOpen(true);
          localStorage.setItem(laurelStorageKey, 'true');
        }
      } catch {
        // Ignore
      }
    }
  }, [currentMonthKey, selectedDate, laurelHabit]);

  // Plain English Story Narrative for Cognitive Simplicity
  const plainEnglishStory = useMemo(() => {
    return generatePlainEnglishStory(
      habitsInCurrentCategory,
      aggregateMetricsMap,
      entriesByHabit,
      daysInMonth,
      selectedDate,
      currentCategory
    );
  }, [
    habitsInCurrentCategory,
    aggregateMetricsMap,
    entriesByHabit,
    daysInMonth,
    selectedDate,
    currentCategory,
  ]);

  if (habitsLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="font-body-text text-sm text-on-surface-variant">
          Loading habit analytics and performance graphs...
        </p>
      </div>
    );
  }

  // 0 Habits empty state
  if (activeHabits.length === 0) {
    return (
      <Card variant="elevated" className="max-w-md mx-auto my-12 p-8 text-center space-y-5">
        <div className="flex justify-center">
          <HabitFlowLogo size={52} />
        </div>
        <div className="space-y-1">
          <h2 className="font-section-header text-xl font-bold text-on-surface">
            No Active Habits Yet
          </h2>
          <p className="font-body-text text-xs text-on-surface-variant max-w-xs mx-auto">
            Create your first habit to start tracking daily, weekly, and monthly performance graphs.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <span className="material-symbols-outlined text-[18px] mr-1.5">add</span>
            Create First Habit
          </Button>
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Go to Dashboard
            </Button>
          </Link>
        </div>

        <HabitFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateHabit}
        />
      </Card>
    );
  }

  return (
    <div
      className={`max-w-5xl mx-auto px-3 sm:px-6 ${
        densityMode === 'compact' ? 'space-y-4 pb-8' : 'space-y-6 pb-12'
      } ${isColorblindSafe ? 'colorblind-safe' : ''} animate-fadeIn`}
    >
      {/* Screen Reader (ARIA Live) Graph Narrative */}
      <HabitAriaLiveNarrative
        monthTitle={formattedTitle}
        categoryName={currentCategory}
        completionRate={milestoneStats.completionRate}
        totalChecks={milestoneStats.totalChecks}
        longestStreak={milestoneStats.longestStreak}
        peakDayName={milestoneStats.peakDayName}
        isSingleHabit={selectedHabitId !== 'all'}
        habitName={habit?.name}
      />

      {/* 0. Floating Sticky Mini-HUD (Collapses into slim pill on scroll) */}
      <HabitStickyMiniHud
        isVisible={isMiniHudVisible}
        boardName={currentCategory}
        boardIcon={getCategoryIcon(currentCategory)}
        selectedMonthTitle={formattedTitle}
        completionRate={milestoneStats.completionRate}
        isSingleHabit={selectedHabitId !== 'all'}
        habitName={habit?.name}
        onExportPDF={() => handleExportReport('pdf')}
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onToggleShortcutsModal={() => setIsShortcutsModalOpen(true)}
      />

      {/* 1. Streamlined Unified Header & Navigation Bar */}
      <HabitUnifiedHeader
        categories={categories}
        currentCategory={currentCategory}
        categoryHabitsMap={categoryHabitsMap}
        selectedHabitId={selectedHabitId}
        habitsInCurrentCategory={habitsInCurrentCategory}
        selectedDate={selectedDate}
        formattedMonthTitle={formattedTitle}
        getCategoryIcon={getCategoryIcon}
        onSelectCategory={handleSelectCategory}
        onSelectHabit={handleSelectHabit}
        onMonthChange={handleMonthChange}
        onSelectMonthIndex={handleSelectMonthIndex}
        onSelectYear={handleSelectYear}
        onResetToCurrentMonth={() => setSelectedDate(new Date())}
        onOpenCreateHabitModal={() => setIsCreateModalOpen(true)}
        onExportReport={handleExportReport}
        densityMode={densityMode}
        onToggleDensityMode={handleToggleDensityMode}
        isMonthPickerOpen={isMonthPickerControlledOpen}
        onToggleMonthPicker={(open) => setIsMonthPickerControlledOpen(open ?? !isMonthPickerControlledOpen)}
        storyMode={reportMode === 'story'}
        onToggleStoryMode={handleToggleReportMode}
        isColorblindSafe={isColorblindSafe}
        onToggleColorblindMode={handleToggleColorblindMode}
      />

      {/* 2. Inspo Hero Bento Ribbon: Executive Performance Pulse */}
      <div id="overview" className="scroll-mt-20">
        <ExecutivePerformancePulse
          selectedHabitId={selectedHabitId}
          categoryName={currentCategory}
          selectedDate={selectedDate}
          formattedMonthTitle={formattedTitle}
          habits={habitsInCurrentCategory}
          habitMetricsMap={aggregateMetricsMap}
          singleHabit={habit}
          singleMetrics={singleMetrics}
          onOpenMilestoneCard={() => setIsMilestoneModalOpen(true)}
          onOpenLaurelCeremony={() => setIsLaurelModalOpen(true)}
        />
      </div>

      {/* Mode Switch: "Plain English Story" View vs "Tabbed Analytics" Views */}
      {reportMode === 'story' ? (
        <HabitPlainEnglishStoryView
          story={plainEnglishStory}
          onSwitchToAnalytics={() => setReportMode('analytics')}
          onOpenMilestoneCard={() => setIsMilestoneModalOpen(true)}
        />
      ) : (
        <>
          {/* Clean Segment Navigation Tabs */}
          <HabitSectionQuickJumpTabs
            activeSectionId={currentSections.some((s) => s.id === activeSectionId) ? activeSectionId : 'overview'}
            sections={currentSections}
            onSelectSection={handleSelectSection}
          />

          {/* Aggregate All Habits View */}
          {selectedHabitId === 'all' ? (
            <div className="space-y-6">
              {/* Tab 1: Overview & Momentum Graphs */}
              {activeSectionId === 'overview' && (
                <div id="overview" className="animate-fadeIn">
                  <CategoryAggregateGraphsView
                    categoryName={currentCategory}
                    habits={habitsInCurrentCategory}
                    daysInMonth={daysInMonth}
                    habitMetricsMap={aggregateMetricsMap}
                    isCompleted={isAggregateCompleted}
                    onToggleEntry={toggleAggregateEntry}
                    selectedMonthTitle={formattedTitle}
                    onCreateHabit={() => setIsCreateModalOpen(true)}
                  />
                </div>
              )}

              {/* Tab 2: Insights, Synergy & Mood */}
              {activeSectionId === 'insights' && (
                <div id="insights" className="space-y-6 animate-fadeIn">
                  <HabitFlowForecastCard forecast={flowForecast} />
                  <HabitSynergyMatrixCard synergyReport={habitSynergy} />
                  <HabitEmotionalROIMatrix
                    habits={habitsInCurrentCategory}
                    entriesByHabit={entriesByHabit}
                    habitMetricsMap={aggregateMetricsMap}
                  />
                  <HabitEmotionalAuraCloud
                    entriesByHabit={entriesByHabit}
                    selectedMonthTitle={formattedTitle}
                  />
                </div>
              )}

              {/* Tab 3: Interactive Target Simulator */}
              {activeSectionId === 'simulator' && (
                <div id="simulator" className="animate-fadeIn">
                  <HabitTargetSimulatorCard
                    totalDays={daysInMonth.length}
                    daysElapsed={
                      selectedDate.getFullYear() === new Date().getFullYear() &&
                      selectedDate.getMonth() === new Date().getMonth()
                        ? new Date().getDate()
                        : selectedDate < new Date()
                        ? daysInMonth.length
                        : 0
                    }
                    completedChecks={milestoneStats.totalChecks}
                    totalHabitCount={habitsInCurrentCategory.length}
                    currentStreak={milestoneStats.longestStreak}
                    selectedMonthTitle={formattedTitle}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Single Habit View */
            habit && (
              <div className="space-y-6">
                {/* Tab 3: Simulator for Single Habit */}
                {activeSectionId === 'simulator' ? (
                  <div id="simulator" className="animate-fadeIn">
                    <HabitTargetSimulatorCard
                      totalDays={daysInMonth.length}
                      daysElapsed={
                        selectedDate.getFullYear() === new Date().getFullYear() &&
                        selectedDate.getMonth() === new Date().getMonth()
                          ? new Date().getDate()
                          : selectedDate < new Date()
                          ? daysInMonth.length
                          : 0
                      }
                      completedChecks={milestoneStats.totalChecks}
                      totalHabitCount={1}
                      currentStreak={milestoneStats.longestStreak}
                      selectedMonthTitle={formattedTitle}
                    />
                  </div>
                ) : activeSectionId === 'alltime' ? (
                  /* Tab: All-Time */
                  <div id="alltime" className="animate-fadeIn">
                    <HabitAllTimeAnalyticsCard
                      habitName={habit.name}
                      habitColor={habit.color}
                      metrics={singleMetrics}
                    />
                  </div>
                ) : (
                  /* Tab 1: Overview (Default) */
                  <div className="space-y-6 animate-fadeIn">
                    {/* Habit Header Banner */}
                    <div className="bg-surface-container-lowest dark:bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant/30 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="font-app-title text-xl sm:text-2xl font-bold text-on-surface">
                            {habit.name}
                          </h1>
                          {habit.category && (
                            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-stat-label">
                              {habit.category}
                            </span>
                          )}
                          <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-stat-label">
                            {habit.frequency || 'daily'}
                          </span>
                        </div>
                        <p className="font-body-text text-xs sm:text-sm text-on-surface-variant mt-0.5">
                          Goal: {habit.goalCount || 1} time{(habit.goalCount || 1) > 1 ? 's' : ''} per {habit.frequency === 'weekly' ? 'week' : habit.frequency === 'monthly' ? 'month' : 'day'}
                        </p>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditModalOpen(true)}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-full"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDelete}
                          className="text-error hover:bg-error-container/20 px-3 rounded-full"
                          title="Delete Habit Permanently"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleArchive}
                          className="text-on-surface-variant hover:bg-surface-container-high px-2.5 rounded-full"
                          title="Archive Habit"
                        >
                          <span className="material-symbols-outlined text-[18px]">archive</span>
                        </Button>
                      </div>
                    </div>

                    {/* Metrics Summary Grid for the selected habit with 30-Day Momentum Sparkline */}
                    <div id="stats">
                      <HabitStatsGrid
                        metrics={singleMetrics}
                        selectedMonthTitle={MONTH_NAMES[selectedMonthIdx]}
                        habitColor={habit.color || '#2D5A34'}
                        isCompleted={isSingleCompleted}
                        selectedDate={selectedDate}
                      />
                    </div>

                    {/* Graph / Calendar View Switcher Tabs */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex flex-wrap items-center gap-1.5 bg-surface-container-low dark:bg-surface-container-low p-1 rounded-full border border-outline-variant/30 shadow-sm">
                        <button
                          onClick={() => setActiveAnalyticsView('graphs')}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            activeAnalyticsView === 'graphs'
                              ? 'bg-primary text-on-primary shadow-soft'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                          <span>Weekly Graphs</span>
                        </button>

                        <button
                          onClick={() => setActiveAnalyticsView('calendar')}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            activeAnalyticsView === 'calendar'
                              ? 'bg-primary text-on-primary shadow-soft'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">grain</span>
                          <span>Year-in-Pixels Heatmap</span>
                        </button>
                      </div>
                    </div>

                    {/* Individual Habit Visualization based on selected view */}
                    {activeAnalyticsView === 'graphs' ? (
                      <HabitWeeklyGraphsView
                        currentDate={selectedDate}
                        onChangeMonth={handleMonthChange}
                        isCompleted={isSingleCompleted}
                        onToggleDate={toggleSingleEntry}
                        habitName={habit.name}
                        habitFrequency={habit.frequency}
                        goalCount={habit.goalCount}
                      />
                    ) : (
                      <HabitCalendarHeatmap
                        currentDate={selectedDate}
                        onChangeMonth={handleMonthChange}
                        isCompleted={isSingleCompleted}
                        onToggleDate={toggleSingleEntry}
                        habitColor={habit.color || '#2D5A34'}
                        habitName={habit.name}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </>
      )}

      {/* Edit Habit Modal */}
      <HabitFormModal
        isOpen={isEditModalOpen}
        habitToEdit={habit}
        currentMonthKey={currentMonthKey}
        formattedMonthTitle={formattedTitle}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        onRemoveFromMonth={handleRemoveFromMonth}
        onDelete={handleDelete}
        onArchive={handleArchive}
      />

      {/* Create Habit Modal */}
      <HabitFormModal
        isOpen={isCreateModalOpen}
        defaultCategory={currentCategory}
        currentMonthKey={currentMonthKey}
        formattedMonthTitle={formattedTitle}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateHabit}
      />

      {/* Shareable Milestone Card Modal */}
      <ShareableMilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        userName={user?.name || user?.email?.split('@')[0] || 'Mindful Builder'}
        monthTitle={formattedTitle}
        boardName={currentCategory}
        completionRate={milestoneStats.completionRate}
        longestStreak={milestoneStats.longestStreak}
        totalChecks={milestoneStats.totalChecks}
        totalHabits={milestoneStats.totalHabits}
        peakDayName={milestoneStats.peakDayName}
        onDownloadPDF={() => handleExportReport('pdf')}
      />

      {/* End-of-Month Habit Laurel Ceremony Modal */}
      <HabitLaurelCeremonyModal
        isOpen={isLaurelModalOpen}
        onClose={() => setIsLaurelModalOpen(false)}
        monthTitle={formattedTitle}
        boardName={currentCategory}
        laurelHabit={laurelHabit}
        onOpenShareModal={() => setIsMilestoneModalOpen(true)}
      />

      {/* Keyboard Shortcuts Cheat-Sheet Modal */}
      <HabitShortcutsHelpModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Floating Botanical PDF Export Progress Toast */}
      {exportProgress && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
          <div className="bg-surface-container-highest/95 dark:bg-surface-container/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-outline-variant/30 shadow-elevation-3 flex items-center gap-3.5 max-w-sm">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {exportProgress.percent === 100 ? (
                <span className="material-symbols-outlined text-[18px]">check</span>
              ) : (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <div className="space-y-1 min-w-[170px]">
              <div className="flex items-center justify-between text-xs font-bold text-on-surface">
                <span>Executive PDF</span>
                <span className="font-mono text-primary">{exportProgress.percent}%</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress.percent}%` }}
                />
              </div>
              <p className="text-[10px] text-on-surface-variant truncate">
                {exportProgress.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
