# OPEN FEELING

Express Freely. Feel Lighter. A welcoming digital space to share emotions, keep a
private journal, and connect with people who understand.

## Stack

React 19 + Vite 8, TypeScript, Tailwind CSS v4, Firebase (Auth + Firestore), Framer Motion.

## Setup

- Node.js 24 (the Firestore rules test package requires at least 24.12) and npm
- `npm ci`
- `npm run dev` — starts the app at http://localhost:3000

Firebase configuration lives in `firebase-applet-config.json`. Copy `.env.example`
to `.env` if your local setup needs environment variables.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | TypeScript typecheck (`tsc --noEmit`) |
| `npm run clean` | Remove `dist/` and `server.js` |
| `npm run test:rules` | Firestore rules tests against the emulator |

## Firestore rules and tests

`firestore.rules` is the source of truth for data access; `security_spec.md`
documents the invariants and adversarial cases. Deploy rules with
`firebase deploy --only firestore:rules` using the Firebase CLI.

`npm run test:rules` starts the Firestore emulator and runs the suite in
`tests/`. It requires Java 11+ and the Firebase CLI on `PATH`; see
`tests/README.md` for details.

## CI

`.github/workflows/ci.yml` runs the typecheck, dependency audit, build, and
Firestore rules tests on every push and pull request.
