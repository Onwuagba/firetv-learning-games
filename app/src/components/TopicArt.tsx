import React from "react";
import Svg, { Circle, Line, Path, Rect, Text as SText } from "react-native-svg";
import { px } from "../theme";

/** Line art per topic. Unknown (new) topics get a generic star badge with their initial, so adding a topic never breaks the UI. */
export const TopicArt = React.memo(function TopicArt({ topic, color, size }: { topic: string; color: string; size: number }) {
  const s = px(size);
  return (
    <Svg style={{ flexShrink: 0 }} width={s} height={s} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {topic === "abacus" && <>
        <Rect x="8" y="10" width="84" height="80" rx="8" fill="none" stroke={color} strokeWidth="5" />
        {[30, 50, 70].map((y) => <Line key={y} x1="8" x2="92" y1={y} y2={y} stroke={color} strokeWidth="2" />)}
        {[[20, 32, 44], [24, 36], [16, 28, 40, 52]].map((row, i) => row.map((x) => <Circle key={`${i}-${x}`} cx={x + 4} cy={30 + i * 20} r="7" fill={color} />))}
      </>}
      {topic === "geography" && <>
        <Circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="5" />
        <Path d="M50 10 C30 30 30 70 50 90 M50 10 C70 30 70 70 50 90 M10 50 H90 M16 30 H84 M16 70 H84" fill="none" stroke={color} strokeWidth="3" />
      </>}
      {topic === "algebra" && <>
        <Line x1="50" y1="20" x2="50" y2="86" stroke={color} strokeWidth="5" />
        <Line x1="14" y1="34" x2="86" y2="26" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <Path d="M4 60 Q18 76 32 60 Z M68 54 Q82 70 96 54 Z" fill={color} />
        <Line x1="34" y1="88" x2="66" y2="88" stroke={color} strokeWidth="6" strokeLinecap="round" />
      </>}
      {!["abacus", "geography", "algebra"].includes(topic) && <>
        <Path d="M50 6 L61 37 L94 38 L68 58 L77 90 L50 71 L23 90 L32 58 L6 38 L39 37 Z" fill="none" stroke={color} strokeWidth="5" strokeLinejoin="round" />
        <SText x="50" y="60" fontSize="30" fontWeight="bold" fill={color} textAnchor="middle">{(topic[0] ?? "?").toUpperCase()}</SText>
      </>}
    </Svg>
  );
});
