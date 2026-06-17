import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import theme from '@/styles/theme';

const { colors } = theme;

interface HeroBackgroundProps {
  pauseAnimation?: boolean;
}

const HeroBackground: React.FC<HeroBackgroundProps> = ({ pauseAnimation = false }) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (pauseAnimation) {
      cancelAnimation(shimmer);
      return;
    }

    shimmer.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.linear }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(shimmer);
    };
  }, [pauseAnimation, shimmer]);

  const meshStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 0.12, 0]),
  }));

  return (
    <>
      <LinearGradient
        colors={[
          colors.headerGradientStart,
          colors.headerGradientMid,
          colors.headerGradientEnd,
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[StyleSheet.absoluteFill, meshStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </>
  );
};

export default React.memo(HeroBackground);
