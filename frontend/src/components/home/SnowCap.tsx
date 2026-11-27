import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

// Organic undulating snow drips matching the reference winter aesthetic
const SNOW_PATH =
  'M 0 0 L 100 0 L 100 9.5 C 96 9.5 91.5 16 85 16.5 C 78 17 74 10.5 67 11 C 60 11.5 55 20.5 46 20.5 C 37.5 20.5 33 11 25 11.5 C 18 12 15 16.5 8.5 16.5 C 3.5 16.5 0.5 10 0 10 Z';

interface SnowCapProps {
  /** Optional custom height percentage (default: 28%) */
  heightPercent?: string;
}

export const SnowCap = React.memo(({ heightPercent = '28%' }: SnowCapProps) => {
  return (
    <View style={[styles.container, { height: heightPercent as any }]} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 100 25"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="snowBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="75%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#F1F6FC" />
          </LinearGradient>
        </Defs>

        {/* 1. Ambient soft drop shadow */}
        <Path
          d={SNOW_PATH}
          fill="rgba(30, 65, 115, 0.12)"
          transform="translate(0, 3)"
        />

        {/* 2. Direct contact shadow beneath drips */}
        <Path
          d={SNOW_PATH}
          fill="rgba(25, 55, 95, 0.22)"
          transform="translate(0, 1.8)"
        />

        {/* 3. Pure fluffy snow cap body */}
        <Path d={SNOW_PATH} fill="url(#snowBodyGrad)" />

        {/* 4. Subtle frosty highlight along the top rim */}
        <Path
          d="M 4 1.5 L 96 1.5"
          stroke="rgba(255, 255, 255, 0.95)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
});

SnowCap.displayName = 'SnowCap';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});

export default SnowCap;
