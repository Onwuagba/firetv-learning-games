import React from "react";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop, G } from "react-native-svg";
import { px } from "../theme";

/** Illustrated banner for Home: twilight sky, stars, moon, two hills and a little rocket. Static and memoised (drawn once). */
export const HeroScene = React.memo(function HeroScene({ width, height }: { width: number; height: number }) {
  const stars = [[60, 30], [140, 70], [260, 25], [380, 60], [520, 20], [640, 75], [760, 35], [900, 22], [1010, 66], [1140, 28], [1260, 58], [1380, 24], [1500, 70], [1610, 34], [1700, 62], [330, 110], [820, 105], [1200, 105]];
  return (
    <Svg width={px(width)} height={px(height)} viewBox="0 0 1728 240" preserveAspectRatio="xMidYMid slice" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#1B2F6B" /><Stop offset="0.65" stopColor="#3B4FA0" /><Stop offset="1" stopColor="#7A6BC8" /></LinearGradient>
      </Defs>
      <Rect width="1728" height="240" fill="url(#sky)" />
      {stars.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3.2 : 2} fill="#FFF6C9" opacity={0.85} />)}
      <Circle cx="1480" cy="70" r="34" fill="#FFF1B8" /><Circle cx="1494" cy="62" r="30" fill="#3B4FA0" opacity="0.0" />
      <Path d="M0 240 V190 Q220 120 460 178 T900 170 T1350 180 T1728 150 V240 Z" fill="#2A3E86" />
      <Path d="M0 240 V214 Q300 170 620 212 T1200 206 T1728 196 V240 Z" fill="#1B2D5C" />
      <G transform="translate(1010 92) rotate(28) scale(1.15)">
        <Ellipse cx="0" cy="0" rx="16" ry="38" fill="#FFFFFF" /><Path d="M-16 8 L-30 34 L-8 24 Z M16 8 L30 34 L8 24 Z" fill="#FF6B6B" />
        <Circle cx="0" cy="-8" r="7" fill="#4DA3FF" /><Path d="M-8 40 Q0 70 8 40 Z" fill="#FFD23F" />
      </G>
    </Svg>
  );
});
