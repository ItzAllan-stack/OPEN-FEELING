import type { PrivateJournalEntry } from '../types/index.ts';

function addDaysIso(iso: string, delta: number): string {
  const date = new Date(iso + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function entryDateOf(entry: PrivateJournalEntry): string {
  if (entry.entryDate) return entry.entryDate;
  return entry.createdAt instanceof Date ? entry.createdAt.toISOString().slice(0, 10) : '';
}

/**
 * Current journal streak: the number of consecutive days ending with the
 * most recent entry. Gaps break the run. Returns 0 when there are no entries.
 */
export function computeJournalStreak(entries: PrivateJournalEntry[]): number {
  const dates = entries
    .map(entryDateOf)
    .filter(Boolean)
    .sort()
    .reverse()
    .filter((date, i, arr) => i === 0 || date !== arr[i - 1]);

  if (dates.length === 0) return 0;

  let streak = 0;
  let expected = dates[0];
  for (const date of dates) {
    if (date === expected) {
      streak += 1;
      expected = addDaysIso(expected, -1);
    } else if (date < expected) {
      break; // gap in the run
    }
  }
  return streak;
}
