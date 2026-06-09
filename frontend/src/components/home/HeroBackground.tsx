import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import theme from '@/styles/theme';

const { colors } = theme;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const DOT_ROWS = 7;
const DOT_COLS = 14;
const DOT_SIZE = 2;
const DOT_GAP = 22;

interface HeroBackgroundProps {
  scrollY?: SharedValue<number>;
}

const FloatingOrb = ({
  size,
  color,
  top,
  left,
  delay = 0,
  scrollY,
}: {
  size: number;
  color: string;
  top: number;
  left: number;
  delay?: number;
  scrollY?: SharedValue<number>;
}) => {
  const drift = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4200 + delay, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4200 + delay, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 + delay, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 3000 + delay, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [delay, drift, pulse]);

  const animatedStyle = useAnimatedStyle(() => {
    const parallax = scrollY
      ? interpolate(scrollY.value, [0, 200], [0, -30], Extrapolation.CLAMP)
      : 0;

    return {
      transform: [
        { translateY: interpolate(drift.value, [0, 1], [0, -18]) + parallax },
        { translateX: interpolate(drift.value, [0, 1], [0, 12]) },
        { scale: interpolate(pulse.value, [0, 1], [1, 1.12]) },
      ],
      opacity: interpolate(pulse.value, [0, 1], [0.35, 0.55]),
    };
  });

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
        },
        animatedStyle,
      ]}
    />
  );
};

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

const HeroBackground: React.FC<HeroBackgroundProps> = ({ scrollY }) => {
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
    <View style={StyleSheet.absoluteFill}>
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

      <FloatingOrb size={180} color="rgba(45,212,191,0.25)" top={-40} left={-50} delay={0} scrollY={scrollY} />
      <FloatingOrb size={140} color="rgba(74,156,245,0.3)" top={60} left={SCREEN_W - 100} delay={400} scrollY={scrollY} />
      <FloatingOrb size={100} color="rgba(245,185,66,0.18)" top={180} left={SCREEN_W * 0.3} delay={800} scrollY={scrollY} />
      <FloatingOrb size={220} color="rgba(26,115,232,0.15)" top={SCREEN_H * 0.05} left={SCREEN_W * 0.5} delay={200} scrollY={scrollY} />

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
  orb: {
    position: 'absolute',
  },
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
