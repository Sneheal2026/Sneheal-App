import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import theme from '@/styles/theme';

const { colors } = theme;
const { height: SCREEN_H } = Dimensions.get('window');

const DOT_ROWS = 7;
const DOT_COLS = 14;
const DOT_SIZE = 2;
const DOT_GAP = 22;

const DotGrid = () => (
  <View style={styles.dotGrid} pointerEvents="none">
    {Array.from({ length: DOT_ROWS }).map((_, row) => (
      <View key={row} style={styles.dotRow}>
        {Array.from({ length: DOT_COLS }).map((__, col) => (
          <View
            key={col}
            style={[
              styles.dot,
              (row + col) % 3 === 0 && styles.dotBright,
            ]}
          />
        ))}
      </View>
    ))}
  </View>
);

const CrossPattern = () => (
  <View style={styles.crossPattern} pointerEvents="none">
    {Array.from({ length: 5 }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.cross,
          { top: 40 + i * 55, right: 20 + (i % 2) * 30 },
        ]}
      >
        <View style={styles.crossH} />
        <View style={styles.crossV} />
      </View>
    ))}
  </View>
);

const HeroBackground: React.FC = () => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [shimmer]);

  const meshStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.15, 0.28, 0.15]),
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#061428', '#0C2D5E', colors.primaryDark, colors.primary]}
        locations={[0, 0.35, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={['transparent', 'rgba(13,148,136,0.35)', 'transparent']}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 0.8 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
      />

      <Animated.View style={[styles.meshHighlight, meshStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <DotGrid />
      <CrossPattern />

      {/* Diagonal accent lines */}
      <View style={styles.diagonalLines} pointerEvents="none">
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.diagonalLine,
              { left: i * 70 - 20, opacity: 0.04 + (i % 2) * 0.03 },
            ]}
          />
        ))}
      </View>

      {/* Bottom fade into content */}
      <LinearGradient
        colors={['transparent', 'rgba(6,20,40,0.4)']}
        style={styles.bottomFade}
        pointerEvents="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  dotGrid: {
    position: 'absolute',
    top: 24,
    left: 16,
    right: 16,
    opacity: 0.35,
  },
  dotRow: {
    flexDirection: 'row',
    marginBottom: DOT_GAP - DOT_SIZE,
    gap: DOT_GAP - DOT_SIZE,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dotBright: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  crossPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  cross: {
    position: 'absolute',
    width: 20,
    height: 20,
    opacity: 0.08,
  },
  crossH: {
    position: 'absolute',
    top: 9,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.white,
    borderRadius: 1,
  },
  crossV: {
    position: 'absolute',
    left: 9,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.white,
    borderRadius: 1,
  },
  meshHighlight: {
    ...StyleSheet.absoluteFillObject,
  },
  diagonalLines: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  diagonalLine: {
    position: 'absolute',
    top: -100,
    width: 1,
    height: SCREEN_H * 0.6,
    backgroundColor: colors.white,
    transform: [{ rotate: '25deg' }],
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
});

export default HeroBackground;
