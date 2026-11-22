#!/usr/bin/env node
/**
 * Grant admin rights by writing the admins/{uid} registry document.
 *
 * firestore.rules derives admin rights exclusively from the admins
 * collection (see isAdmin()), and the document's fields are never read -
 * only its existence matters. This script is the supported way to grant
 * (or pre-provision) an admin.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *   node scripts/grant-admin.mjs user@example.com
 *   node scripts/grant-admin.mjs <uid>
 *   node scripts/grant-admin.mjs <uid> --project <projectId>
 *
 * To revoke admin rights, delete the admins/{uid} document in the Firebase
 * console (or via Admin SDK) - revocation is intentionally manual so it is
 * deliberate and auditable.
 */
import { readFileSync } from 'node:fs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const args = process.argv.slice(2);
const projectFlagIndex = args.indexOf('--project');
const projectFromFlag = projectFlagIndex >= 0 ? args[projectFlagIndex + 1] : undefined;
const target = args.find((a, i) => a !== '--project' && (projectFlagIndex < 0 || i !== projectFlagIndex + 1));

if (!target || args.includes('--help')) {
  console.log('Usage: node scripts/grant-admin.mjs <uid-or-email> [--project <projectId>]');
  process.exit(target ? 0 : 1);
}

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
  throw new Error('Unable to detect project id. Pass --project <id> or set GCLOUD_PROJECT.');
}

initializeApp({ credential: applicationDefault(), projectId: detectProjectId() });
const auth = getAuth();
const db = getFirestore();

const userRecord = target.includes('@')
  ? await auth.getUserByEmail(target)
  : await auth.getUser(target);

if (!userRecord.emailVerified) {
  console.warn(`Warning: ${userRecord.email ?? target} does not have a verified email. The rules require email_verified == true for admin operations.`);
}

await db.collection('admins').doc(userRecord.uid).set(
  {
    email: userRecord.email ?? '',
    grantedAt: FieldValue.serverTimestamp(),
    grantedBy: 'scripts/grant-admin.mjs',
  },
  { merge: true }
);

console.log(`Admin granted to ${userRecord.email ?? ''} (uid: ${userRecord.uid}).`);
console.log('The admins registry takes effect immediately - no rules redeploy required for this account (isAdmin() reads the registry at request time).');
