import React from 'react';
import { triggerHaptic } from '../../utils/haptics';

export interface SectionTabItem {
  id: string;
  label: string;
  icon: string;
}

interface HabitSectionQuickJumpTabsProps {
  activeSectionId: string;
  sections: SectionTabItem[];
  onSelectSection: (id: string) => void;
}

export const HabitSectionQuickJumpTabs: React.FC<HabitSectionQuickJumpTabsProps> = ({
  activeSectionId,
  sections,
  onSelectSection,
}) => {
  return (
    <nav
      aria-label="Report section jump navigation"
      className="sticky top-2 z-30 py-1 transition-all flex justify-center"
    >
      {/* Symmetrical Segmented Island (Centered on Desktop, Equal-width on Mobile) */}
      <div className="w-full sm:w-fit grid sm:flex grid-cols-3 sm:items-center gap-1.5 p-1.5 rounded-2xl sm:rounded-full bg-surface-container-lowest/95 dark:bg-surface-container/95 backdrop-blur-md border border-outline-variant/25 shadow-soft">
        {sections.map((section) => {
          const isActive = activeSectionId === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onSelectSection(section.id);
              }}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl sm:rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 text-center ${
                isActive
                  ? 'bg-primary text-on-primary shadow-soft font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
              }`}
              aria-current={isActive ? 'true' : undefined}
            >
              <span className="material-symbols-outlined text-[16px]">{section.icon}</span>
              <span className="truncate">{section.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
