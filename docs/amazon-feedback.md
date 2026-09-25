# Amazon developer feedback (DRAFT)

Purpose: the hackathon may ask for feedback on the tools. Fill in from real experience; items below are what we hit while building. TODO-verify each against current docs before submitting.

## What we tried
- Sample base: react-native-multi-tv-app-sample (named in the hackathon Resources). Not cloned or run in this build: TODO-verify repo URL and status.
- Runtime target: React Native for TV (react-native-tvos on npm, latest seen 0.87.1-1) on the Fire TV emulator. Not run yet.

## Real friction so far (fill in as you go)
- [ ] Emulator setup time and image availability
- [ ] Remote key events on Fire TV vs Android TV (which event names does useTVEventHandler deliver for the Fire TV remote? TODO-verify)
- [ ] Focus management: what worked, what needed custom code
- [ ] Docs gaps, sample app gaps
- [ ] Submission or Appstore packaging questions

## Suggestions (draft, edit to match your experience)
1. A first-party focus-grid helper with documented edge behaviour (stay put at edges).
2. A web preview or simulator path so designers can review TV layouts without an emulator.
3. Documented TV safe-area guidance in React Native units.
4. A minimal, tested sample of syncing state with a companion voice skill.

## Honest notes
No claims here are validated on a device yet.
