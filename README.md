# Fire TV Learning Games

Amazon Developer Hackathon 2026 — **Fire TV track**. Three remote-friendly learning games for
kids on the shared curriculum: a D-pad abacus, a countries and capitals quiz, and algebra balance
scales. Progress syncs with the Alexa+ Learning Coach, so practice by voice shows up on the TV.

## What's here

- `src/curriculum.ts` + `.json`: shared questions, 4 choices so a remote is enough.
- `src/games/`: pure, tested logic: `abacus.ts`, `quiz.ts` (map quiz), `balance.ts` (algebra scales).
- `src/focus/grid.ts`: spatial D-pad focus manager. `src/nav.ts`: screen stack, BACK returns home.
- `src/progress/`: `ProgressSync` (offline queue) over a pluggable `ProgressApiClient`; `MockProgressClient` is the default, `HttpProgressClient` is a skeleton (paths TODO-verify).
- `src/ui/` + `preview/`: React web preview of all screens (TV-safe area, large type, focus rings). Keyboard: arrows, Enter=OK, Esc/Backspace=Back.
- `docs/video-script.md`, `docs/amazon-feedback.md`: drafts.

```bash
npm install
npm test          # logic tests
npm run typecheck
npm run preview   # builds preview/bundle.js and serves http://localhost:5173
```

## Status

The web preview is NOT the Fire TV app. It has not been run on the Fire TV emulator or a device. The screens are
React DOM; porting to React Native for TV (react-native-tvos, sample app fork) means re-rendering the same state
modules with RN primitives and mapping `useTVEventHandler` events to `src/ui/keys.ts` (TODO-verify event names).

License: MIT
