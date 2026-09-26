import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SpatialNavigationRoot, DefaultFocus } from "react-tv-space-navigation";
import { FocusButton } from "./Focusable";
import { colors, font, px } from "../theme";

/** Any render error in a screen lands here instead of a white screen; the child gets one big "Back to start" button. */
export class ErrorBoundary extends React.Component<{ onReset: () => void; children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.warn("Screen error:", error.message); }
  reset = () => { this.setState({ error: null }); this.props.onReset(); };
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.root} accessibilityLiveRegion="assertive">
        <Text style={styles.emoji}>🛠️</Text>
        <Text style={styles.title}>Oops, something went wrong</Text>
        <Text style={styles.sub}>Your progress is safe. Let's start again.</Text>
        <SpatialNavigationRoot>
          <DefaultFocus><FocusButton text="Back to start" primary onSelect={this.reset} style={{ marginTop: px(40) }} /></DefaultFocus>
        </SpatialNavigationRoot>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  emoji: { fontSize: px(140) }, title: { color: colors.text, fontSize: px(font.title), fontWeight: "900", marginTop: px(16) },
  sub: { color: colors.textDim, fontSize: px(font.body), marginTop: px(12) },
});
