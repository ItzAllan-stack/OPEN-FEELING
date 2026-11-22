import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { EMPTY_REACTION_COUNTS } from '../constants/emotions.ts';
import { STARTER_COMMUNITIES } from '../data/starterData.ts';
import { SAMPLE_CONTENT_ENABLED, STARTER_SEED_ENABLED } from '../lib/features.ts';
import {
  AppNotification,
  BlockedUserEntry,
  CommentItem,
  Community,
  EmotionId,
  ModerationReport,
  Post,
  PostVisibility,
  PrivateJournalEntry,
  PrivateUser,
  PublicUser,
  ReactionCounts,
  ReactionType,
} from '../types/index.ts';

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? new Date(0) : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
  }
  return new Date(0);
}

export async function checkIsAdmin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    // Registry unreadable or denied - never fail open.
    return false;
  }
}

export function makeId(prefix = ''): string {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 14);
  return prefix ? `${prefix}_${rand}` : rand;
}

function mapPublicUser(data: Record<string, unknown>): PublicUser {
  return {
    uid: String(data.uid ?? ''),
    displayName: String(data.displayName ?? ''),
    username: String(data.username ?? ''),
    bio: String(data.bio ?? ''),
    avatarUrl: String(data.avatarUrl ?? ''),
    isPrivateProfile: Boolean(data.isPrivateProfile),
    followersCount: Number(data.followersCount ?? 0),
    followingCount: Number(data.followingCount ?? 0),
    ageConfirmed: Boolean(data.ageConfirmed),
    acceptedGuidelines: Boolean(data.acceptedGuidelines),
    joinedAt: toDate(data.joinedAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapPrivateUser(data: Record<string, unknown>): PrivateUser {
  return {
    uid: String(data.uid ?? ''),
    email: String(data.email ?? ''),
    role: (data.role as PrivateUser['role']) ?? 'member',
    isSuspended: Boolean(data.isSuspended),
    defaultVisibility: (data.defaultVisibility as PostVisibility) ?? 'public',
    sakuraEnabled: data.sakuraEnabled !== false,
    notifyReactions: data.notifyReactions !== false,
    notifyComments: data.notifyComments !== false,
    notifyFollows: data.notifyFollows !== false,
    notifyCommunity: data.notifyCommunity !== false,
    updatedAt: toDate(data.updatedAt),
  };
}

function mapPost(data: Record<string, unknown>): Post {
  const counts = (data.reactionCounts as Record<string, unknown>) || {};
  return {
    id: String(data.id ?? ''),
    title: String(data.title ?? ''),
    content: String(data.content ?? ''),
    emotion: (data.emotion as EmotionId) ?? '',
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    visibility: (data.visibility as PostVisibility) ?? 'public',
    authorUid: String(data.authorUid ?? ''),
    authorName: String(data.authorName ?? 'Anonymous'),
    authorUsername: String(data.authorUsername ?? 'anonymous'),
    authorAvatar: String(data.authorAvatar ?? ''),
    communityId: String(data.communityId ?? ''),
    communityName: String(data.communityName ?? ''),
    imageUrl: String(data.imageUrl ?? ''),
    reactionCounts: {
      understand: Number(counts.understand ?? 0),
      love: Number(counts.love ?? 0),
      not_alone: Number(counts.not_alone ?? 0),
      stay_strong: Number(counts.stay_strong ?? 0),
      thank_you: Number(counts.thank_you ?? 0),
    },
    commentsCount: Number(data.commentsCount ?? 0),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapComment(data: Record<string, unknown>): CommentItem {
  return {
    id: String(data.id ?? ''),
    postId: String(data.postId ?? ''),
    postVisibility: (data.postVisibility as PostVisibility) ?? 'public',
    postAuthorUid: String(data.postAuthorUid ?? ''),
    parentCommentId: String(data.parentCommentId ?? ''),
    authorUid: String(data.authorUid ?? ''),
    authorName: String(data.authorName ?? ''),
    authorUsername: String(data.authorUsername ?? ''),
    authorAvatar: String(data.authorAvatar ?? ''),
    content: String(data.content ?? ''),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapCommunity(data: Record<string, unknown>): Community {
  return {
    id: String(data.id ?? ''),
    slug: String(data.slug ?? ''),
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    rules: Array.isArray(data.rules) ? data.rules.map(String) : [],
    accentTone: String(data.accentTone ?? '#F4DCE3'),
    memberCount: Number(data.memberCount ?? 0),
    createdByUid: String(data.createdByUid ?? ''),
    createdAt: toDate(data.createdAt),
  };
}

// ============================================================================
// Profiles & Usernames
// ============================================================================

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const clean = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,32}$/.test(clean)) return false;
  try {
    const snap = await getDoc(doc(db, 'usernames', clean));
    return !snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `usernames/${clean}`);
  }
}

export async function getPublicUser(uid: string): Promise<PublicUser | null> {
  try {
    const snap = await getDoc(doc(db, 'users_public', uid));
    if (!snap.exists()) return null;
    return mapPublicUser(snap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users_public/${uid}`);
  }
}

export async function getPrivateUser(uid: string): Promise<PrivateUser | null> {
  try {
    const snap = await getDoc(doc(db, 'users_private', uid));
    if (!snap.exists()) return null;
    return mapPrivateUser(snap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users_private/${uid}`);
  }
}

export async function listPublicUsers(): Promise<PublicUser[]> {
  try {
    const snap = await getDocs(query(collection(db, 'users_public'), limit(100)));
    return snap.docs.map((d) => mapPublicUser(d.data() as Record<string, unknown>));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users_public');
  }
}

export function subscribePublicUsers(
  onData: (users: PublicUser[]) => void
): () => void {
  const q = query(collection(db, 'users_public'), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => mapPublicUser(d.data() as Record<string, unknown>)));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'users_public')
  );
}

