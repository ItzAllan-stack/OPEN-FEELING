# Firestore rules tests

Run from the repository root:

```bash
npm run test:rules
```

Requirements:

- Java 11+ (needed by the Firestore emulator)
- Firebase CLI on `PATH` (`npm install -g firebase-tools`)

`npm run test:rules` starts the emulator with `firebase emulators:exec`, loads
`firestore.rules`, then runs `tests/firestore.rules.test.ts` through Node's test
runner. The suite covers the 12 adversarial cases in `security_spec.md` plus
aggregate-counter integrity checks.
