import React, { useState, useMemo } from 'react';
import { HabitEntry } from '../../types';
import { extractReflectionAura, AuraWord } from '../../utils/reflectionAura';
import { triggerHaptic } from '../../utils/haptics';

interface HabitEmotionalAuraCloudProps {
  entriesByHabit: Record<string, Record<string, HabitEntry>>;
  selectedMonthTitle: string;
}

export const HabitEmotionalAuraCloud: React.FC<HabitEmotionalAuraCloudProps> = ({
  entriesByHabit,
  selectedMonthTitle,
}) => {
  const [selectedWord, setSelectedWord] = useState<AuraWord | null>(null);

  const aura = useMemo(() => {
    return extractReflectionAura(entriesByHabit);
  }, [entriesByHabit]);

  const categoryStyles = {
    calm: {
      pill: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25',
      glow: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      dot: 'bg-emerald-500',
    },
    energized: {
      pill: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25',
      glow: 'from-amber-500/20 via-orange-500/10 to-transparent',
      dot: 'bg-amber-500',
    },
    focused: {
      pill: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 hover:bg-sky-500/25',
      glow: 'from-sky-500/20 via-indigo-500/10 to-transparent',
      dot: 'bg-sky-500',
    },
    proud: {
      pill: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/25',
      glow: 'from-purple-500/20 via-pink-500/10 to-transparent',
      dot: 'bg-purple-500',
    },
    steady: {
      pill: 'bg-stone-500/15 text-stone-700 dark:text-stone-300 border-stone-500/30 hover:bg-stone-500/25',
      glow: 'from-stone-500/20 via-slate-500/10 to-transparent',
      dot: 'bg-stone-500',
    },
  };

  const dominantStyle = categoryStyles[aura.dominantCategory] || categoryStyles.steady;

  return (
    <div className="japandi-card bg-surface-container-lowest dark:bg-surface-container rounded-3xl p-5 sm:p-6 border border-outline-variant/20 shadow-soft relative overflow-hidden transition-all">
      {/* Dynamic Ambient Botanical Aura Glow */}
      <div
        className={`absolute -top-16 -right-16 w-60 h-60 rounded-full bg-gradient-to-br ${dominantStyle.glow} blur-3xl pointer-events-none transition-all duration-700`}
      />
      <div
        className={`absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-gradient-to-tr ${dominantStyle.glow} blur-3xl pointer-events-none transition-all duration-700`}
      />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[19px]">psychology_alt</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-section-header font-bold text-sm sm:text-base text-on-surface">
                Reflection Word Cloud & Emotional Aura
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono hidden xs:inline">
                Aura Lens
              </span>
            </div>
            <p className="font-body-text text-xs text-on-surface-variant">
              Synthesizing daily notes and feeling tags in {selectedMonthTitle}
            </p>
          </div>
        </div>

        {/* Positive Emotional Resonance Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/60 border border-outline-variant/20 shrink-0 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-stat-label text-xs font-bold text-on-surface">
            {aura.positiveResonanceRate}% Positive Resonance
          </span>
        </div>
      </div>

      {/* Word Cloud Surface */}
      <div className="p-4 sm:p-6 rounded-2xl bg-surface-container-low/50 dark:bg-surface-container-high/20 border border-outline-variant/15 relative z-10 min-h-[140px] flex flex-wrap items-center justify-center gap-2 sm:gap-3 select-none">
        {aura.words.map((item) => {
          const style = categoryStyles[item.category] || categoryStyles.steady;
          const isSelected = selectedWord?.word === item.word;

          let sizeClass = 'text-xs px-2.5 py-1 font-medium';
          if (item.weight === 5) {
            sizeClass = 'text-sm sm:text-base px-4 py-2 font-black shadow-xs tracking-tight';
          } else if (item.weight === 4) {
            sizeClass = 'text-xs sm:text-sm px-3.5 py-1.5 font-bold';
          } else if (item.weight === 3) {
            sizeClass = 'text-xs px-3 py-1 font-semibold';
          }

          return (
            <button
              key={item.word}
              type="button"
              onClick={() => {
                triggerHaptic('tick');
                setSelectedWord(isSelected ? null : item);
              }}
              className={`rounded-2xl border transition-all duration-200 cursor-pointer capitalize flex items-center gap-1.5 ${
                style.pill
              } ${sizeClass} ${
                isSelected
                  ? 'ring-2 ring-primary scale-105 shadow-md font-extrabold'
                  : 'hover:scale-[1.03]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              <span>{item.word}</span>
              <span className="text-[10px] opacity-75 font-mono font-tnum">
                ({item.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail Inspector Footer */}
      <div className="mt-4 pt-3 border-t border-outline-variant/15 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-on-surface-variant gap-2 relative z-10">
        <div>
          {selectedWord ? (
            <p className="font-medium text-on-surface">
              Feeling <strong className="capitalize text-primary font-bold">"{selectedWord.word}"</strong> logged in{' '}
              <strong className="font-mono font-bold font-tnum text-on-surface">{selectedWord.count}</strong> reflection entries.
            </p>
          ) : (
            <p>
              Dominant emotional anchor:{' '}
              <strong className="capitalize text-primary font-bold">{aura.dominantFeeling}</strong> •{' '}
              <span className="font-mono font-tnum">{aura.totalReflectionsLogged}</span> feelings & note reflections analyzed.
            </p>
          )}
        </div>

        <span className="text-[10px] font-mono text-on-surface-variant/80 shrink-0">
          Mindful Neuro-Tagging
        </span>
      </div>
    </div>
  );
};
