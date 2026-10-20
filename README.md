# Learn & Play: Fire TV learning games

Amazon Developer Hackathon 2026, **Fire TV track**. A living-room learning product for children on the shared curriculum
(abacus, algebra balance scales, countries and capitals), driven entirely by the Fire TV remote (D-pad, OK, Back).
Progress syncs with the Alexa+ Learning Coach, so practice by voice shows up on the TV.

`app/` is the real app: Expo + React Native for TV (`react-native-tvos` 0.81), started from Amazon's
[react-native-multi-tv-app-sample](https://github.com/AmazonAppDev/react-native-multi-tv-app-sample) (MIT-0, see `NOTICE`).
The product tour below is captured on the **web target** (headless Chrome, arrow keys only). The native Android build has also
been built with Gradle and **run on an Android TV emulator** (Android 13, API 33, x86), driven with remote key presses. It has
**not** been run on a Fire TV device or in Amazon's Fire OS image, see "Verified vs not verified".

## Product tour (screenshots in `docs/screenshots/`, all captured by `npm run screenshots`)

| Feature | What it does | Screenshot |
|---|---|---|
| Who's playing | Up to 6 players with avatars; per-player progress, streak, stars, badges. Coach child id = player name slug, so Alexa+ practice lands on the same profile. Names are typed with an on-screen D-pad keyboard. | `01`..`04`, `35` |
| Illustrated Home | Twilight hero scene, greeting, streak and star counters, mute toggle, Daily challenge banner, one tile per curriculum topic, My progress / Level map / Settings. | `04`, `05`, `25` |
| Abacus | On-screen beads; sums from the curriculum plus a **target mode** ("Make 47", place value only) on odd rounds from level 2. Rods and max value follow each level's `max`. | `06`..`12` |
| Balance scales | Beam eases to the new tilt; the puzzle is **only solved when you press OK = Check** on a balanced scale (a miss breaks the streak). Left/Right jump by 5 on the x-up-to-50 level. From the top level, harder **x on both sides** puzzles (`5x + 3 = 2x + 18`) alternate in. | `14`..`18` |
| Map / capitals / flags | Four question modes: capital, continent, "which country is highlighted", **flag** (emoji). Map has **region focus** and a Zoom button (World / Region / Close-up); a wrong answer auto-zooms to the answer. | `19`..`24` |
| Daily challenge | 6 mixed questions across all topics, seeded by date + child (same set all day), gives a "Daily hero" badge. | `25`..`28` |
| Rounds and results | Every game is a 5-question round ending in stars (3/2/1), score, level-up, new badges and day streak, with confetti. | `13`, `28` |
| Progress dashboard, level map | Per-topic level bars and accuracy from coach-synced progress, streak days, stars, badges (14 now; 2 more per topic and "Explorer" are generated from the curriculum). Level map is a path of stops per topic. | `29`, `30` |
| Parent gate, settings | Settings and player management sit behind a multiplication gate (two wrong answers lock it for 15 s). Settings: sound, music, reduced motion, coach server URL (on-screen keyboard), sync now with status and last-sync time. | `31`..`34` |
| Sound | Small synthesised effects (move, select, correct, wrong, level-up, star, back) and an optional music loop, behind toggles (music off by default). | n/a |

Design system: one focus treatment everywhere (spring scale-up, glow halo, yellow ring), 10-foot type scale (nothing a child must read is under 28 px at 1080p), 5% title-safe margins, a hint bar on every screen, one colour per topic.

## Curriculum-driven

The UI is generated from `src/curriculum.json` (`playableTopics()`, `levelSpec()`, `maxLevel()`, `gameFor()` in `src/curriculum.ts`), so
adding topics or levels needs no UI change:
- Home tiles, dashboard rows, level map, badges (`level2-<topic>`, `master-<topic>`) and the daily mix all iterate the topics.
- A topic is routed to a screen by the shape of its level `kind`s: count/add/subtract -> Abacus, x_plus_a/a_times_x/a_times_x_plus_b -> Balance, continent/capital -> Map Quiz; any other known-kind topic -> generic multiple-choice. A topic that uses a `kind` this build cannot generate is **hidden, not crashed on** (`KNOWN_KINDS`).
- More countries automatically appear in geography questions (flags need an entry in `src/flags.ts`; map highlight needs a Natural Earth 110m polygon, see `test/product.test.ts` which warns on gaps; the quiz still works without it).
- Tiles wrap into rows when there are more than 4 topics.

## Architecture

- Pure, tested logic in `src/` (no React): `curriculum`, `games/{abacus,balance,quiz,geo,round}`, `mapview` (camera maths), `flags`, `profiles`, `nameEntry` (on-screen keyboard), `settings`, `gate`, `motivation` (streaks, stars, badges, dashboard rows), `daily`, `appStore` (offline-first device state), `progress/*` (coach sync), `nav`, `rng`.
- App in `app/src/`: `AppRoot` (nav, forced profile picker, error boundary per screen, reduced-motion provider), `session.ts` (one `ProgressSync` per child + server URL), `screens/*`, `components/*`, `motion.tsx`, `audio.ts`.
- Offline-first: profiles, settings, stats and each child's progress + unsent answers are saved to AsyncStorage on every change; corrupt storage falls back to defaults; the corner badge shows `Saved on this TV` / `Syncing...` / `Synced with coach` / `Offline: will sync later (n)`; Settings shows queue size and last sync.
- Errors and states: an `ErrorBoundary` per screen ("Back to start", progress kept), a loading screen while local data loads, empty states for no players / no games.
- Accessibility: every focusable has an `accessibilityLabel` (and hint where useful), live regions announce questions and verdicts, `accessibilityRole` set. Not tested with TalkBack / VoiceView.
- Reduced motion: Settings > Reduced motion (Auto follows the system setting: web media query, Android accessibility setting). Off = no springs, slides, confetti or beam easing.
- Performance choices (unmeasured on device): the 177 land paths are drawn once (`React.memo`) and only the highlight and `viewBox` change per question; animations use the native driver off-web; the hero scene, topic art and rods are memoised; confetti is 24 views for 1.9 s; one audio player per effect, created lazily.

## Run

```bash
npm install && npm test && npm run typecheck        # 40 logic tests, tsc for src/ and test/
npm run app:install && npm run app:typecheck        # app deps (--legacy-peer-deps) and tsc for app/
npm run app:web                                     # http://localhost:8082, keyboard = remote (arrows, Enter/Space = OK, Esc/Backspace = Back)
npm run screenshots                                 # exports the web build, drives it with arrow keys in headless Chrome, writes docs/screenshots/
npm run gen:audio                                   # regenerates app/assets/audio/*.wav (pure synthesis)
```
`npm run screenshots` needs Chrome (`CHROME=/path` or auto-detected from `~/.cache/puppeteer` / `/Applications`) and `puppeteer-core` (dev dependency). Add `?debug=1&seed=N` to the web URL to expose the current answer as `globalThis.__lp` and make questions deterministic (used by the script only).

### Fire TV / Android TV (built and run on an Android TV emulator; not on Fire OS)

Requirements: JDK 17, Android SDK (platform 36), a Fire TV or Android TV emulator/device with ADB.
```bash
cd app && npm install --legacy-peer-deps
EXPO_TV=1 npx expo prebuild --clean --platform android
EXPO_TV=1 npx expo run:android     # Gradle debug build; Metro serves the JS (adb reverse tcp:8081 tcp:8081)
# Fire TV over the network:  adb connect <fire-tv-ip>:5555
```

## Sound

`expo-audio` (~1.1.1, the SDK 54 audio module; `expo-av` is deprecated) installed with `expo install`, plugin configured with `microphonePermission: false` and `RECORD_AUDIO` blocked in `app.json` (no mic permission in a kids app; verified in the `expo prebuild --platform android` manifest, which also still has the leanback launcher category). Verified: it bundles in the web export and the app runs without errors in headless Chrome. **Not verified:** that it plays on Fire OS, latency, or how the music sounds (headless run has no audio output). All audio is synthesised by `scripts/gen-audio.mjs` (about 550 KB total, music loop 384 KB), so there is nothing to license.

## Connect to the Alexa+ Learning Coach

Either set the server in **Settings > Coach server** (stored on the TV) or at build time:
```bash
EXPO_PUBLIC_COACH_URL=http://127.0.0.1:8000 EXPO_PUBLIC_TV_TOKEN=<coach TV_API_TOKEN> EXPO_PUBLIC_CHILD=ada npm run app:web
```
- `EXPO_PUBLIC_COACH_URL` is only the default for the Settings value; `EXPO_PUBLIC_CHILD` (optional) seeds a first player, otherwise the app starts on "Welcome" and the parent makes players. Use the same name in Alexa+ (child id = lowercase slug).
- Contract (defined in the coach repo, `learning_coach/tvapi.py`): `GET /api/progress/{child}`, `POST /api/progress/{child}/events` with `{events:[{id,topic,correct,at}]}`, bearer `TV_API_TOKEN`. Events carry ids so retries are not double counted; the TV cannot set levels or unlock topics. The coach decides levels; the app applies the same 2-in-a-row rule optimistically until the next sync (polls every 8 s).
- The token is baked into the bundle (anyone with the bundle can read it). Use HTTPS beyond localhost; on a real Fire TV use the LAN/HTTPS address, not 127.0.0.1 (Android may block cleartext http, TODO-verify).
- `npm test` includes an integration test that starts the real coach from `../alexa-learning-coach/.venv` (skipped if absent).
- `docs/screenshots/coach-sync-*-legacy-ui.png` were captured against a running coach **before the redesign** (old UI); they show the sync behaviour, not the current look.

## Tests

`npm test` (40 tests, about 20 s): curriculum validity, game logic, focus grid, nav, sync and HTTP client (`test/logic.test.ts`, `games.test.ts`, `abacus-level.test.ts`, `coach-integration.test.ts`), and `test/product.test.ts` for everything added for the product: rng, geo question modes, flags, map camera, rounds and stars, balance (Check required, two-sided equations, ranges), abacus target mode, profiles, on-screen keyboard, settings and URL normalisation, parent gate lockout, streaks (timezone and month boundaries), badges (generated from the curriculum, awarded once), dashboard rows, daily challenge determinism, the app store (persistence, corrupt storage, badge award once), nav.
UI components are not unit tested; they are exercised end to end by `npm run screenshots` (arrow keys, 35 screens, fails if a target cannot be focused, reports console errors).

## Verified vs not verified

Verified: `npm test` (40 pass), `tsc` for root and `app/`, `expo export --platform web` (bundle 947 kB JS), full arrow-key run through every screen in headless Chrome 148 at 1920x1080 with no console errors.
Verified on an Android TV emulator (2026-10-20, API 33 x86 image, Gradle debug build, Metro-served JS): the app launches to the Welcome screen, the D-pad and OK drive every screen (on-screen keyboard, abacus, balance scales, map quiz, results, My progress), level-ups and badges appear, and BACK returns from a game to Home. That run found and fixed one real bug: BACK exited the whole app from inside a game (see `docs/FRICTION_LOG.md` F4). NOT verified: Fire OS itself (a different image from Android TV) or a real Fire TV remote, audio playback on device (the emulator ran with audio off), frame rate and memory on a Fire TV Stick (nothing measured; the memoisation above is by design, not by profiling), TalkBack, emoji flag rendering on Fire OS fonts (Android's Noto emoji should have them), tvOS, the Alexa+ side (simulated over MCP by the coach's `scripts/demo_tv.py`).

## Known gaps

- The web preview in `src/ui/` (older React DOM demo) only got a minimal update for the new Balance rules and is not part of the product.
- Natural Earth 110m has no polygon for tiny countries; those questions show an un-highlighted map. The wrapped Fiji/Russia sub-paths are filtered at load instead of regenerating `mapData.ts`.
- Flags are emoji, so they look like the platform's emoji font draws them.
- Daily challenge shows abacus and algebra as multiple choice (not the bead/scale mini-games).
- Dashboard shows the first 12 badges, no scrolling; level map and dashboard get tight with more than about 6 topics.
- Player names use a caps-only keyboard (no accents); the URL keyboard has no uppercase.
- Parent gate is a deterrent for young children, not security.

License: MIT (see `LICENSE`); portions MIT-0, see `NOTICE`.
