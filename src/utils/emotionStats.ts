import { EMOTION_MAP, type EmotionMeta } from '../constants/emotions.ts';
import { getTodayIsoDate } from './date.ts';
import type { PrivateJournalEntry } from '../types/index.ts';

export interface EmotionWord {
  word: string;
  count: number;
}

export interface EmotionStat {
  meta: EmotionMeta;
  count: number;
}

export interface EmotionStats {
  totalEntries: number;
  emotionCounts: Record<string, number>;
  topEmotions: EmotionStat[];
  wordCloud: EmotionWord[];
  totalWords: number;
  /** ISO date (YYYY-MM-DD) → the emotion of the most recent entry on that day. */
  dayEmotionMap: Record<string, EmotionMeta>;
  /** The last `days` ISO dates, oldest → newest (ends with today). */
  dayOrder: string[];
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'both', 'but', 'by',
  'can', 'could', 'do', 'does', 'did', 'each', 'few', 'for', 'from', 'had', 'has',
  'have', 'he', 'her', 'here', 'hers', 'him', 'his', 'how', 'i', 'if', 'in', 'into',
  'is', 'it', 'its', 'just', 'me', 'my', 'no', 'nor', 'not', 'now', 'of', 'off',
  'on', 'or', 'our', 'out', 'over', 'own', 'per', 'she', 'so', 'some', 'than',
  'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this',
  'those', 'to', 'too', 'under', 'up', 'very', 'was', 'we', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with',
  'would', 'your', 'yours', 'only', 'also', 'after', 'before', 'above',
  'again', 'always', 'never', 'maybe', 'please', 'thank', 'thanks', 'hi', 'hey',
]);

const MIN_WORD_LENGTH = 3;
const MAX_WORD_CLOUD = 16;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9']+/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= MIN_WORD_LENGTH && !STOP_WORDS.has(word));
}

function isoAddDays(iso: string, delta: number): string {
  const date = new Date(iso + 'T00:00:00');
  date.setDate(date.getDate() + delta);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getEmotionStats(entries: PrivateJournalEntry[], days = 30): EmotionStats {
  const totalEntries = entries.length;
  const emotionCounts: Record<string, number> = {};

  const entriesByDay = new Map<string, EmotionMeta>();
  const sorted = [...entries].sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  for (const entry of sorted) {
    emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] ?? 0) + 1;
    const meta = EMOTION_MAP[entry.emotion];
    if (meta && !entriesByDay.has(entry.entryDate)) entriesByDay.set(entry.entryDate, meta);
  }

  const topEmotions = Object.entries(emotionCounts)
    .map(([emotion, count]) => ({ meta: EMOTION_MAP[emotion], count }))
    .filter((item): item is EmotionStat => Boolean(item.meta))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const wordCounts = new Map<string, number>();
  let totalWords = 0;
  for (const entry of entries) {
    const words = tokenize(`${entry.title} ${entry.content}`);
    totalWords += words.length;
    for (const word of words) wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
  }
  const wordCloud: EmotionWord[] = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_WORD_CLOUD)
    .map(([word, count]) => ({ word, count }));

  const dayEmotionMap: Record<string, EmotionMeta> = {};
  const isoDays: string[] = [];
  let cursor = getTodayIsoDate();
  for (let i = 0; i < days; i++) {
    isoDays.push(cursor);
    const meta = entriesByDay.get(cursor);
    if (meta) dayEmotionMap[cursor] = meta;
    cursor = isoAddDays(cursor, -1);
  }
  // Oldest -> newest (ends with today), as documented on the return type.
  const dayOrder = isoDays.reverse();

  return { totalEntries, emotionCounts, topEmotions, wordCloud, totalWords, dayEmotionMap, dayOrder };
}
