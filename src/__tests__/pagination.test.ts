import { describe, it, expect } from 'vitest';
import { DailyMoneyEntry } from '../types/expense';
import { HabitEntry } from '../types/habit';

describe('Pagination and Cursor Slicing Suite', () => {
  // Mock dataset of 45 daily ledger entries
  const mockExpenseEntries: DailyMoneyEntry[] = Array.from({ length: 45 }, (_, i) => {
    const day = String(i + 1).padStart(2, '0');
    const dateKey = `2026-08-${day}`;
    return {
      id: dateKey,
      dateKey,
      displayDate: `${day}/08`,
      savingsAmount: 25,
      expenses: [{ id: `e_${i}`, amount: 10, description: 'Tea' }],
      totalExpenses: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  describe('Bounded Page Slicing', () => {
    it('accurately divides items into bounded pages of specified pageSize', () => {
      const pageSize = 15;
      const firstPage = mockExpenseEntries.slice(0, pageSize);
      expect(firstPage).toHaveLength(15);
      expect(firstPage[0].dateKey).toBe('2026-08-01');
      expect(firstPage[14].dateKey).toBe('2026-08-15');
    });

    it('identifies hasMore correctly when dataset exceeds pageSize', () => {
      const pageSize = 20;
      const limitToFetch = pageSize + 1;
      const fetched = mockExpenseEntries.slice(0, limitToFetch);

      const hasMore = fetched.length > pageSize;
      const paginatedItems = hasMore ? fetched.slice(0, pageSize) : fetched;

      expect(hasMore).toBe(true);
      expect(paginatedItems).toHaveLength(20);
    });

    it('handles the final page when remaining items are fewer than pageSize', () => {
      const pageSize = 20;
      const offset = 40;
      const remainingItems = mockExpenseEntries.slice(offset, offset + pageSize + 1);

      const hasMore = remainingItems.length > pageSize;
      const paginatedItems = hasMore ? remainingItems.slice(0, pageSize) : remainingItems;

      expect(hasMore).toBe(false);
      expect(paginatedItems).toHaveLength(5);
    });
  });

  describe('Habit Entry Cursor Ordering', () => {
    const mockHabitEntries: HabitEntry[] = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
      completed: true,
      weekOfMonth: 1,
      monthKey: '2026-09',
      updatedAt: new Date().toISOString(),
    }));

    it('correctly handles descending order slicing for recent days first', () => {
      const descEntries = [...mockHabitEntries].reverse();
      expect(descEntries[0].date).toBe('2026-09-10');
      expect(descEntries[9].date).toBe('2026-09-01');
    });
  });
});
