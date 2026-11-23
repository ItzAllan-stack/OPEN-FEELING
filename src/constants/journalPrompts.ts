import { getTodayIsoDate } from '../utils/date.ts';

/**
 * Gentle, open-ended prompts shown in Personal Journal.
 * One is chosen per calendar day via a small deterministic seed.
 */
export const JOURNAL_PROMPTS: string[] = [
  'What was one small thing you appreciated today?',
  'If today had a gentle color, what would it be?',
  'What’s a feeling that lingered today — and what was the quietest part of it?',
  'Name one person who felt part of your day.',
  'Write about a moment where you felt calm.',
  'What’s one thing you’re carrying — and what might let you set it down?',
  'Describe your space without judgment — just what you notice.',
  'Today, I am wondering about...',
  'One thing I learned — even just about myself.',
  'If you could give today a name, what would it be?',
  'Something simple I noticed: ...',
  'Today, the light...',
  'One act of kindness — received or given.',
  'What would I say to someone feeling what I feel right now?',
  'The first thing I want to say when I begin today...',
  'A memory that arrived — without invitation.',
  'How would I describe my mood to a friend?',
  'Something I’m learning about myself this week.',
  'The weight I’m carrying, or setting down...',
  'If today were a place, what would it look like?',
  'One thing I want to remember from this week.',
  'What makes me pause — and why?',
  'A small victory.',
  'Something I’m giving myself credit for.',
  'One breath, one sentence...',
  'Was there a moment when you felt seen?',
  'What held you up today?',
  'Today, I am starting to wonder about...',
  'One gentle word for how you feel right now: ...',
  'Something I would like to forgive myself for, gently.',
  'A quiet excuse to stop and look at the sky.',
];

function dateSeed(iso: string): number {
  let hash = 0;
  for (let i = 0; i < iso.length; i++) hash = (hash * 31 + iso.charCodeAt(i)) >>> 0;
  return hash;
}

/** Today’s prompt: chosen deterministically from the calendar day. */
export function todayJournalPrompt(): string {
  return JOURNAL_PROMPTS[dateSeed(getTodayIsoDate()) % JOURNAL_PROMPTS.length];
}

/** A random prompt; used when the reader asks for “another”. */
export function randomJournalPrompt(): string {
  return JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
}
