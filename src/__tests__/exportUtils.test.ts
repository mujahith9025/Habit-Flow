import { describe, it, expect, vi, beforeAll } from 'vitest';
import { exportToExcel, exportToJSON } from '../utils/exportUtils';
import { Habit } from '../types/habit';
import { UserProfile } from '../types/auth';

beforeAll(() => {
  // @ts-ignore
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  // @ts-ignore
  globalThis.URL.revokeObjectURL = vi.fn();
});

describe('Export Utils', () => {
  const mockProfile: UserProfile = {
    uid: 'u1',
    name: 'Test User',
    email: 'test@example.com',
    photoURL: '',
    createdAt: '2026-08-01T00:00:00.000Z',
    lastLoginAt: '2026-08-29T00:00:00.000Z',
    authProvider: 'google',
  };

  const mockHabits: Habit[] = [
    {
      id: 'h1',
      name: 'Drink 3L Water',
      category: 'Diet & Nutrition',
      frequency: 'daily',
      goalCount: 3,
      color: '#006398',
      icon: 'water_drop',
      archived: false,
      sortOrder: 0,
      createdAt: '2026-08-01T00:00:00.000Z',
    },
  ];

  it('runs exportToExcel without crashing', () => {
    expect(() => {
      exportToExcel({
        profile: mockProfile,
        habits: mockHabits,
      });
    }).not.toThrow();
  });

  it('runs exportToJSON without crashing', () => {
    expect(() => {
      exportToJSON({
        profile: mockProfile,
        habits: mockHabits,
      });
    }).not.toThrow();
  });
});