export async function createUserProfile(params: {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  bio?: string;
}): Promise<{ publicUser: PublicUser; privateUser: PrivateUser }> {
  const cleanUsername = params.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (cleanUsername.length < 3) {
    throw new Error('Username must be at least 3 characters (letters, numbers, or underscores).');
  }

  try {
    const usernameRef = doc(db, 'usernames', cleanUsername);
    const existing = await getDoc(usernameRef);
    if (existing.exists() && existing.data()?.uid !== params.uid) {
      throw new Error('That username is already taken. Please choose another.');
    }

    const batch = writeBatch(db);
    if (!existing.exists()) {
      batch.set(usernameRef, {
        username: cleanUsername,
        uid: params.uid,
        createdAt: serverTimestamp(),
      });
    }

    const publicRef = doc(db, 'users_public', params.uid);
    batch.set(publicRef, {
      uid: params.uid,
      displayName: params.displayName.trim().slice(0, 80) || 'Kind Soul',
      username: cleanUsername,
      bio: (params.bio || '').trim().slice(0, 400),
      avatarUrl: params.avatarUrl.slice(0, 60000),
      isPrivateProfile: false,
      followersCount: 0,
      followingCount: 0,
      ageConfirmed: true,
      acceptedGuidelines: true,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const privateRef = doc(db, 'users_private', params.uid);
    batch.set(privateRef, {
      uid: params.uid,
      email: params.email.slice(0, 254),
      role: 'member',
      isSuspended: false,
      defaultVisibility: 'public',
      sakuraEnabled: true,
      notifyReactions: true,
      notifyComments: true,
      notifyFollows: true,
      notifyCommunity: true,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    const [pub, priv] = await Promise.all([
      getPublicUser(params.uid),
      getPrivateUser(params.uid),
    ]);
    if (!pub || !priv) throw new Error('Profile creation could not be verified.');
    return { publicUser: pub, privateUser: priv };
  } catch (error) {
    if (error instanceof Error && error.message.includes('username')) throw error;
    handleFirestoreError(error, OperationType.WRITE, `users_public/${params.uid}`);
  }
}

export async function updatePublicProfile(
  uid: string,
  currentUsername: string,
  updates: {
    displayName: string;
    username: string;
    bio: string;
    avatarUrl: string;
    isPrivateProfile: boolean;
  }
): Promise<void> {
  const cleanUsername = updates.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (cleanUsername.length < 3 || cleanUsername.length > 32) {
    throw new Error('Username must be 3–32 characters using lowercase letters, numbers, or underscores.');
  }

  try {
    const batch = writeBatch(db);
    if (cleanUsername !== currentUsername) {
      const nextRef = doc(db, 'usernames', cleanUsername);
      const nextSnap = await getDoc(nextRef);
      if (nextSnap.exists() && nextSnap.data()?.uid !== uid) {
        throw new Error('This username is already taken.');
      }
      if (!nextSnap.exists()) {
        batch.set(nextRef, {
          username: cleanUsername,
          uid,
          createdAt: serverTimestamp(),
        });
      }
      if (currentUsername) {
        batch.delete(doc(db, 'usernames', currentUsername));
      }
    }

    batch.update(doc(db, 'users_public', uid), {
      displayName: updates.displayName.trim().slice(0, 80),
      username: cleanUsername,
      bio: updates.bio.trim().slice(0, 400),
      avatarUrl: updates.avatarUrl.trim().slice(0, 60000),
      isPrivateProfile: updates.isPrivateProfile,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    if (error instanceof Error && error.message.includes('username')) throw error;
    handleFirestoreError(error, OperationType.UPDATE, `users_public/${uid}`);
  }
}

export async function updatePrivatePreferences(
  uid: string,
  updates: Partial<
    Pick<
      PrivateUser,
      | 'defaultVisibility'
      | 'sakuraEnabled'
      | 'notifyReactions'
      | 'notifyComments'
      | 'notifyFollows'
      | 'notifyCommunity'
    >
  >
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users_private', uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users_private/${uid}`);
  }
}

export async function deleteUserAccountData(uid: string, username: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users_public', uid));
    batch.delete(doc(db, 'users_private', uid));
    if (username) {
      batch.delete(doc(db, 'usernames', username));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users_private/${uid}`);
  }
}

// ============================================================================
// Posts & Anonymous Identity Protection
// ============================================================================

export function subscribePublicPosts(
  onData: (posts: Post[]) => void,
  onErr?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, 'posts'),
    where('visibility', 'in', ['public', 'anonymous']),
    limit(80)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => mapPost(d.data() as Record<string, unknown>))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(items);
    },
    (error) => {
      if (onErr) onErr(error);
      else handleFirestoreError(error, OperationType.LIST, 'posts');
    }
  );
}

export function subscribeUserPrivatePosts(
  uid: string,
  onData: (posts: Post[]) => void
): () => void {
  const q = query(collection(db, 'posts'), where('authorUid', '==', uid), limit(60));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => mapPost(d.data() as Record<string, unknown>))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'posts/private')
  );
}

export function subscribeOwnedAnonymousPostIds(
  uid: string,
  onData: (postIds: string[]) => void
): () => void {
  const q = query(collection(db, 'post_ownership'), where('ownerUid', '==', uid), limit(80));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => String(d.data().postId ?? d.id)));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'post_ownership')
  );
}

export async function getPostById(postId: string): Promise<Post | null> {
  try {
    const snap = await getDoc(doc(db, 'posts', postId));
    if (!snap.exists()) return null;
    return mapPost(snap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `posts/${postId}`);
  }
}

export async function createPost(params: {
  user: PublicUser;
  title: string;
  content: string;
  emotion: EmotionId;
  tags: string[];
  visibility: PostVisibility;
  communityId?: string;
  communityName?: string;
  imageUrl?: string;
}): Promise<string> {
  const postId = makeId('post');
  const cleanTags = params.tags
    .map((t) => t.trim().toLowerCase().replace(/^#/, '').slice(0, 32))
    .filter(Boolean)
    .slice(0, 5);

  const isAnon = params.visibility === 'anonymous';

  try {
    const batch = writeBatch(db);
    if (isAnon) {
      batch.set(doc(db, 'post_ownership', postId), {
        postId,
        ownerUid: params.user.uid,
        createdAt: serverTimestamp(),
      });
    }

    batch.set(doc(db, 'posts', postId), {
      id: postId,
      title: params.title.trim().slice(0, 140),
      content: params.content.trim().slice(0, 4000),
      emotion: params.emotion,
      tags: cleanTags,
      visibility: params.visibility,
      authorUid: isAnon ? 'anonymous' : params.user.uid,
      authorName: isAnon ? 'Anonymous' : params.user.displayName,
      authorUsername: isAnon ? 'anonymous' : params.user.username,
      authorAvatar: isAnon ? '' : params.user.avatarUrl,
      communityId: (params.communityId || '').slice(0, 128),
      communityName: (params.communityName || '').slice(0, 80),
      imageUrl: (params.imageUrl || '').trim().slice(0, 500),
      reactionCounts: { ...EMPTY_REACTION_COUNTS },
      commentsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    return postId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `posts/${postId}`);
  }
}

export async function updatePostContent(
  postId: string,
  updates: {
    title: string;
    content: string;
    emotion: EmotionId;
    tags: string[];
    imageUrl: string;
  }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'posts', postId), {
      title: updates.title.trim().slice(0, 140),
      content: updates.content.trim().slice(0, 4000),
      emotion: updates.emotion,
      tags: updates.tags.slice(0, 5),
      imageUrl: updates.imageUrl.trim().slice(0, 500),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
  }
}

export async function deletePost(postId: string, isAnonymousPost: boolean): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'posts', postId));
    if (isAnonymousPost) {
      batch.delete(doc(db, 'post_ownership', postId));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
  }
}

// ============================================================================
// Reactions
// ============================================================================

export function subscribePostReactions(
  postId: string,
  onData: (userReactions: Record<string, ReactionType[]>) => void
): () => void {
  return onSnapshot(
    collection(db, 'posts', postId, 'reactions'),
    (snap) => {
      const map: Record<string, ReactionType[]> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        const uid = String(data.userUid ?? '');
        const type = data.type as ReactionType;
        if (!map[uid]) map[uid] = [];
        map[uid].push(type);
      });
      onData(map);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `posts/${postId}/reactions`)
  );
}

export async function togglePostReaction(params: {
  post: Post;
  actor: PublicUser;
  type: ReactionType;
  currentlyActive: boolean;
}): Promise<ReactionCounts> {
  const { post, actor, type, currentlyActive } = params;
  const reactionId = `${actor.uid}_${type}`;
  const reactionRef = doc(db, 'posts', post.id, 'reactions', reactionId);
  const postRef = doc(db, 'posts', post.id);

  const nextCounts: ReactionCounts = {
    ...post.reactionCounts,
    [type]: Math.max(0, (post.reactionCounts[type] ?? 0) + (currentlyActive ? -1 : 1)),
  };

  try {
    const batch = writeBatch(db);
    if (currentlyActive) {
      batch.delete(reactionRef);
    } else {
      batch.set(reactionRef, {
        id: reactionId,
        postId: post.id,
        userUid: actor.uid,
        type,
        createdAt: serverTimestamp(),
      });
    }

    batch.update(postRef, {
      [`reactionCounts.${type}`]: currentlyActive ? increment(-1) : increment(1),
      updatedAt: serverTimestamp(),
    });

    if (!currentlyActive && post.authorUid !== 'anonymous' && post.authorUid !== actor.uid) {
      const notifId = makeId('notif');
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        recipientUid: post.authorUid,
        actorUid: actor.uid,
        actorName: actor.displayName,
        type: 'reaction',
        postId: post.id,
        message: `${actor.displayName} sent supportive warmth to your post.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return nextCounts;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `posts/${post.id}/reactions/${reactionId}`);
  }
}

// ============================================================================
// Comments & Replies
// ============================================================================

export function subscribePostComments(
  postId: string,
  onData: (comments: CommentItem[]) => void
): () => void {
  return onSnapshot(
    collection(db, 'posts', postId, 'comments'),
    (snap) => {
      const items = snap.docs
        .map((d) => mapComment(d.data() as Record<string, unknown>))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `posts/${postId}/comments`)
  );
}

export async function addComment(params: {
  post: Post;
  author: PublicUser;
  content: string;
  parentCommentId?: string;
  replyToUid?: string;
}): Promise<void> {
  const commentId = makeId('cmt');
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'posts', params.post.id, 'comments', commentId), {
      id: commentId,
      postId: params.post.id,
      postVisibility: params.post.visibility,
      postAuthorUid: params.post.authorUid,
      parentCommentId: params.parentCommentId || '',
      authorUid: params.author.uid,
      authorName: params.author.displayName,
      authorUsername: params.author.username,
      authorAvatar: params.author.avatarUrl,
      content: params.content.trim().slice(0, 1500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.update(doc(db, 'posts', params.post.id), {
      commentsCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    const recipient = params.replyToUid || (params.post.authorUid !== 'anonymous' ? params.post.authorUid : '');
    if (recipient && recipient !== params.author.uid) {
      const notifId = makeId('notif');
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        recipientUid: recipient,
        actorUid: params.author.uid,
        actorName: params.author.displayName,
        type: params.parentCommentId ? 'reply' : 'comment',
        postId: params.post.id,
        message: params.parentCommentId
          ? `${params.author.displayName} replied to your comment.`
          : `${params.author.displayName} shared a supportive comment on your post.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `posts/${params.post.id}/comments/${commentId}`);
  }
}

export async function editComment(postId: string, commentId: string, content: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
      content: content.trim().slice(0, 1500),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}/comments/${commentId}`);
  }
}

export async function deleteComment(post: Post, commentId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'posts', post.id, 'comments', commentId));
    batch.update(doc(db, 'posts', post.id), {
      commentsCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `posts/${post.id}/comments/${commentId}`);
  }
}

// ============================================================================
// Communities
// ============================================================================

export function subscribeCommunities(onData: (communities: Community[]) => void): () => void {
  return onSnapshot(
    collection(db, 'communities'),
    (snap) => {
      if (snap.empty) {
        onData(SAMPLE_CONTENT_ENABLED ? STARTER_COMMUNITIES : []);
        return;
      }
      const items = snap.docs.map((d) => mapCommunity(d.data() as Record<string, unknown>));
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'communities')
  );
}

export async function seedStarterCommunitiesIfNeeded(uid: string): Promise<void> {
  if (!STARTER_SEED_ENABLED) return;
  try {
    const existingSnap = await getDocs(query(collection(db, 'communities'), limit(1)));
    if (!existingSnap.empty) return;

    const batch = writeBatch(db);
    for (const c of STARTER_COMMUNITIES) {
      batch.set(doc(db, 'communities', c.id), {
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        rules: c.rules,
        accentTone: c.accentTone,
        memberCount: c.memberCount,
        createdByUid: uid,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    // Non-fatal if another client raced
    console.warn('Community seed skipped:', error);
  }
}

export async function createCommunity(params: {
  uid: string;
  name: string;
  description: string;
  rules: string[];
  accentTone?: string;
}): Promise<string> {
  const slug = params.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || makeId('space');
  const id = `${slug}_${makeId().slice(0, 5)}`;

  try {
    await setDoc(doc(db, 'communities', id), {
      id,
      slug: id,
      name: params.name.trim().slice(0, 80),
      description: params.description.trim().slice(0, 500),
      rules: params.rules.map((r) => r.trim().slice(0, 200)).filter(Boolean).slice(0, 10),
      accentTone: params.accentTone || '#F4DCE3',
      memberCount: 1,
      createdByUid: params.uid,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'community_members', `${id}_${params.uid}`), {
      id: `${id}_${params.uid}`,
      communityId: id,
      userUid: params.uid,
      joinedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `communities/${id}`);
  }
}

export function subscribeUserMemberships(
  uid: string,
  onData: (communityIds: string[]) => void
): () => void {
  const q = query(collection(db, 'community_members'), where('userUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => String(d.data().communityId)));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'community_members')
  );
}

export async function toggleCommunityMembership(
  community: Community,
  uid: string,
  isMember: boolean
): Promise<void> {
  const memberDocId = `${community.id}_${uid}`;
  try {
    // Ensure starter community exists in Firestore before joining
    const cRef = doc(db, 'communities', community.id);
    const cSnap = await getDoc(cRef);
    if (!cSnap.exists()) {
      await seedStarterCommunitiesIfNeeded(uid);
    }

    const batch = writeBatch(db);
    if (isMember) {
      batch.delete(doc(db, 'community_members', memberDocId));
      batch.update(cRef, { memberCount: increment(-1) });
    } else {
      batch.set(doc(db, 'community_members', memberDocId), {
        id: memberDocId,
        communityId: community.id,
        userUid: uid,
        joinedAt: serverTimestamp(),
      });
      batch.update(cRef, { memberCount: increment(1) });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `community_members/${memberDocId}`);
  }
}

// ============================================================================
// Saved Posts (Bookmarks)
// ============================================================================

export function subscribeSavedPostIds(uid: string, onData: (postIds: string[]) => void): () => void {
  const q = query(collection(db, 'saved_posts'), where('userUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => String(d.data().postId))),
    (error) => handleFirestoreError(error, OperationType.LIST, 'saved_posts')
  );
}

export async function toggleSavePost(uid: string, postId: string, isSaved: boolean): Promise<void> {
  const savedId = `${uid}_${postId}`;
  try {
    if (isSaved) {
      await deleteDoc(doc(db, 'saved_posts', savedId));
    } else {
      await setDoc(doc(db, 'saved_posts', savedId), {
        id: savedId,
        userUid: uid,
        postId,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `saved_posts/${savedId}`);
  }
}

// ============================================================================
// Follows
// ============================================================================

export function subscribeFollowingUids(uid: string, onData: (uids: string[]) => void): () => void {
  const q = query(collection(db, 'follows'), where('followerUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => String(d.data().followingUid))),
    (error) => handleFirestoreError(error, OperationType.LIST, 'follows')
  );
}

export async function toggleFollowUser(params: {
  actor: PublicUser;
  targetUser: PublicUser;
  isFollowing: boolean;
}): Promise<void> {
  const { actor, targetUser, isFollowing } = params;
  const followId = `${actor.uid}_${targetUser.uid}`;
  try {
    const batch = writeBatch(db);
    if (isFollowing) {
      batch.delete(doc(db, 'follows', followId));
      batch.update(doc(db, 'users_public', actor.uid), {
        followingCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'users_public', targetUser.uid), {
        followersCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(doc(db, 'follows', followId), {
        id: followId,
        followerUid: actor.uid,
        followingUid: targetUser.uid,
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, 'users_public', actor.uid), {
        followingCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'users_public', targetUser.uid), {
        followersCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      const notifId = makeId('notif');
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        recipientUid: targetUser.uid,
        actorUid: actor.uid,
        actorName: actor.displayName,
        type: 'follow',
        postId: '',
        message: `${actor.displayName} started following your reflections.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `follows/${followId}`);
  }
}

// ============================================================================
// Private Personal Journal ("My Personal Space")
// ============================================================================

export function subscribePrivateJournal(
  uid: string,
  onData: (entries: PrivateJournalEntry[]) => void
): () => void {
  const q = query(collection(db, 'private_journals'), where('userUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: String(data.id ?? d.id),
            userUid: String(data.userUid ?? ''),
            title: String(data.title ?? ''),
            content: String(data.content ?? ''),
            emotion: (data.emotion as EmotionId) ?? '',
            entryDate: String(data.entryDate ?? ''),
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          };
        })
        .sort((a, b) => b.entryDate.localeCompare(a.entryDate) || b.createdAt.getTime() - a.createdAt.getTime());
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'private_journals')
  );
}

export async function createJournalEntry(params: {
  uid: string;
  title: string;
  content: string;
  emotion: EmotionId;
  entryDate: string;
}): Promise<string> {
  const id = makeId('jrn');
  try {
    await setDoc(doc(db, 'private_journals', id), {
      id,
      userUid: params.uid,
      title: params.title.trim().slice(0, 140),
      content: params.content.trim().slice(0, 8000),
      emotion: params.emotion,
      entryDate: params.entryDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `private_journals/${id}`);
  }
}

export async function updateJournalEntry(
  id: string,
  updates: { title: string; content: string; emotion: EmotionId; entryDate: string }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'private_journals', id), {
      title: updates.title.trim().slice(0, 140),
      content: updates.content.trim().slice(0, 8000),
      emotion: updates.emotion,
      entryDate: updates.entryDate,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `private_journals/${id}`);
  }
}

export async function deleteJournalEntry(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'private_journals', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `private_journals/${id}`);
  }
}

// ============================================================================
// Notifications
// ============================================================================

export function subscribeNotifications(
  uid: string,
  onData: (items: AppNotification[]) => void
): () => void {
  const q = query(collection(db, 'notifications'), where('recipientUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: String(data.id ?? d.id),
            recipientUid: String(data.recipientUid ?? ''),
            actorUid: String(data.actorUid ?? ''),
            actorName: String(data.actorName ?? ''),
            type: (data.type as AppNotification['type']) ?? 'reaction',
            postId: String(data.postId ?? ''),
            message: String(data.message ?? ''),
            isRead: Boolean(data.isRead),
            createdAt: toDate(data.createdAt),
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'notifications')
  );
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', id), { isRead: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
  }
}

export async function markAllNotificationsRead(items: AppNotification[]): Promise<void> {
  const unread = items.filter((n) => !n.isRead);
  if (unread.length === 0) return;
  try {
    const batch = writeBatch(db);
    unread.forEach((n) => batch.update(doc(db, 'notifications', n.id), { isRead: true }));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications/batch');
  }
}

// ============================================================================
// Safety, Block/Mute & Moderation
// ============================================================================

export function subscribeBlockedUsers(
  uid: string,
  onData: (entries: BlockedUserEntry[]) => void
): () => void {
  const q = query(collection(db, 'blocked_users'), where('blockerUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id ?? d.id),
            blockerUid: String(data.blockerUid ?? ''),
            blockedUid: String(data.blockedUid ?? ''),
            mode: (data.mode as 'block' | 'mute') ?? 'block',
            createdAt: toDate(data.createdAt),
          };
        })
      );
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'blocked_users')
  );
}

export async function toggleBlockOrMute(
  blockerUid: string,
  blockedUid: string,
  mode: 'block' | 'mute',
  currentlyActive: boolean
): Promise<void> {
  const id = `${blockerUid}_${blockedUid}_${mode}`;
  try {
    if (currentlyActive) {
      await deleteDoc(doc(db, 'blocked_users', id));
    } else {
      await setDoc(doc(db, 'blocked_users', id), {
        id,
        blockerUid,
        blockedUid,
        mode,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `blocked_users/${id}`);
  }
}

export async function submitReport(params: {
  reporterUid: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  postId?: string;
  reason: string;
  details: string;
}): Promise<void> {
  const id = makeId('rpt');
  try {
    await setDoc(doc(db, 'reports', id), {
      id,
      reporterUid: params.reporterUid,
      targetType: params.targetType,
      targetId: params.targetId,
      postId: (params.postId || '').slice(0, 128),
      reason: params.reason.trim().slice(0, 120),
      details: params.details.trim().slice(0, 1000),
      status: 'pending',
      moderatorNote: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `reports/${id}`);
  }
}

export function subscribeAllReports(onData: (reports: ModerationReport[]) => void): () => void {
  return onSnapshot(
    collection(db, 'reports'),
    (snap) => {
      const items = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: String(data.id ?? d.id),
            reporterUid: String(data.reporterUid ?? ''),
            targetType: (data.targetType as ModerationReport['targetType']) ?? 'post',
            targetId: String(data.targetId ?? ''),
            postId: String(data.postId ?? ''),
            reason: String(data.reason ?? ''),
            details: String(data.details ?? ''),
            status: (data.status as ModerationReport['status']) ?? 'pending',
            moderatorNote: String(data.moderatorNote ?? ''),
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'reports')
  );
}

export async function updateReportStatus(
  reportId: string,
  status: ModerationReport['status'],
  moderatorNote: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      moderatorNote: moderatorNote.trim().slice(0, 500),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
  }
}

export async function adminResolvePostOwner(postId: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, 'post_ownership', postId));
    if (!snap.exists()) return null;
    return String(snap.data().ownerUid ?? '');
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `post_ownership/${postId}`);
  }
}
