import { describe, it, expect } from 'vitest';
import { extractReflectionAura } from '../utils/reflectionAura';
import { HabitEntry } from '../types';

describe('Mindful Reflection Word Cloud & Emotional Aura', () => {
  it('extracts top feelings and positive resonance from mood and notes', () => {
    const mockEntries: Record<string, Record<string, HabitEntry>> = {
      h1: {
        '2026-11-01': {
          date: '2026-11-01',
          completed: true,
          mood: 'calm',
          note: 'Felt very grounded and deep focus today',
          weekOfMonth: 1,
          monthKey: '2026-11',
          updatedAt: '2026-11-01T10:00:00Z',
        },
        '2026-11-02': {
          date: '2026-11-02',
          completed: true,
          mood: 'calm',
          tags: ['#peaceful', '#steady'],
          weekOfMonth: 1,
          monthKey: '2026-11',
          updatedAt: '2026-11-02T10:00:00Z',
        },
      },
      h2: {
        '2026-11-01': {
          date: '2026-11-01',
          completed: true,
          mood: 'energized',
          note: 'Strong momentum and energized flow',
          weekOfMonth: 1,
          monthKey: '2026-11',
          updatedAt: '2026-11-01T11:00:00Z',
        },
      },
    };

    const aura = extractReflectionAura(mockEntries);

    expect(aura.words.length).toBeGreaterThan(0);
    // 'calm' appeared twice as mood (weight 4)
    expect(aura.dominantFeeling).toBe('calm');
    expect(aura.dominantCategory).toBe('calm');
    expect(aura.positiveResonanceRate).toBe(100);
  });

  it('provides soothing fallbacks when no reflections have been logged', () => {
    const emptyEntries = {};
    const aura = extractReflectionAura(emptyEntries);

    expect(aura.words.length).toBeGreaterThan(0);
    expect(aura.positiveResonanceRate).toBe(100);
  });
});
