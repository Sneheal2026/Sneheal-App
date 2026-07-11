import React, { useEffect, useMemo } from 'react';
import { StyleSheet, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { darken, mixWithWhite, withAlpha } from '@/utils/colorUtils';

export type ShimmerProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Soft theme-tinted shimmer — muted so it doesn’t overpower white cards.
 */
const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 16,
  borderRadius,
  style,
}) => {
  const { colors, borderRadius: radii } = useTheme();
  const progress = useSharedValue(0);
  const radius = borderRadius ?? radii.md;

  const baseColor = useMemo(() => {
    try {
      // Soft brand tint: slightly darkened primary, then washed with white
      return mixWithWhite(darken(colors.primary, 0.15), 0.72);
    } catch {
      return '#C5D4E8';
    }
  }, [colors.primary]);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-120, 120]),
      },
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.88, 1, 0.88]),
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        pulseStyle,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[StyleSheet.absoluteFill, sweepStyle]} pointerEvents="none">
        <LinearGradient
          colors={[
            withAlpha('#FFFFFF', 0),
            withAlpha('#FFFFFF', 0.18),
            withAlpha('#FFFFFF', 0.4),
            withAlpha('#FFFFFF', 0.18),
            withAlpha('#FFFFFF', 0),
          ]}
          locations={[0, 0.35, 0.5, 0.65, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.sweep}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    position: 'relative',
  },
  sweep: {
    ...StyleSheet.absoluteFillObject,
    width: '200%',
    marginLeft: '-50%',
  },
});

export default React.memo(Shimmer);
