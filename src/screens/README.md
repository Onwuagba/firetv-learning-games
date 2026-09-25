# screens (to build)

Fork `react-native-multi-tv-app-sample` (listed on the hackathon Resources page), then add:

- `HomeScreen` — three large focusable tiles: Abacus, Map Quiz, Balance Scales. Locked tiles show a padlock (parent unlock).
- `AbacusScreen` — renders `games/abacus.ts` state; map TV remote events (`useTVEventHandler`) to `press()`.
- `QuizScreen` — renders `makeQuestion()`; 4 focusable choices in a 2x2 grid.
- `BalanceScreen` — algebra as a see-saw that tilts until x is right.

Focus rules: every screen has one obvious default focus, a visible 4px focus ring, and BACK always returns home.
