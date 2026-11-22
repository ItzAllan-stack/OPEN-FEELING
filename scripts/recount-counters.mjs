#!/usr/bin/env node
/**
 * One-off (idempotent) recount of denormalized aggregate counters.
 *
 * Why this exists: earlier versions of the client maintained
 * reactionCounts / commentsCount / followersCount / followingCount /
 * memberCount by reading, incrementing locally and writing back. Concurrent
 * writes could lose updates, leaving drift. The client now uses
 * FieldValue.increment() and the security rules bound every delta to +/-1,
 * which prevents *new* drift but cannot repair pre-existing drift.
 *
 * What it does:
 *   posts/{id}.reactionCounts   = live count of reaction sub-collection docs, per type
 *   posts/{id}.commentsCount    = live count of comment sub-collection docs
 *   users_public/{uid}.followersCount / followingCount = live count of follows docs
 *   communities/{id}.memberCount                  = live count of community_members docs
 *
 * Modes:
 *   node scripts/recount-counters.mjs            dry run (prints drift, writes nothing)
 *   node scripts/recount-counters.mjs --apply    writes corrections in batches of 500
 *
 * Prerequisites: Application Default Credentials with Firestore admin
 * privileges, e.g.
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 * The project is read from .firebaserc / firebase-applet-config.json unless
 * --project <id> is passed or GCLOUD_PROJECT / GOOGLE_CLOUD_PROJECT is set.
 *
 * This uses the Admin SDK and therefore bypasses security rules. It only
 * ever writes the counter fields listed above; it never deletes documents.
 */
import { readFileSync, existsSync } from 'node:fs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const args = new Set(process.argv.slice(2));
const dryRun = !args.has('--apply');
const projectFlagIndex = process.argv.indexOf('--project');
const projectFromFlag = projectFlagIndex >= 0 ? process.argv[projectFlagIndex + 1] : undefined;

function detectProjectId() {
  if (projectFromFlag) return projectFromFlag;
  if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
  if (process.env.GOOGLE_CLOUD_PROJECT) return process.env.GOOGLE_CLOUD_PROJECT;
  try {
    const applet = JSON.parse(readFileSync(new URL('../firebase-applet-config.json', import.meta.url), 'utf8'));
    if (applet.projectId) return applet.projectId;
  } catch {
    // fall through
  }
  try {
    const firebaserc = JSON.parse(readFileSync(new URL('../.firebaserc', import.meta.url), 'utf8'));
    if (firebaserc?.projects?.default) return firebaserc.projects.default;
  } catch {
    // fall through
  }
  throw new Error('Unable to detect project id. Pass --project <id> or set GCLOUD_PROJECT.');
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GCLOUD_PROJECT) {
  console.warn('Note: GOOGLE_APPLICATION_CREDENTIALS is not set; applicationDefault() will use environment-provided credentials (e.g. gcloud, metadata server).');
}

const projectId = detectProjectId();
if (args.has('--help')) {
  console.log('Usage: node scripts/recount-counters.mjs [--apply] [--project <id>]');
  process.exit(0);
}

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();

const REACTION_TYPES = ['understand', 'love', 'not_alone', 'stay_strong', 'thank_you'];

