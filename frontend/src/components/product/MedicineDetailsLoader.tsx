import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

export interface MedicineDetailsLoaderProps {
  onBack?: () => void;
}

export const MedicineDetailsLoader: React.FC<MedicineDetailsLoaderProps> = ({ onBack }) => {
  const { colors } = useTheme();

  // Continuous 360° orbital rotation (UI thread)
  const rotation = useSharedValue(0);

  // Smooth floating & rocking action for the capsule
  const capsuleFloat = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1250,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    capsuleFloat.value = withRepeat(
      withTiming(1, {
        duration: 1300,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true, // smooth ping-pong hover
    );

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(capsuleFloat);
    };
  }, [rotation, capsuleFloat]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const capsuleStyle = useAnimatedStyle(() => {
    const translateY = interpolate(capsuleFloat.value, [0, 1], [-5, 5]);
    const rotateDeg = interpolate(capsuleFloat.value, [0, 1], [-34, -42]);
    return {
      transform: [{ translateY }, { rotate: `${rotateDeg}deg` }],
    };
  });

  return (
    <View style={styles.root}>
      {/* Top back button */}
      {onBack && (
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: colors.surface, borderColor: colors.borderLight },
              pressed && styles.pressed,
            ]}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
        </SafeAreaView>
      )}

      {/* Centered Stage */}
      <View style={styles.center}>
        <View style={styles.stage}>
          {/* Rotating SVG Orbit with 3 gradient-tailed arcs and the leading dot */}
          <Animated.View style={[styles.svgOrbit, spinStyle]}>
            <Svg width={140} height={140} viewBox="0 0 140 140">
              <Defs>
                {/* Arc 1 (Top main arc) gradient: tail fades from 0.05 -> solid 1 */}
                <SvgGradient id="tailGrad1" x1="0%" y1="90%" x2="100%" y2="10%">
                  <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.06} />
                  <Stop offset="45%" stopColor={colors.primary} stopOpacity={0.65} />
                  <Stop offset="100%" stopColor={colors.primary} stopOpacity={1} />
                </SvgGradient>

                {/* Arc 2 (Left arc) gradient: tail fades from 0.05 -> solid 0.9 */}
                <SvgGradient id="tailGrad2" x1="80%" y1="100%" x2="0%" y2="0%">
                  <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.06} />
                  <Stop offset="50%" stopColor={colors.primary} stopOpacity={0.55} />
                  <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.9} />
                </SvgGradient>

                {/* Arc 3 (Bottom arc) gradient: tail fades from 0.05 -> solid 0.9 */}
                <SvgGradient id="tailGrad3" x1="100%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.06} />
                  <Stop offset="50%" stopColor={colors.primary} stopOpacity={0.55} />
                  <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.9} />
                </SvgGradient>
              </Defs>

              {/* Arc 1: Top main arc (190° -> 325°) */}
              <Path
                d="M 14.9 60.3 A 56 56 0 0 1 115.9 37.9"
                stroke="url(#tailGrad1)"
                strokeWidth={3.8}
                strokeLinecap="round"
                fill="none"
              />

              {/* Glowing Orb dot sitting exactly at the end of the top moving arc */}
              <Circle
                cx={115.9}
                cy={37.9}
                r={6}
                fill="#FFFFFF"
                stroke={colors.primary}
                strokeWidth={2.8}
              />

              {/* Arc 2: Left segment (130° -> 175°) */}
              <Path
                d="M 34 112.9 A 56 56 0 0 1 14.2 74.9"
                stroke="url(#tailGrad2)"
                strokeWidth={3.8}
                strokeLinecap="round"
                fill="none"
              />

              {/* Arc 3: Bottom-right segment (15° -> 75°) */}
              <Path
                d="M 124.1 84.5 A 56 56 0 0 1 84.5 124.1"
                stroke="url(#tailGrad3)"
                strokeWidth={3.8}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </Animated.View>

          {/* Animated Hovering Capsule (No shadow, no plus, theme color) */}
          <Animated.View style={[styles.capsule, capsuleStyle]}>
            {/* Left half: Theme Color */}
            <View style={[styles.capsuleHalfLeft, { backgroundColor: colors.primary }]} />
            {/* Right half: Clean White */}
            <View style={styles.capsuleHalfRight} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeTop: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -35,
  },
  stage: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgOrbit: {
    position: 'absolute',
    width: 140,
    height: 140,
  },
  capsule: {
    width: 72,
    height: 32,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  capsuleHalfLeft: {
    flex: 1,
  },
  capsuleHalfRight: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default MedicineDetailsLoader;
