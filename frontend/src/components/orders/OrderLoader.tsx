import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const NAVY = '#111152';

/** Tiny “parcel on its way” loop — one clock, no copy. */
const OrderLoader = () => {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return () => cancelAnimation(t);
  }, [t]);

  const halo = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0.22, 0.5]),
    transform: [{ scale: interpolate(t.value, [0, 1], [0.86, 1.08]) }],
  }));

  const parcel = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [4, -8]) },
      { rotate: `${interpolate(t.value, [0, 1], [-6, 6])}deg` },
    ],
  }));

  const rider = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(t.value, [0, 1], [-34, 34]) }],
  }));

  return (
    <View style={styles.wrap} accessibilityRole="progressbar">
      <Animated.View style={[styles.halo, halo]} />
      <Animated.View style={parcel}>
        <LinearGradient colors={['#2A2A86', NAVY]} style={styles.box}>
          <Ionicons name="cube" size={26} color="#fff" />
        </LinearGradient>
      </Animated.View>
      <View style={styles.track}>
        <View style={styles.dash} />
        <Animated.View style={[styles.bike, rider]}>
          <Ionicons name="bicycle" size={20} color={NAVY} />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: 140,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    top: 10,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(17,17,82,0.1)',
  },
  box: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: 108,
    height: 28,
    marginTop: 10,
    justifyContent: 'center',
  },
  dash: {
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(17,17,82,0.16)',
  },
  bike: {
    position: 'absolute',
    alignSelf: 'center',
  },
});

export default OrderLoader;
