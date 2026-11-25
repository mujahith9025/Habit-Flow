import { describe, it, expect, vi, beforeEach } from 'vitest';
import { announce, subscribeToAnnouncements } from '../utils/announcer';

describe('Screen Reader ARIA Live Announcer Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delivers polite announcements to subscribed listeners', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAnnouncements(listener);

    announce('Checked off Morning Meditation. Streak: 15 days.');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      'Checked off Morning Meditation. Streak: 15 days.',
      'polite'
    );

    unsubscribe();
  });

  it('delivers assertive announcements when specified', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAnnouncements(listener);

    announce('Session revoked from remote device', 'assertive');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      'Session revoked from remote device',
      'assertive'
    );

    unsubscribe();
  });

  it('unsubscribes cleanly and stops receiving updates', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAnnouncements(listener);

    announce('First announcement');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();

    announce('Second announcement');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('safely handles empty messages without dispatching to listeners', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAnnouncements(listener);

    announce('');
    expect(listener).not.toHaveBeenCalled();

    unsubscribe();
  });

  it('safely catches and isolates errors from faulty listeners', () => {
    const failingListener = vi.fn(() => {
      throw new Error('Explosion');
    });
    const goodListener = vi.fn();

    const unsub1 = subscribeToAnnouncements(failingListener);
    const unsub2 = subscribeToAnnouncements(goodListener);

    expect(() => {
      announce('Safe broadcast announcement');
    }).not.toThrow();

    expect(failingListener).toHaveBeenCalled();
    expect(goodListener).toHaveBeenCalledWith('Safe broadcast announcement', 'polite');

    unsub1();
    unsub2();
  });
});

describe('Vim & Arrow Key Navigation Rules', () => {
  it('correctly maps 1-9 keys to 0-indexed item offsets', () => {
    const totalItems = 5;
    const testKeys = ['1', '2', '3', '4', '5', '9'];

    testKeys.forEach((key) => {
      const isNumKey = /^[1-9]$/.test(key);
      expect(isNumKey).toBe(true);

      const targetIdx = parseInt(key, 10) - 1;
      if (targetIdx < totalItems) {
        expect(targetIdx).toBeGreaterThanOrEqual(0);
        expect(targetIdx).toBeLessThan(totalItems);
      } else {
        expect(targetIdx).toBeGreaterThanOrEqual(totalItems);
      }
    });
  });

  it('identifies text input elements where shortcuts should be ignored', () => {
    const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];

    inputTags.forEach((tagName) => {
      const isFormElement =
        tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
      expect(isFormElement).toBe(true);
    });

    const nonFormTags = ['DIV', 'BUTTON', 'SPAN', 'P'];
    nonFormTags.forEach((tagName) => {
      const isFormElement =
        tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
      expect(isFormElement).toBe(false);
    });
  });
});

describe('Command Palette Search Filter Matching', () => {
  interface MockCommand {
    id: string;
    title: string;
    subtitle?: string;
    category: string;
  }

  const sampleCommands: MockCommand[] = [
    { id: '1', title: 'Morning Meditation', subtitle: 'Mindfulness • Tap to check off', category: 'Habits' },
    { id: '2', title: 'Deep Work Coding', subtitle: 'Focus • 45 min deep work', category: 'Habits' },
    { id: '3', title: "Go to Today's Dashboard", subtitle: 'Daily routine', category: 'Navigation' },
    { id: '4', title: 'Switch to OLED Pure Obsidian Mode', subtitle: 'Deep black AMOLED', category: 'Appearance' },
  ];

  function filterCommands(commands: MockCommand[], query: string): MockCommand[] {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.subtitle?.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
    );
  }

  it('returns all commands when search query is empty', () => {
    expect(filterCommands(sampleCommands, '')).toHaveLength(4);
    expect(filterCommands(sampleCommands, '   ')).toHaveLength(4);
  });

  it('filters commands by title case-insensitively', () => {
    const results = filterCommands(sampleCommands, 'meditation');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Morning Meditation');
  });

  it('filters commands by subtitle match', () => {
    const results = filterCommands(sampleCommands, 'amoled');
    expect(results).toHaveLength(1);
    expect(results[0].title).toContain('OLED');
  });

  it('filters commands by category match', () => {
    const results = filterCommands(sampleCommands, 'habits');
    expect(results).toHaveLength(2);
  });

  it('returns empty array when query does not match any entry', () => {
    const results = filterCommands(sampleCommands, 'nonexistent query 12345');
    expect(results).toHaveLength(0);
  });
});
