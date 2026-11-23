export type EmotionId =
  | ''
  | 'happy'
  | 'sad'
  | 'lonely'
  | 'anxious'
  | 'grateful'
  | 'hopeful'
  | 'excited'
  | 'confused'
  | 'motivated'
  | 'nostalgic'
  | 'in_love'
  | 'peaceful';

export type PostVisibility = 'public' | 'anonymous' | 'private';

export type ReactionType = 'understand' | 'love' | 'not_alone' | 'stay_strong' | 'thank_you';

export type ReactionCounts = Record<ReactionType, number>;

export interface PublicUser {
  uid: string;
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string;
  isPrivateProfile: boolean;
  followersCount: number;
  followingCount: number;
  ageConfirmed: boolean;
  acceptedGuidelines: boolean;
  joinedAt: Date;
  updatedAt: Date;
}

export interface PrivateUser {
  uid: string;
  email: string;
  role: 'member' | 'moderator' | 'admin';
  isSuspended: boolean;
  defaultVisibility: PostVisibility;
  sakuraEnabled: boolean;
  notifyReactions: boolean;
  notifyComments: boolean;
  notifyFollows: boolean;
  notifyCommunity: boolean;
  updatedAt: Date;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  emotion: EmotionId;
  tags: string[];
  visibility: PostVisibility;
  authorUid: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  communityId: string;
  communityName: string;
  imageUrl: string;
  reactionCounts: ReactionCounts;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
  isStarterSample?: boolean;
}

export interface PostDraft {
  id: string;
  ownerUid: string;
  title: string;
  content: string;
  emotion: EmotionId;
  tags: string[];
  visibility: PostVisibility;
  communityId: string;
  communityName: string;
  imageUrl: string;
  scheduledFor: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentItem {
  id: string;
  postId: string;
  postVisibility: PostVisibility;
  postAuthorUid: string;
  parentCommentId: string;
  authorUid: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Community {
  id: string;
  slug: string;
  name: string;
  description: string;
  rules: string[];
  accentTone: string;
  memberCount: number;
  createdByUid: string;
  createdAt: Date;
  isStarterSample?: boolean;
}

export interface PrivateJournalEntry {
  id: string;
  userUid: string;
  title: string;
  content: string;
  emotion: EmotionId;
  entryDate: string; // YYYY-MM-DD
  createdAt: Date;
  updatedAt: Date;
}

export interface AppNotification {
  id: string;
  recipientUid: string;
  actorUid: string;
  actorName: string;
  type: 'reaction' | 'comment' | 'reply' | 'follow' | 'community' | 'safety';
  postId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ModerationReport {
  id: string;
  reporterUid: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  postId: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  moderatorNote: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlockedUserEntry {
  id: string;
  blockerUid: string;
  blockedUid: string;
  mode: 'block' | 'mute';
  createdAt: Date;
}

export type ToastTone = 'success' | 'info' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  tone: ToastTone;
}
