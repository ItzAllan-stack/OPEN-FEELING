import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
let testEnv: RulesTestEnvironment;

const now = () => Timestamp.now();
const zeroCounts = {
  understand: 0,
  love: 0,
  not_alone: 0,
  stay_strong: 0,
  thank_you: 0,
};

function publicUser(uid: string, extra: Record<string, unknown> = {}) {
  return {
    uid,
    displayName: 'Kind Soul',
    username: `user_${uid}`,
    bio: '',
    avatarUrl: '',
    isPrivateProfile: false,
    followersCount: 0,
    followingCount: 0,
    ageConfirmed: true,
    acceptedGuidelines: true,
    joinedAt: now(),
    updatedAt: now(),
    ...extra,
  };
}

function privateUser(uid: string, extra: Record<string, unknown> = {}) {
  return {
    uid,
    email: `${uid}@example.com`,
    role: 'member',
    isSuspended: false,
    defaultVisibility: 'public',
    sakuraEnabled: true,
    notifyReactions: true,
    notifyComments: true,
    notifyFollows: true,
    notifyCommunity: true,
    updatedAt: now(),
    ...extra,
  };
}

function post(id: string, authorUid: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    title: 'A thought',
    content: 'Something honest',
    emotion: 'happy',
    tags: [],
    visibility: 'public',
    authorUid,
    authorName: 'Kind Soul',
    authorUsername: `user_${authorUid}`,
    authorAvatar: '',
    communityId: '',
    communityName: '',
    imageUrl: '',
    reactionCounts: { ...zeroCounts },
    commentsCount: 0,
    createdAt: now(),
    updatedAt: now(),
    ...extra,
  };
}

function community(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    slug: id,
    name: 'A space',
    description: 'A supportive space',
    rules: [],
    accentTone: '#F4DCE3',
    memberCount: 0,
    createdByUid: 'alice',
    createdAt: now(),
    ...extra,
  };
}

function draft(id: string, ownerUid: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    ownerUid,
    title: 'Unsent thoughts',
    content: 'Something I am not ready to publish yet',
    emotion: 'happy',
    tags: [],
    visibility: 'public',
    communityId: '',
    communityName: '',
    imageUrl: '',
    scheduledFor: null,
    createdAt: now(),
    updatedAt: now(),
    ...extra,
  };
}

function report(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    reporterUid: 'alice',
    targetType: 'post',
    targetId: 'p1',
    postId: 'p1',
    reason: 'spam',
    details: '',
    status: 'pending',
    moderatorNote: '',
    createdAt: now(),
    updatedAt: now(),
    ...extra,
  };
}

// rules-unit-testing v6 types the contexts as compat Firestore, but the instances
// it returns are the modular SDK clients used by the functions below.
function modular(db: unknown): Firestore {
  return db as Firestore;
}

async function seed(write: (db: Firestore) => Promise<unknown>): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await write(modular(ctx.firestore()));
  });
}

function as(uid: string, claims: Record<string, unknown> = {}): Firestore {
  return modular(testEnv.authenticatedContext(uid, claims).firestore());
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-open-feeling',
    firestore: { rules, host: '127.0.0.1', port: 8080 },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv?.cleanup();
});

