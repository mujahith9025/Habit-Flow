import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  isTimeToTrigger,
  getNotificationSettings,
  saveNotificationSettings,
  checkAndTriggerScheduledReminders,
} from '../lib/notificationService';
import { Habit } from '../types/habit';

// Mock localStorage for Node test environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value.toString();
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
  key: () => null,
  length: 0,
};

beforeAll(() => {
  // @ts-ignore
  globalThis.localStorage = localStorageMock;
  // @ts-ignore
  globalThis.window = {
    localStorage: localStorageMock,
    // @ts-ignore
    Notification: { permission: 'default' },
  };
});

describe('Notification Service Engine', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('correctly calculates isTimeToTrigger within target time window', () => {
    const testDateAt8AM = new Date('2026-08-29T08:00:00');
    expect(isTimeToTrigger('08:00', testDateAt8AM)).toBe(true);

    const testDateAt802AM = new Date('2026-08-29T08:02:00');
    expect(isTimeToTrigger('08:00', testDateAt802AM)).toBe(true);

    const testDateAt810AM = new Date('2026-08-29T08:10:00');
    expect(isTimeToTrigger('08:00', testDateAt810AM)).toBe(false);

    const testDateAt759AM = new Date('2026-08-29T07:59:00');
    expect(isTimeToTrigger('08:00', testDateAt759AM)).toBe(false);
  });

  it('persists and retrieves notification settings with default values', () => {
    const initial = getNotificationSettings();
    expect(initial.morningTime).toBe('08:00');
    expect(initial.eveningTime).toBe('20:00');

    saveNotificationSettings({
      morningTime: '07:30',
      eveningTime: '21:00',
      morningReminderEnabled: true,
      eveningReminderEnabled: true,
    });

    const updated = getNotificationSettings();
    expect(updated.morningTime).toBe('07:30');
    expect(updated.eveningTime).toBe('21:00');
  });

  it('does not send reminders if notifications are disabled or not granted', async () => {
    saveNotificationSettings({
      enabled: false,
      morningReminderEnabled: true,
    });

    const mockHabits: Habit[] = [
      {
        id: 'h1',
        name: 'Morning Routine',
        frequency: 'daily',
        goalCount: 1,
        color: '#006398',
        icon: 'star',
        archived: false,
        sortOrder: 0,
        createdAt: '',
      },
    ];

    const result = await checkAndTriggerScheduledReminders({
      dailyHabits: mockHabits,
      isCompleted: () => false,
      now: new Date('2026-08-29T08:00:00'),
    });

    expect(result.morningSent).toBe(false);
    expect(result.eveningSent).toBe(false);
  });
});
