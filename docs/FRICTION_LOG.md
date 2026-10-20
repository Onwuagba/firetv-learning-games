# Friction log

Entries are from building and running the app. Section F1-F3 come from the build; F4-F7 come from the first native run on an
Android TV emulator (Android 13, API 33, x86) on 2026-10-20. No Fire TV device or Fire OS image was used.

## F1. Installing app dependencies
- **Task:** install the Expo / React Native for TV app. **Steps:** `cd app && npm install`.
- **Expected:** a clean install. **Actual:** peer-dependency conflicts; `--legacy-peer-deps` was needed (documented in the README).
- **Severity:** low. **Workaround:** the flag. **Suggestion:** align peer ranges in the sample and `react-native-tvos`.

## F2. No quick way to check TV layouts without a device
- **Task:** iterate on D-pad navigation before any Android SDK was available.
- **Expected:** a lightweight path to check TV layouts. **Actual:** built a web target and a headless-Chrome arrow-key driver (`npm run screenshots`).
- **Severity:** medium. **Workaround:** the web target. **Suggestion:** an official TV web preview or simulator.

## F3. Which key events does the TV deliver?
- **Task:** confirm remote key events and `BackHandler` on a TV image. **Expected:** documented event names per device type.
- **Actual:** not clear from the docs; answered by running it (see F4).
- **Severity:** medium.

## F4. BACK exited the app from inside a game
- **Task:** press BACK in a game to return to the app's Home screen.
- **Steps:** open Abacus (or any game) on the Android TV emulator, press BACK once.
- **Expected:** Home. **Actual:** the whole app went to the background (`moveTaskToBack` in logcat).
- **Cause:** BACK reached the app twice, as a key event (via `react-native-keyevent`) and as `BackHandler`'s `hardwareBackPress`, which arrived about 1.4 s later on a busy JS thread. The first delivery popped to Home; the second saw Home and returned false, so Android handled it and exited. The 250 ms de-duplication window was far too short.
- **Severity:** high (every BACK press in a game left the app). **Fix:** on native, listen to `BackHandler` only; keep the key-event path for web. Verified on the emulator afterwards: game, BACK, Home.
- **Suggestion:** document that BACK can arrive through both paths in the TV sample, or make the sample's key-event module consume it.

## F5. The Android build downloads a lot, and a flaky network breaks it
- **Task:** first Gradle debug build. **Actual:** about 4 GB of SDK, NDK, Gradle and Maven downloads (NDK 27 alone is 836 MB); a dropped connection mid-build failed the run and Gradle needed a restart.
- **Severity:** medium. **Suggestion:** say up front what the first native build downloads, and which NDK and build-tools versions the sample needs.

## F6. Dev warning banner covers the top of the TV screen
- **Task:** record the app. **Actual:** in a debug build, a React Native warning banner (Legacy Architecture notice) sits over the header area of a 1080p TV screen and is hard to dismiss with a remote. I hid it temporarily with `LogBox.ignoreAllLogs(true)` for the recording and did not commit that.
- **Severity:** low. **Suggestion:** a release build for demos, or the sample could opt out of the notice.

## F7. Small layout overlaps on the emulator
- **Actual:** on My progress, the "My progress" title sits close to the player name, and the Home button overlaps the key-hint line at the bottom. Cosmetic; noted for a later pass.
- **Severity:** low.