describe('security_spec.md adversarial cases', () => {
  it('1. denies shadow admin escalation on users_private', async () => {
    const db = as('attacker');
    await assertFails(setDoc(doc(db, 'users_private', 'attacker'), privateUser('attacker', { role: 'admin' })));
  });

  it('2. denies shadow field injection on a post', async () => {
    const db = as('alice');
    await assertFails(setDoc(doc(db, 'posts', 'p2'), post('p2', 'alice', { isFeatured: true })));
  });

  it('3. denies anonymous identity spoofing', async () => {
    const db = as('attacker');
    await assertFails(
      setDoc(doc(db, 'posts', 'p2'), post('p2', 'attacker', {
        visibility: 'anonymous',
        authorUid: 'victim',
        authorName: 'Anonymous',
        authorUsername: 'anonymous',
      }))
    );
  });

  it('4. denies an orphaned anonymous post', async () => {
    const db = as('alice');
    await assertFails(
      setDoc(doc(db, 'posts', 'p3'), post('p3', 'alice', {
        visibility: 'anonymous',
        authorUid: 'anonymous',
        authorName: 'Anonymous',
        authorUsername: 'anonymous',
        authorAvatar: '',
      }))
    );
  });

  it('5. denies private journal snooping', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'private_journals', 'j1'), {
        id: 'j1', userUid: 'alice', title: 'Private', content: 'secret',
        emotion: 'sad', entryDate: '2026-11-22', createdAt: now(), updatedAt: now(),
      });
    });
    const db = as('bob');
    await assertFails(
      getDocs(query(collection(db, 'private_journals'), where('userUid', '==', 'alice')))
    );
  });

  it('6. denies cross-user post edits', async () => {
    await seed(async (db) => setDoc(doc(db, 'posts', 'p1'), post('p1', 'alice')));
    const db = as('bob');
    await assertFails(updateDoc(doc(db, 'posts', 'p1'), { content: 'tampered', updatedAt: serverTimestamp() }));
  });

  it('7. denies poisoned document IDs', async () => {
    const longId = 'p'.repeat(1500);
    const db = as('alice');
    await assertFails(setDoc(doc(db, 'posts', longId), post(longId, 'alice')));
  });

  it('8. denies admin access via email claim, even verified (admins registry required)', async () => {
    await seed(async (db) => setDoc(doc(db, 'reports', 'r1'), report('r1')));
    const db = as('evil', { email: 'admin@example.com', email_verified: true });
    await assertFails(updateDoc(doc(db, 'reports', 'r1'), {
      status: 'dismissed', moderatorNote: '', updatedAt: serverTimestamp(),
    }));
  });

  it('8b. grants admin access when the admins registry lists the uid', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'reports', 'r1'), report('r1'));
      await setDoc(doc(db, 'admins', 'root'), {
        grantedAt: serverTimestamp(),
        grantedBy: 'test',
      });
    });
    const db = as('root', { email: 'root@example.com', email_verified: true });
    await assertSucceeds(updateDoc(doc(db, 'reports', 'r1'), {
      status: 'dismissed', moderatorNote: 'handled', updatedAt: serverTimestamp(),
    }));
  });

  it('9. denies blanket reads of user PII', async () => {
    await seed(async (db) => setDoc(doc(db, 'users_private', 'alice'), privateUser('alice')));
    const db = as('bob');
    await assertFails(getDoc(doc(db, 'users_private', 'alice')));
  });

  it('10. denies reaction impersonation', async () => {
    await seed(async (db) => setDoc(doc(db, 'posts', 'p1'), post('p1', 'alice')));
    const db = as('attacker');
    await assertFails(setDoc(doc(db, 'posts', 'p1', 'reactions', 'victim_love'), {
      id: 'victim_love', postId: 'p1', userUid: 'victim', type: 'love', createdAt: serverTimestamp(),
    }));
  });

  it('11. denies report tampering by a non-admin', async () => {
    await seed(async (db) => setDoc(doc(db, 'reports', 'r1'), report('r1')));
    const db = as('alice');
    await assertFails(updateDoc(doc(db, 'reports', 'r1'), {
      status: 'dismissed', moderatorNote: 'fine', updatedAt: serverTimestamp(),
    }));
  });

  it('12. denies forged client timestamps', async () => {
    const db = as('alice');
    await assertFails(setDoc(doc(db, 'posts', 'p4'), post('p4', 'alice', {
      createdAt: Timestamp.fromDate(new Date('2020-01-01T00:00:00Z')),
    })));
  });
});

