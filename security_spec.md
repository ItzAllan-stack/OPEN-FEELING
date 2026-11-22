# OPEN FELLING — Firestore Security Specification

## 1. Data Invariants
1. **Anonymous Post Identity Isolation**: An anonymous post (`visibility == 'anonymous'`) must NEVER store the real `authorUid` or `authorUsername` on `/posts/{postId}`. Ownership is isolated in `/post_ownership/{postId}` readable only by the true owner (`ownerUid == request.auth.uid`) or verified admin (`isAdmin()`).
2. **Private Post & Personal Journal Isolation**: Private posts (`visibility == 'private'`) can only be read or listed by their `authorUid == request.auth.uid` or `isAdmin()`. Entries in `/private_journals/{entryId}` ("My Personal Space") can strictly ONLY be accessed by `userUid == request.auth.uid`.
3. **PII Isolation**: User email, role, suspension flag, and notification settings live exclusively in `/users_private/{uid}` and are readable only by the owner or admin.
4. **Privilege Escalation Prevention**: Users cannot assign themselves `role: 'admin'`, `role: 'moderator'`, or `isSuspended: false` updates on `/users_private/{uid}`.
5. **Temporal & Immutable Integrity**: `createdAt` and owner UIDs are immutable after creation; `createdAt`/`updatedAt` must match `request.time`.

## 2. Dirty Dozen Adversarial Payloads
1. **Shadow Admin Escalation**: Creating `/users_private/attacker` with `role: "admin"` -> DENIED.
2. **Shadow Field Injection on Post**: Creating `/posts/p1` with extra `isFeatured: true` -> DENIED (`hasOnly` check).
3. **Anonymous Identity Spoof**: Creating `/posts/p2` with `visibility: "anonymous"` and `authorUid: "victim_uid"` (not `'anonymous'`) -> DENIED.
4. **Orphaned Anonymous Post**: Creating `/posts/p3` with `visibility: "anonymous"` without an atomic `/post_ownership/p3` write -> DENIED (`getAfter` check).
5. **Private Journal Snooping**: Listing `/private_journals` without `where('userUid', '==', auth.uid)` -> DENIED.
6. **Cross-User Post Edit**: Updating `content` on another user's post -> DENIED.
7. **ID Poisoning**: Creating `/posts/<1500-char-string>` -> DENIED (`isValidId` <= 128 chars).
8. **Email Spoofing**: Admin access with `email == "mroy4957@gmail.com"` when `email_verified == false` -> DENIED.
9. **Blanket User PII Read**: Calling `get(/users_private/otherUid)` as non-owner -> DENIED.
10. **Reaction Impersonation**: Creating `/posts/p1/reactions/victim_love` with `userUid: "victim"` -> DENIED.
11. **Report Tampering**: Non-admin updating `reports/r1` status to `"dismissed"` -> DENIED.
12. **Client Timestamp Forgery**: Creating `/posts/p4` with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` -> DENIED.
