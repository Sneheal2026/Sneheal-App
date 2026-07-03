import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SCAN_BUTTON_SIZE } from '@/navigation/tabBarConfig';
import theme from '@/styles/theme';

const { colors } = theme;

const PULSE_DURATION = 2400;
const HALO_DURATION = 3200;

interface PulseRingProps {
  delay?: number;
}

const PulseRing = ({ delay = 0 }: PulseRingProps) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: PULSE_DURATION, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, [delay, progress]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.7]) }],
    opacity: interpolate(progress.value, [0, 0.2, 1], [0.5, 0.3, 0]),
  }));

  return <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none" />;
};

const AmbientHalo = () => {
  const breath = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: HALO_DURATION, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breath]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breath.value, [0, 1], [1.05, 1.22]) }],
    opacity: interpolate(breath.value, [0, 1], [0.22, 0.38]),
  }));

  return <Animated.View style={[styles.halo, haloStyle]} pointerEvents="none" />;
};

const ScanTabGlow = () => (
  <>
    <AmbientHalo />
    <PulseRing delay={0} />
    <PulseRing delay={PULSE_DURATION / 2} />
  </>
);

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
    width: SCAN_BUTTON_SIZE,
    height: SCAN_BUTTON_SIZE,
    borderRadius: SCAN_BUTTON_SIZE / 2,
    backgroundColor: colors.primaryLight,
  },
  ring: {
    position: 'absolute',
    width: SCAN_BUTTON_SIZE,
    height: SCAN_BUTTON_SIZE,
    borderRadius: SCAN_BUTTON_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
  },
});

export default ScanTabGlow;