describe('aggregate counter integrity', () => {
  it('denies arbitrary reaction count inflation', async () => {
    await seed(async (db) => setDoc(doc(db, 'posts', 'p1'), post('p1', 'alice')));
    const db = as('bob');
    await assertFails(updateDoc(doc(db, 'posts', 'p1'), {
      reactionCounts: { ...zeroCounts, love: 999 }, updatedAt: serverTimestamp(),
    }));
  });

  it('allows a reaction increment when the reaction doc is written in the same batch', async () => {
    await seed(async (db) => setDoc(doc(db, 'posts', 'p1'), post('p1', 'alice')));
    const db = as('bob');
    const batch = writeBatch(db);
    batch.set(doc(db, 'posts', 'p1', 'reactions', 'bob_love'), {
      id: 'bob_love', postId: 'p1', userUid: 'bob', type: 'love', createdAt: serverTimestamp(),
    });
    batch.update(doc(db, 'posts', 'p1'), {
      reactionCounts: { ...zeroCounts, love: 1 }, updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
  });

  it('accepts FieldValue.increment() for reaction counts', async () => {
    await seed(async (db) => setDoc(doc(db, 'posts', 'p1'), post('p1', 'alice')));
    const db = as('bob');
    const batch = writeBatch(db);
    batch.set(doc(db, 'posts', 'p1', 'reactions', 'bob_love'), {
      id: 'bob_love', postId: 'p1', userUid: 'bob', type: 'love', createdAt: serverTimestamp(),
    });
    batch.update(doc(db, 'posts', 'p1'), {
      'reactionCounts.love': increment(1), updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
  });

  // The last branch in the rules is the easiest place for Firestore's
  // expression-evaluation cap to cause a false denial, so cover every type.
  for (const type of ['understand', 'love', 'not_alone', 'stay_strong', 'thank_you'] as const) {
    it(`allows an atomic ${type} reaction add`, async () => {
      await seed(async (db) => setDoc(doc(db, 'posts', 'p1'), post('p1', 'alice')));
      const db = as('bob');
      const batch = writeBatch(db);
      batch.set(doc(db, 'posts', 'p1', 'reactions', `bob_${type}`), {
        id: `bob_${type}`, postId: 'p1', userUid: 'bob', type, createdAt: serverTimestamp(),
      });
      batch.update(doc(db, 'posts', 'p1'), {
        reactionCounts: { ...zeroCounts, [type]: 1 }, updatedAt: serverTimestamp(),
      });
      await assertSucceeds(batch.commit());
    });

    it(`allows an atomic ${type} reaction removal`, async () => {
      await seed(async (db) => {
        await setDoc(doc(db, 'posts', 'p1'), post('p1', 'alice', {
          reactionCounts: { ...zeroCounts, [type]: 1 },
        }));
        await setDoc(doc(db, 'posts', 'p1', 'reactions', `bob_${type}`), {
          id: `bob_${type}`, postId: 'p1', userUid: 'bob', type, createdAt: now(),
        });
      });
      const db = as('bob');
      const batch = writeBatch(db);
      batch.delete(doc(db, 'posts', 'p1', 'reactions', `bob_${type}`));
      batch.update(doc(db, 'posts', 'p1'), {
        reactionCounts: { ...zeroCounts }, updatedAt: serverTimestamp(),
      });
      await assertSucceeds(batch.commit());
    });
  }

  it('denies arbitrary comments count inflation', async () => {
    await seed(async (db) => setDoc(doc(db, 'posts', 'p1'), post('p1', 'alice')));
    const db = as('bob');
    await assertFails(updateDoc(doc(db, 'posts', 'p1'), {
      commentsCount: 999, updatedAt: serverTimestamp(),
    }));
  });

  it('denies arbitrary community member count inflation', async () => {
    await seed(async (db) => setDoc(doc(db, 'communities', 'c1'), community('c1')));
    const db = as('bob');
    await assertFails(updateDoc(doc(db, 'communities', 'c1'), { memberCount: 999 }));
  });

  it('allows a join when the membership doc is written in the same batch', async () => {
    await seed(async (db) => setDoc(doc(db, 'communities', 'c1'), community('c1')));
    const db = as('bob');
    const batch = writeBatch(db);
    batch.set(doc(db, 'community_members', 'c1_bob'), {
      id: 'c1_bob', communityId: 'c1', userUid: 'bob', joinedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'communities', 'c1'), { memberCount: 1 });
    await assertSucceeds(batch.commit());
  });

  it('denies arbitrary follower count inflation', async () => {
    await seed(async (db) => setDoc(doc(db, 'users_public', 'alice'), publicUser('alice')));
    const db = as('bob');
    await assertFails(updateDoc(doc(db, 'users_public', 'alice'), {
      followersCount: 999, updatedAt: serverTimestamp(),
    }));
  });

  it('allows a follow when the follow doc is written in the same batch', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'users_public', 'alice'), publicUser('alice'));
      await setDoc(doc(db, 'users_public', 'bob'), publicUser('bob'));
    });
    const db = as('bob');
    const batch = writeBatch(db);
    batch.set(doc(db, 'follows', 'bob_alice'), {
      id: 'bob_alice', followerUid: 'bob', followingUid: 'alice', createdAt: serverTimestamp(),
    });
    batch.update(doc(db, 'users_public', 'bob'), {
      followingCount: 1, updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'users_public', 'alice'), {
      followersCount: 1, updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
  });
});

describe('additional collection ownership', () => {
  it('lets an author list their own private posts but not another user\'s', async () => {
    await seed(async (db) => setDoc(doc(db, 'posts', 'p1'), post('p1', 'alice', { visibility: 'private' })));
    await assertSucceeds(getDocs(query(collection(as('alice'), 'posts'), where('authorUid', '==', 'alice'))));
    await assertFails(getDocs(query(collection(as('bob'), 'posts'), where('authorUid', '==', 'alice'))));
  });

  it('denies reading another user\'s notification', async () => {
    await seed(async (db) => setDoc(doc(db, 'notifications', 'n1'), {
      id: 'n1', recipientUid: 'alice', actorUid: 'bob', actorName: 'Bob',
      type: 'comment', postId: 'p1', message: 'hello', isRead: false, createdAt: now(),
    }));
    await assertFails(getDoc(doc(as('bob'), 'notifications', 'n1')));
    await assertSucceeds(getDoc(doc(as('alice'), 'notifications', 'n1')));
  });

  it('denies listing another user\'s saved posts', async () => {
    await seed(async (db) => setDoc(doc(db, 'saved_posts', 'alice_p1'), {
      id: 'alice_p1', userUid: 'alice', postId: 'p1', createdAt: now(),
    }));
    await assertFails(getDocs(query(collection(as('bob'), 'saved_posts'), where('userUid', '==', 'alice'))));
  });

  it('denies creating a block on behalf of another user', async () => {
    const db = as('bob');
    await assertFails(setDoc(doc(db, 'blocked_users', 'alice_bob_block'), {
      id: 'alice_bob_block', blockerUid: 'alice', blockedUid: 'bob', mode: 'block', createdAt: serverTimestamp(),
    }));
  });
});

describe('post drafts', () => {
  it('lets the owner create, read, update and delete their draft', async () => {
    const db = as('alice');
    await assertSucceeds(setDoc(doc(db, 'post_drafts', 'd1'), {
      ...draft('d1', 'alice'), createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    }));
    await assertSucceeds(getDoc(doc(db, 'post_drafts', 'd1')));
    await assertSucceeds(updateDoc(doc(db, 'post_drafts', 'd1'), {
      content: 'Edited while still private', updatedAt: serverTimestamp(),
    }));
    await assertSucceeds(deleteDoc(doc(db, 'post_drafts', 'd1')));
  });

  it('denies creating a draft for another user', async () => {
    const db = as('bob');
    await assertFails(setDoc(doc(db, 'post_drafts', 'd2'), {
      ...draft('d2', 'alice'), createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    }));
  });

  it('denies reading, listing, updating or deleting another user\'s draft', async () => {
    await seed(async (db) => setDoc(doc(db, 'post_drafts', 'd3'), {
      ...draft('d3', 'alice'), scheduledFor: Timestamp.fromDate(new Date(Date.now() + 86_400_000)),
    }));
    const db = as('bob');
    await assertFails(getDoc(doc(db, 'post_drafts', 'd3')));
    await assertFails(getDocs(query(collection(db, 'post_drafts'), where('ownerUid', '==', 'alice'))));
    await assertFails(updateDoc(doc(db, 'post_drafts', 'd3'), {
      content: 'tampered', updatedAt: serverTimestamp(),
    }));
    await assertFails(deleteDoc(doc(db, 'post_drafts', 'd3')));
  });

  it('denies a non-timestamp scheduledFor value', async () => {
    const db = as('alice');
    await assertFails(setDoc(doc(db, 'post_drafts', 'd4'), {
      ...draft('d4', 'alice', { scheduledFor: 'tomorrow' }),
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    }));
  });
});

const DAY_MS = 24 * 60 * 60 * 1000;
const resonanceExpiry = () => Timestamp.fromDate(new Date(Date.now() + DAY_MS));
// Stay just inside the rule's live window so the range query is narrower than
// the rule, which is what Firestore requires for list rules on resource.data.
const resonanceCutoff = () => Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000));

