// Runtime config. Expo inlines EXPO_PUBLIC_* at bundle time (must be written literally as below).
export const config = {
  coachUrl: process.env.EXPO_PUBLIC_COACH_URL?.trim() || "",
  tvToken: process.env.EXPO_PUBLIC_TV_TOKEN?.trim() || "",
  child: (process.env.EXPO_PUBLIC_CHILD?.trim() || "demo-learner").toLowerCase(),
};
/** Real coach only when a URL is configured; otherwise the in-memory mock (still persisted locally). */
export const useCoach = config.coachUrl.length > 0;
// NOTE: EXPO_PUBLIC_TV_TOKEN is shipped inside the app bundle: anyone with the APK/page can read it.
// It only grants the TV REST API (progress read + answer events), never MCP or topic unlocking.
