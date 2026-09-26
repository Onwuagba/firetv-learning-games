// Runtime config. Expo inlines EXPO_PUBLIC_* at bundle time (must be written literally as below).
// These are only DEFAULTS: the server URL can be changed in Settings (behind the parent gate) and is stored on the device.
export const config = {
  coachUrl: process.env.EXPO_PUBLIC_COACH_URL?.trim() || "",
  tvToken: process.env.EXPO_PUBLIC_TV_TOKEN?.trim() || "",
  /** Optional first-run profile name (e.g. for demos). Empty = show the "Who's playing?" setup. */
  child: (process.env.EXPO_PUBLIC_CHILD?.trim() || "").toLowerCase(),
};
// NOTE: EXPO_PUBLIC_TV_TOKEN is shipped inside the app bundle: anyone with the APK/page can read it.
// It only grants the TV REST API (progress read + answer events), never MCP or topic unlocking.