function resonanceCheckIn(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    emotion: 'anxious',
    createdAt: serverTimestamp(),
    expiresAt: resonanceExpiry(),
    ...extra,
  };
}

function resonanceCare(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    emotion: 'anxious',
    message: 'You are not alone in this tonight.',
    createdAt: serverTimestamp(),
    expiresAt: resonanceExpiry(),
    ...extra,
  };
}

describe('resonance', () => {
  it('lets a signed-in person check in and read their check-in back', async () => {
    const db = as('alice');
    await assertSucceeds(setDoc(doc(db, 'resonances', 'r1'), resonanceCheckIn('r1')));
    await assertSucceeds(getDoc(doc(db, 'resonances', 'r1')));
    const snapshot = await getDocs(
      query(collection(db, 'resonances'), where('expiresAt', '>', resonanceCutoff()))
    );
    if (snapshot.size !== 1) throw new Error(`expected 1 live check-in, got ${snapshot.size}`);
  });

  it('denies signed-out check-ins and care notes', async () => {
    const db = modular(testEnv.unauthenticatedContext().firestore());
    await assertFails(setDoc(doc(db, 'resonances', 'r2'), resonanceCheckIn('r2')));
    await assertFails(setDoc(doc(db, 'resonance_care', 'c2'), resonanceCare('c2')));
  });

  it('denies identity fields and unknown emotions on a check-in', async () => {
    const db = as('alice');
    await assertFails(setDoc(doc(db, 'resonances', 'r3'), resonanceCheckIn('r3', { uid: 'alice' })));
    await assertFails(setDoc(doc(db, 'resonances', 'r4'), resonanceCheckIn('r4', { emotion: 'furious' })));
    await assertFails(setDoc(doc(db, 'resonances', 'r5'), resonanceCheckIn('r5', { emotion: '' })));
  });

  it('denies a client-supplied timestamp or an overlong lifetime', async () => {
    const db = as('alice');
    await assertFails(setDoc(doc(db, 'resonances', 'r6'), resonanceCheckIn('r6', { createdAt: now() })));
    await assertFails(setDoc(doc(db, 'resonances', 'r6b'), resonanceCheckIn('r6b', {
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 48 * 60 * 60 * 1000)),
    })));
    await assertFails(setDoc(doc(db, 'resonances', 'r6c'), resonanceCheckIn('r6c', {
      expiresAt: Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000)),
    })));
  });

  it('hides check-ins from reads and lists once they are 24h old', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'resonances', 'stale'), {
        id: 'stale',
        emotion: 'sad',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 25 * 60 * 60 * 1000)),
        expiresAt: Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000)),
      });
      await setDoc(doc(db, 'resonances', 'fresh'), {
        id: 'fresh',
        emotion: 'sad',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000)),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 23 * 60 * 60 * 1000)),
      });
    });
    const db = as('bob');
    await assertFails(getDoc(doc(db, 'resonances', 'stale')));
    await assertSucceeds(getDoc(doc(db, 'resonances', 'fresh')));
    const snapshot = await getDocs(
      query(collection(db, 'resonances'), where('expiresAt', '>', resonanceCutoff()))
    );
    if (snapshot.size !== 1 || snapshot.docs[0].id !== 'fresh') {
      throw new Error('expected only the fresh check-in in the live query');
    }
  });

  it('lets someone share one supportive line and validates its length', async () => {
    const db = as('bob');
    await assertSucceeds(setDoc(doc(db, 'resonance_care', 'c1'), resonanceCare('c1')));
    await assertFails(setDoc(doc(db, 'resonance_care', 'c2'), resonanceCare('c2', { message: '' })));
    await assertFails(setDoc(doc(db, 'resonance_care', 'c3'), resonanceCare('c3', { message: 'x'.repeat(281) })));
    await assertFails(setDoc(doc(db, 'resonance_care', 'c4'), resonanceCare('c4', { message: 'care', uid: 'bob' })));
  });

  it('hides care notes once they are 24h old', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'resonance_care', 'stale'), {
        id: 'stale',
        emotion: 'sad',
        message: 'A note from yesterday.',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 25 * 60 * 60 * 1000)),
        expiresAt: Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000)),
      });
    });
    await assertFails(getDoc(doc(as('bob'), 'resonance_care', 'stale')));
  });

  it('denies updating or deleting resonance content as a regular member', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'resonances', 'r7'), {
        id: 'r7', emotion: 'sad', createdAt: now(), expiresAt: resonanceExpiry(),
      });
    });
    const db = as('alice');
    await assertFails(updateDoc(doc(db, 'resonances', 'r7'), { emotion: 'happy' }));
    await assertFails(deleteDoc(doc(db, 'resonances', 'r7')));
  });

  it('lets an admin clear resonance content', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'resonances', 'r8'), {
        id: 'r8', emotion: 'sad', createdAt: now(), expiresAt: resonanceExpiry(),
      });
      await setDoc(doc(db, 'admins', 'root'), { grantedAt: now(), grantedBy: 'test' });
    });
    const db = as('root', { email: 'root@example.com', email_verified: true });
    await assertSucceeds(deleteDoc(doc(db, 'resonances', 'r8')));
  });
});
