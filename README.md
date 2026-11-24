# OPEN-FEELING

**Express freely. Feel lighter.**

OPEN FEELING is a welcoming digital space for sharing emotions, writing privately, and connecting with people who understand. It is built as a client-side React app with Firebase for authentication and data storage, with Firestore security rules as the source of truth for access control.

## Features

- **Expressive posts** — Share feelings with emotion tags, visibility controls (public/anonymous/private), communities, and optional media.
- **Explore & feed** — Browse stories, filter by emotion, and discover what others are sharing.
- **Communities** — Join supportive spaces around shared experiences.
- **Reactions & comments** — Respond with meaningful reactions and thoughtful comments.
- **Private journal** — Keep personal entries, drafts, and reflections in your own space.
- **Letters to your future self** — Write scheduled letters for later.
- **Resonance check-ins** — Lightweight emotional check-ins and supportive care notes.
- **Year in review** — A gentle recap of your writing and emotional patterns over the year.
- **Notifications** — Stay updated on reactions, comments, follows, and community activity.
- **Profiles & privacy** — Edit your profile, manage saved posts, privacy settings, and account preferences.
- **Moderation & safety** — Community guidelines, reporting/moderation flows, and admin-gated moderation tools.
- **Accessible, calm UI** — Responsive layout, keyboard shortcuts, reduced-motion support, and contrast-conscious styling.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build | [Vite 8](https://vite.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Backend services | [Firebase Auth](https://firebase.google.com/docs/auth) + [Cloud Firestore](https://firebase.google.com/docs/firestore) |
| Icons | [Lucide React](https://lucide.dev/) |
| Testing | Firestore Emulator + `@firebase/rules-unit-testing` + Node test runner |

## Project Structure

```text
.
├── .github/workflows/       # CI and audit workflows
├── public/                  # Static assets
├── scripts/                 # Maintenance/admin scripts
├── src/
│   ├── components/          # Reusable UI components
│   ├── constants/           # Emotion/reaction/prompt constants
│   ├── context/             # App context and shared state
│   ├── data/                # Starter/sample data
│   ├── lib/                 # Firebase/features setup
│   ├── pages/               # Route-level pages
│   ├── services/            # Firestore/service layer
│   ├── types/               # Shared TypeScript types
│   ├── utils/               # Utility helpers
│   ├── App.tsx              # App shell and routing
│   ├── index.css            # Global styles/tokens
│   └── main.tsx             # Entry point
├── tests/                   # Firestore rules tests
├── firebase-applet-config.json
├── firestore.rules          # Firestore security rules
├── security_spec.md         # Security invariants and cases
└── package.json
```

## Getting Started

### Prerequisites

- **Node.js** >= 24.12.0 (required by the Firestore rules test tooling)
- **npm** >= 10
- **Java 11+** and **Firebase CLI** on `PATH` only if you want to run Firestore rules tests locally

### Installation

```bash
npm ci
```

### Local development

```bash
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000).

### Environment variables

Firebase web configuration lives in `firebase-applet-config.json`. The Firebase `apiKey` is a client identifier, not a secret; access control is enforced by `firestore.rules`.

Copy `.env.example` to `.env.local` only if you need local overrides:

```bash
cp .env.example .env.local
```

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_RECAPTCHA_SITE_KEY` | Optional Firebase App Check (reCAPTCHA v3) site key. | unset |
| `VITE_ENABLE_SAMPLE_CONTENT` | Show starter/sample content when the database is empty. Intended for local development only. | `false` in example / production-safe behavior |
| `VITE_ENABLE_STARTER_SEED` | Allow starter-community seeding from a client session. Use deliberately in development only. | `false` |

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | TypeScript typecheck (`tsc --noEmit`) |
| `npm run lint:eslint` | Run ESLint |
| `npm run clean` | Remove `dist/` and `server.js` |
| `npm run test:rules` | Run Firestore rules tests against the emulator |
| `npm run backfill:counters` | Dry-run recount of aggregate counters (`--apply` to write) |
| `npm run grant-admin` | Grant admin access to a user by email |

## Firebase, Security, and Data

### Firestore rules

`firestore.rules` is the source of truth for data access. `security_spec.md` documents the invariants and adversarial cases.

Deploy rules with:

```bash
firebase deploy --only firestore:rules
```

### Firestore rules tests

Rules tests live in `tests/` and run against the Firestore emulator:

```bash
npm run test:rules
```

Requirements:
- Java 11+
- Firebase CLI available on `PATH`

See [`tests/README.md`](./tests/README.md) for details.

### App Check

The Firebase web SDK can attach App Check attestation tokens (reCAPTCHA v3) to requests.

1. Create/register a reCAPTCHA v3 key in Firebase Console > App Check.
2. Set `VITE_RECAPTCHA_SITE_KEY` in `.env.local` and your hosting environment.
3. Enable App Check **enforcement** for Cloud Firestore in Firebase Console.
4. Monitor App Check metrics before tightening further.

> App Check initialization alone does not block abuse; enforcement does. Per-user write quotas/rate limits are not fully enforceable in Firestore security rules alone; hard rate limiting requires a backend/service-side control.

### Admin access

Admin rights derive from the `admins/{uid}` registry in Firestore (mirroring `firestore.rules`). Email claims do not grant privileges.

Grant admin access:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
npm run grant-admin -- user@example.com
```

To revoke access, delete the corresponding `admins/{uid}` document in Firebase Console.

> Before deploying rules changes that remove any legacy bootstrap admin path, ensure at least one `admins/{uid}` document exists and that you can sign in with that account.

### Counter maintenance

Aggregate counters (`reactionCounts`, `commentsCount`, `followersCount`, `followingCount`, `memberCount`) are maintained with `FieldValue.increment()` and bounded by security rules. Older data may contain drift.

Repair drift with the Admin SDK script:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
npm run backfill:counters            # dry run: prints drift, writes nothing
npm run backfill:counters -- --apply # write corrections
```

The script is idempotent, bypasses security rules by design, and never deletes documents. Review the dry-run output before applying changes.

## Offline Developer Utilities

The deployed app remains React + Firebase. Python and Java are used for local maintenance checks only; neither adds a backend service or runs in the user-facing app.

### Python: validate a journal export

Run this locally against a Markdown export from My Personal Space:

```bash
python tools/python/check_journal_export.py path/to/open-feeling-journal.md
```

The validator checks the export header, entry date headings, and basic structure. It does not print or upload journal text. Run its tests with:

```bash
python -m unittest discover -s tools/python -p 'test_*.py'
```

### Java: check repository essentials

With Java 21 or newer:

```bash
mkdir -p /tmp/open-feeling-check
javac -d /tmp/open-feeling-check tools/java/ProjectHealthCheck.java
java -cp /tmp/open-feeling-check ProjectHealthCheck .
```

This checks that core project files exist, Firestore retains its default-deny rule, and pull requests trigger CI. It does not access Firebase or require credentials.

Both utilities run in GitHub Actions as part of the pull request checks.

## Sample Content & Seeding

Starter posts/communities are intended to make a fresh local environment feel alive. In production builds, sample fallback is disabled so an empty database renders real empty states, not fake posts.

- Local development can opt into sample content via `VITE_ENABLE_SAMPLE_CONTENT`.
- Starter community seeding runs only when `VITE_ENABLE_STARTER_SEED=true`.
- Keep both disabled in production unless you intentionally need a controlled bootstrap flow.

## CI

GitHub Actions workflows live in `.github/workflows/`:

- **`ci.yml`** — Runs typecheck, build, and Firestore rules tests on pushes to `main` and pull requests.
- **`audit.yml`** — Runs dependency audits weekly and on demand (`npm audit --audit-level=high`).

## Contributing

1. Create a branch for your change.
2. Keep changes focused and consistent with existing patterns.
3. Run checks before opening a PR:

```bash
npm run lint
npm run build
npm run test:rules   # requires Java + Firebase CLI
```

4. For security-sensitive changes, update `firestore.rules`, tests, and `security_spec.md` together.

## Notes

- This repository contains client-side Firebase configuration intended for public web apps; secrets should not be committed.
- Deployment is configured for Vite static output (`dist/`) and includes `vercel.json` for hosting rewrites.
- For project-specific operational details, also see [`security_spec.md`](./security_spec.md) and [`tests/README.md`](./tests/README.md).
