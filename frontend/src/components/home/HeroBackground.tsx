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
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 0.15, 0]),
  }));

  return (
    <>
      <LinearGradient
        colors={[
          colors.headerGradientStart,
          colors.headerGradientMid,
          colors.primaryDark,
          colors.primary,
        ]}
        locations={[0, 0.35, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={['rgba(26,115,232,0.2)', 'transparent', 'rgba(74,156,245,0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[StyleSheet.absoluteFill, meshStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 1, y: 0.7 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </>
  );
};

export default React.memo(HeroBackground);
