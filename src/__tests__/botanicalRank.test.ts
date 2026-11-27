import { describe, it, expect } from 'vitest';
import { getBotanicalRank } from '../utils/botanicalRank';

describe('Botanical Growth Ranks (Automaticity Thresholds)', () => {
  it('classifies 0-7 days as Seedling (Intention Setting)', () => {
    const day0 = getBotanicalRank(0);
    expect(day0.key).toBe('seedling');
    expect(day0.icon).toBe('🌱');
    expect(day0.daysToNextRank).toBe(8);

    const day5 = getBotanicalRank(5);
    expect(day5.key).toBe('seedling');
    expect(day5.daysToNextRank).toBe(3);
    expect(day5.stageTitle).toBe('Intention Setting');

    const day7 = getBotanicalRank(7);
    expect(day7.key).toBe('seedling');
    expect(day7.daysToNextRank).toBe(1);
  });

  it('classifies 8-21 days as Sprout (Neural Stabilization)', () => {
    const day8 = getBotanicalRank(8);
    expect(day8.key).toBe('sprout');
    expect(day8.icon).toBe('🌿');
    expect(day8.stageTitle).toBe('Neural Stabilization');
    expect(day8.daysToNextRank).toBe(14); // 22 - 8

    const day21 = getBotanicalRank(21);
    expect(day21.key).toBe('sprout');
    expect(day21.daysToNextRank).toBe(1);
  });

  it('classifies 22-65 days as Evergreen (Proven Automaticity)', () => {
    const day22 = getBotanicalRank(22);
    expect(day22.key).toBe('evergreen');
    expect(day22.icon).toBe('🌳');
    expect(day22.stageTitle).toBe('Proven Automaticity');
    expect(day22.daysToNextRank).toBe(44); // 66 - 22

    const day50 = getBotanicalRank(50);
    expect(day50.key).toBe('evergreen');
    expect(day50.daysToNextRank).toBe(16);
  });

  it('classifies 66+ days as Ancient Oak (Permanent Identity)', () => {
    const day66 = getBotanicalRank(66);
    expect(day66.key).toBe('ancient_oak');
    expect(day66.icon).toBe('🌲');
    expect(day66.stageTitle).toBe('Permanent Identity');
    expect(day66.daysToNextRank).toBe(0);
    expect(day66.progressToNext).toBe(100);

    const day100 = getBotanicalRank(100);
    expect(day100.key).toBe('ancient_oak');
    expect(day100.daysToNextRank).toBe(0);
  });
});
