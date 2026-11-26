import { describe, it, expect } from 'vitest';
import { calculateWhatIfScenario } from '../utils/whatIfSimulator';

describe('What-If Habit Pacing Simulator', () => {
  it('correctly calculates 100% remaining consistency lift', () => {
    // 30 days total, 20 days elapsed, 10 days remaining
    // 3 habits tracked. User has done 40 checks out of 60 possible (67% current rate)
    const result = calculateWhatIfScenario({
      totalDays: 30,
      daysElapsed: 20,
      completedChecks: 40,
      totalHabitCount: 3,
      targetConsistencyPercent: 100,
      currentStreak: 5,
    });

    expect(result.daysRemaining).toBe(10);
    // 10 days * 3 habits * 100% = 30 simulated checks
    expect(result.simulatedRemainingChecks).toBe(30);
    // 40 + 30 = 70 total simulated checks out of 90 total possible
    expect(result.simulatedTotalChecks).toBe(70);
    expect(result.maxPossibleTotalChecks).toBe(90);
    // 70 / 90 = 77.78% -> 78%
    expect(result.simulatedRate).toBe(78);
    expect(result.currentRate).toBe(67);
    expect(result.rateDelta).toBe(11);
    expect(result.grade).toBe('B');
    expect(result.projectedStreak).toBe(15); // 5 + 10
  });

  it('awards Grade S and Century Club when simulated rate reaches 100%', () => {
    const result = calculateWhatIfScenario({
      totalDays: 31,
      daysElapsed: 15,
      completedChecks: 30, // 2 habits * 15 days = 30 (100% so far)
      totalHabitCount: 2,
      targetConsistencyPercent: 100,
      currentStreak: 15,
    });

    expect(result.simulatedRate).toBe(100);
    expect(result.grade).toBe('S');
    expect(result.milestoneBadge).toBe('🏆 Century Club (100%)');
    expect(result.isFlowBenchmarkReached).toBe(true);
    expect(result.projectedStreak).toBe(31);
  });

  it('handles 0% consistency simulation properly', () => {
    const result = calculateWhatIfScenario({
      totalDays: 30,
      daysElapsed: 10,
      completedChecks: 10,
      totalHabitCount: 1,
      targetConsistencyPercent: 0,
      currentStreak: 10,
    });

    expect(result.simulatedRemainingChecks).toBe(0);
    expect(result.simulatedTotalChecks).toBe(10);
    // 10 / 30 = 33%
    expect(result.simulatedRate).toBe(33);
    expect(result.grade).toBe('D');
    expect(result.projectedStreak).toBe(10); // does not extend
  });

  it('recognizes 80% Flow benchmark threshold', () => {
    const result = calculateWhatIfScenario({
      totalDays: 30,
      daysElapsed: 25,
      completedChecks: 20,
      totalHabitCount: 1,
      targetConsistencyPercent: 100, // 5 more checks
      currentStreak: 4,
    });

    // 20 + 5 = 25 / 30 = 83%
    expect(result.simulatedRate).toBe(83);
    expect(result.isFlowBenchmarkReached).toBe(true);
    expect(result.grade).toBe('A');
    expect(result.milestoneBadge).toBe('🌟 80% Flow State Unlocked');
  });
});
