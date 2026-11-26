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
      className="sticky top-2 z-30 py-1 transition-all"
    >
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container-lowest/90 dark:bg-surface-container/90 backdrop-blur-md border border-outline-variant/20 shadow-xs overflow-x-auto no-scrollbar max-w-full">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-primary text-on-primary shadow-soft font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
              }`}
              aria-current={isActive ? 'true' : undefined}
            >
              <span className="material-symbols-outlined text-[15px]">{section.icon}</span>
              <span>{section.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
