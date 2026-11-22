import { EmotionId, ReactionCounts, ReactionType } from '../types/index.ts';

export interface EmotionMeta {
  id: Exclude<EmotionId, ''>;
  label: string;
  dotColor: string;
  tintBg: string;
  tintText: string;
  description: string;
}

export const EMOTIONS: EmotionMeta[] = [
  {
    id: 'happy',
    label: 'Happy',
    dotColor: '#D99B52',
    tintBg: '#F9F0E3',
    tintText: '#7D5422',
    description: 'Warm moments of joy or lightness',
  },
  {
    id: 'sad',
    label: 'Sad',
    dotColor: '#7A96B0',
    tintBg: '#EAEFF5',
    tintText: '#3E576E',
    description: 'Heaviness, grief, or quiet sorrow',
  },
  {
    id: 'lonely',
    label: 'Lonely',
    dotColor: '#8E82A6',
    tintBg: '#E9E5F2',
    tintText: '#514766',
    description: 'Missing connection or feeling unseen',
  },
  {
    id: 'anxious',
    label: 'Anxious',
    dotColor: '#C48A78',
    tintBg: '#F6EAE6',
    tintText: '#754639',
    description: 'Restless thoughts or unspoken worry',
  },
  {
    id: 'grateful',
    label: 'Grateful',
    dotColor: '#7A9E7E',
    tintBg: '#DCE8DD',
    tintText: '#38593C',
    description: 'Thankfulness for small or big things',
  },
  {
    id: 'hopeful',
    label: 'Hopeful',
    dotColor: '#B89B5E',
    tintBg: '#F4EFE1',
    tintText: '#695526',
    description: 'Looking ahead with gentle trust',
  },
  {
    id: 'excited',
    label: 'Excited',
    dotColor: '#D47B8E',
    tintBg: '#F4DCE3',
    tintText: '#7D3B4B',
    description: 'Anticipation for something unfolding',
  },
  {
    id: 'confused',
    label: 'Confused',
    dotColor: '#948B82',
    tintBg: '#EEE8E1',
    tintText: '#575049',
    description: 'Standing at a crossroads, figuring things out',
  },
  {
    id: 'motivated',
    label: 'Motivated',
    dotColor: '#6E9A8B',
    tintBg: '#E0ECE8',
    tintText: '#33594C',
    description: 'Quiet resolve and steady momentum',
  },
  {
    id: 'nostalgic',
    label: 'Nostalgic',
    dotColor: '#B88D82',
    tintBg: '#F2E8E5',
    tintText: '#6B4840',
    description: 'Remembering chapters that shaped you',
  },
  {
    id: 'in_love',
    label: 'In Love',
    dotColor: '#CC788E',
    tintBg: '#F4DCE3',
    tintText: '#7E394B',
    description: 'Tenderness, affection, and deep care',
  },
  {
    id: 'peaceful',
    label: 'Peaceful',
    dotColor: '#789A7E',
    tintBg: '#DCE8DD',
    tintText: '#3A5840',
    description: 'Stillness, breath, and inner calm',
  },
];

export const EMOTION_MAP: Record<string, EmotionMeta> = Object.fromEntries(
  EMOTIONS.map((item) => [item.id, item])
);

export interface ReactionMeta {
  type: ReactionType;
  label: string;
  symbol: string;
}

export const MEANINGFUL_REACTIONS: ReactionMeta[] = [
  { type: 'understand', label: 'I Understand', symbol: '🤍' },
  { type: 'love', label: 'Sending Love', symbol: '❤️' },
  { type: 'not_alone', label: "You're Not Alone", symbol: '🌸' },
  { type: 'stay_strong', label: 'Stay Strong', symbol: '💛' },
  { type: 'thank_you', label: 'Thank You for Sharing', symbol: '🍃' },
];

export const EMPTY_REACTION_COUNTS: ReactionCounts = {
  understand: 0,
  love: 0,
  not_alone: 0,
  stay_strong: 0,
  thank_you: 0,
};

export const DAILY_REFLECTIONS: string[] = [
  'What is one honest feeling you have been carrying quietly this week that deserves a gentle sentence today?',
  'If someone you loved felt exactly the way you do right now, what kind words would you offer them?',
  'What small moment brought you a breath of relief or quiet comfort today?',
  'Is there an unspoken worry you can set down on paper for a little while?',
  'What part of your story are you still learning to be patient with?',
];

export const CURATED_AVATARS: string[] = [
  '/src/assets/images/avatar_community_1_1795329057107.jpg',
  '/src/assets/images/avatar_community_2_1795329056950.jpg',
  '/src/assets/images/story_journal_calm_1795329057247.jpg',
  '/src/assets/images/story_community_warmth_1795329056419.jpg',
];

export const ADMIN_EMAIL = 'mroy4957@gmail.com';
