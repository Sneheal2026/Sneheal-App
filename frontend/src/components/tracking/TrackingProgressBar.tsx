import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius } = theme;

interface Props {
  phase: 'to_hub' | 'to_customer';
  progress: number;
}

const TRACK_HEIGHT = 4;
const DOT_SIZE = 14;
const BIKE_SIZE = 28;

const TrackingProgressBar: React.FC<Props> = ({ phase, progress }) => {
  const bikeProgress = useSharedValue(0);
  const bikeBounce = useSharedValue(0);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, progress));
    bikeProgress.value = withTiming(clamped, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, bikeProgress]);

  useEffect(() => {
    bikeBounce.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 300, easing: Easing.inOut(Easing.sin) }),
        withTiming(2, { duration: 300, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [bikeBounce]);

  const bikeAnimStyle = useAnimatedStyle(() => ({
    left: `${bikeProgress.value * 100}%`,
    transform: [{ translateX: -BIKE_SIZE / 2 }, { translateY: bikeBounce.value }],
  }));

  const filledStyle = useAnimatedStyle(() => ({
    width: `${bikeProgress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      {/* Labels */}
      <View style={styles.labelRow}>
        <View style={styles.labelItem}>
          {phase === 'to_customer' ? (
            <View style={styles.checkDot}>
              <Ionicons name="checkmark" size={9} color="#fff" />
            </View>
          ) : (
            <View style={[styles.dot, styles.dotActive]} />
          )}
          <Text style={[styles.label, phase === 'to_customer' && styles.labelDone]}>
            Hub
          </Text>
        </View>
        <View style={[styles.labelItem, { alignItems: 'flex-end' }]}>
          <View style={[styles.dot, phase === 'to_customer' && styles.dotActive]} />
          <Text style={styles.label}>Your location</Text>
        </View>
      </View>

      {/* Track */}
      <View style={styles.track}>
        <Animated.View style={[styles.trackFilled, filledStyle]} />

        {/* Bike icon riding along the track */}
        <Animated.View style={[styles.bikeWrap, bikeAnimStyle]}>
          <View style={styles.bikeBubble}>
            <Ionicons name="bicycle" size={16} color="#fff" />
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  labelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.border,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  labelDone: {
    color: colors.success,
    fontWeight: '600',
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: colors.border,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'visible',
    position: 'relative',
  },
  trackFilled: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: TRACK_HEIGHT / 2,
  },
  bikeWrap: {
    position: 'absolute',
    top: -(BIKE_SIZE - TRACK_HEIGHT) / 2,
    zIndex: 10,
  },
  bikeBubble: {
    width: BIKE_SIZE,
    height: BIKE_SIZE,
    borderRadius: BIKE_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default React.memo(TrackingProgressBar);