async function main() {
  console.log(`Project: ${projectId}`);
  console.log(dryRun ? 'Mode: DRY RUN (no writes). Pass --apply to write corrections.' : 'Mode: APPLY — corrections will be written.');

  // ---- follows -> users_public counters -------------------------------
  const followerTallies = new Map();
  const followingTallies = new Map();
  const followsSnap = await db.collection('follows').select('followerUid', 'followingUid').get();
  for (const follow of followsSnap.docs) {
    const follower = follow.get('followerUid');
    const following = follow.get('followingUid');
    if (follower) followingTallies.set(follower, (followingTallies.get(follower) ?? 0) + 1);
    if (following) followerTallies.set(following, (followerTallies.get(following) ?? 0) + 1);
  }
  console.log(`Scanned ${followsSnap.size} follow edges.`);

  // ---- community_members -> communities.memberCount --------------------
  const memberTallies = new Map();
  const membersSnap = await db.collection('community_members').select('communityId').get();
  for (const member of membersSnap.docs) {
    const communityId = member.get('communityId');
    if (communityId) memberTallies.set(communityId, (memberTallies.get(communityId) ?? 0) + 1);
  }
  console.log(`Scanned ${membersSnap.size} membership docs.`);

  // ---- posts: comments + reactions -------------------------------------
  const commentTallies = new Map();
  const commentsSnap = await db.collectionGroup('comments').get();
  for (const comment of commentsSnap.docs) {
    const postId = comment.ref.parent.parent?.id;
    if (postId) commentTallies.set(postId, (commentTallies.get(postId) ?? 0) + 1);
  }
  console.log(`Scanned ${commentsSnap.size} comment docs.`);

  const reactionTallies = new Map(); // postId -> { type: count }
  const reactionsSnap = await db.collectionGroup('reactions').get();
  for (const reaction of reactionsSnap.docs) {
    const postId = reaction.ref.parent.parent?.id;
    const type = reaction.get('type');
    if (!postId || !REACTION_TYPES.includes(type)) continue;
    const bucket = reactionTallies.get(postId) ?? Object.fromEntries(REACTION_TYPES.map((t) => [t, 0]));
    bucket[type] += 1;
    reactionTallies.set(postId, bucket);
  }
  console.log(`Scanned ${reactionsSnap.size} reaction docs.`);

  // ---- gather corrections ------------------------------------------------
  const corrections = []; // { ref, data, label }

  const usersSnap = await db.collection('users_public').get();
  for (const user of usersSnap.docs) {
    const uid = user.id;
    const followers = followerTallies.get(uid) ?? 0;
    const following = followingTallies.get(uid) ?? 0;
    const currentFollowers = user.get('followersCount') ?? 0;
    const currentFollowing = user.get('followingCount') ?? 0;
    const data = {};
    if (currentFollowers !== followers) data.followersCount = followers;
    if (currentFollowing !== following) data.followingCount = following;
    if (Object.keys(data).length) {
      corrections.push({
        ref: user.ref,
        data,
        label: `users_public/${uid} followers ${currentFollowers}->${followers}, following ${currentFollowing}->${following}`,
      });
    }
  }

  const communitiesSnap = await db.collection('communities').get();
  for (const community of communitiesSnap.docs) {
    const expected = memberTallies.get(community.id) ?? 0;
    const current = community.get('memberCount') ?? 0;
    if (current !== expected) {
      corrections.push({
        ref: community.ref,
        data: { memberCount: expected },
        label: `communities/${community.id} memberCount ${current}->${expected}`,
      });
    }
  }

  const postsSnap = await db.collection('posts').get();
  for (const post of postsSnap.docs) {
    const expectedComments = commentTallies.get(post.id) ?? 0;
    const expectedReactions = reactionTallies.get(post.id) ?? Object.fromEntries(REACTION_TYPES.map((t) => [t, 0]));
    const currentComments = post.get('commentsCount') ?? 0;
    const currentReactions = post.get('reactionCounts') ?? {};
    const data = {};
    if (currentComments !== expectedComments) data.commentsCount = expectedComments;
    const mergedReactions = {};
    let reactionsDrift = false;
    for (const type of REACTION_TYPES) {
      mergedReactions[type] = expectedReactions[type];
      if ((currentReactions[type] ?? 0) !== expectedReactions[type]) reactionsDrift = true;
    }
    if (reactionsDrift) data.reactionCounts = mergedReactions;
    if (Object.keys(data).length) {
      corrections.push({
        ref: post.ref,
        data,
        label: `posts/${post.id} ${data.commentsCount !== undefined ? `commentsCount ${currentComments}->${expectedComments}` : ''}${data.reactionCounts ? ' reactionCounts(recomputed)' : ''}`.trim(),
      });
    }
  }

  console.log(`\nScanned ${usersSnap.size} users, ${communitiesSnap.size} communities, ${postsSnap.size} posts.`);
  if (corrections.length === 0) {
    console.log('No drift detected. Counters are consistent.');
    return;
  }
  console.log(`\nDrift found in ${corrections.length} document(s):`);
  for (const c of corrections) console.log(`  - ${c.label}`);

  if (dryRun) {
    console.log('\nDry run only. Re-run with --apply to write these corrections.');
    return;
  }

  let written = 0;
  for (let i = 0; i < corrections.length; i += 450) {
    const batch = db.batch();
    for (const c of corrections.slice(i, i + 450)) batch.update(c.ref, c.data);
    await batch.commit();
    written += Math.min(450, corrections.length - i);
  }
  console.log(`\nApplied corrections to ${written} document(s).`);
}

main().catch((error) => {
  console.error('recount-counters failed:', error);
  process.exit(1);
});
