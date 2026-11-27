import { HabitEntry } from '../types';

export interface AuraWord {
  word: string;
  count: number;
  category: 'calm' | 'energized' | 'focused' | 'proud' | 'steady';
  weight: number; // 1 (smallest) to 5 (largest)
}

export interface ReflectionAuraSummary {
  dominantFeeling: string;
  dominantCategory: 'calm' | 'energized' | 'focused' | 'proud' | 'steady';
  positiveResonanceRate: number; // 0 - 100%
  totalReflectionsLogged: number;
  words: AuraWord[];
}

const FEELING_KEYWORD_MAP: Record<string, 'calm' | 'energized' | 'focused' | 'proud' | 'steady'> = {
  calm: 'calm',
  peaceful: 'calm',
  relaxed: 'calm',
  serene: 'calm',
  grounded: 'calm',
  still: 'calm',
  ease: 'calm',
  quiet: 'calm',

  energized: 'energized',
  vibrant: 'energized',
  alive: 'energized',
  strong: 'energized',
  unstoppable: 'energized',
  fresh: 'energized',
  motivated: 'energized',

  focused: 'focused',
  clarity: 'focused',
  sharp: 'focused',
  flow: 'focused',
  presence: 'focused',
  clear: 'focused',
  deep: 'focused',

  proud: 'proud',
  accomplished: 'proud',
  grateful: 'proud',
  gratitude: 'proud',
  fulfilled: 'proud',
  joyous: 'proud',
  happy: 'proud',

  steady: 'steady',
  consistent: 'steady',
  resilient: 'steady',
  balanced: 'steady',
  unbroken: 'steady',
  patient: 'steady',
  persevering: 'steady',
};

/**
 * Synthesizes reflection notes, tags, and daily mood entries into
 * an emotional aura and keyword cloud.
 */
export function extractReflectionAura(
  entriesByHabit: Record<string, Record<string, HabitEntry>>
): ReflectionAuraSummary {
  const counts: Record<string, { count: number; category: 'calm' | 'energized' | 'focused' | 'proud' | 'steady' }> = {};
  let totalReflections = 0;
  let positiveCount = 0;
  let totalMoodEntries = 0;

  Object.values(entriesByHabit).forEach((habitEntries) => {
    Object.values(habitEntries).forEach((entry) => {
      // 1. Process explicit entry.mood
      if (entry.mood) {
        totalMoodEntries++;
        if (entry.mood !== 'tired') positiveCount++;

        const moodCategory = entry.mood === 'tired' ? 'steady' : entry.mood;
        const moodWord = entry.mood;
        if (!counts[moodWord]) {
          counts[moodWord] = { count: 0, category: moodCategory };
        }
        counts[moodWord].count += 2; // Mood tags get higher weight
        totalReflections++;
      }

      // 2. Process custom tags
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach((tag) => {
          const cleanTag = tag.replace(/^#/, '').toLowerCase().trim();
          if (cleanTag && FEELING_KEYWORD_MAP[cleanTag]) {
            const cat = FEELING_KEYWORD_MAP[cleanTag];
            if (!counts[cleanTag]) {
              counts[cleanTag] = { count: 0, category: cat };
            }
            counts[cleanTag].count++;
            totalReflections++;
          }
        });
      }

      // 3. Process note text tokens
      if (entry.note && typeof entry.note === 'string') {
        const tokens = entry.note
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/);

        tokens.forEach((token) => {
          if (token.length > 2 && FEELING_KEYWORD_MAP[token]) {
            const cat = FEELING_KEYWORD_MAP[token];
            if (!counts[token]) {
              counts[token] = { count: 0, category: cat };
            }
            counts[token].count++;
            totalReflections++;
          }
        });
      }
    });
  });

  // Fallback defaults if no entries have notes yet
  if (Object.keys(counts).length === 0) {
    counts['calm'] = { count: 4, category: 'calm' };
    counts['steady'] = { count: 5, category: 'steady' };
    counts['focused'] = { count: 3, category: 'focused' };
    counts['clarity'] = { count: 2, category: 'focused' };
    counts['grounded'] = { count: 3, category: 'calm' };
    totalReflections = 17;
    positiveCount = 17;
    totalMoodEntries = 17;
  }

  // Sort and scale weights 1 - 5
  const sortedWords = Object.entries(counts).sort((a, b) => b[1].count - a[1].count);
  const maxCount = sortedWords.length > 0 ? sortedWords[0][1].count : 1;

  const auraWords: AuraWord[] = sortedWords.slice(0, 14).map(([word, data]) => {
    const rawWeight = Math.ceil((data.count / maxCount) * 5);
    const weight = Math.max(1, Math.min(5, rawWeight));
    return {
      word,
      count: data.count,
      category: data.category,
      weight,
    };
  });

  const dominantWord = auraWords.length > 0 ? auraWords[0] : { word: 'steady', category: 'steady' as const };
  const positiveResonanceRate =
    totalMoodEntries > 0 ? Math.round((positiveCount / totalMoodEntries) * 100) : 85;

  return {
    dominantFeeling: dominantWord.word,
    dominantCategory: dominantWord.category,
    positiveResonanceRate,
    totalReflectionsLogged: totalReflections,
    words: auraWords,
  };
}
