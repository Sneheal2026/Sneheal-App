import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

export interface OrderLoaderProps {
  title?: string;
  subtitle?: string;
  showText?: boolean;
}

/**
 * Professional dual-arc gradient spinner loader matching the reference UI:
 * - Opposing smooth hot-pink to blush gradient arcs with rounded end caps
 * - High-speed continuous 360° rotation (UI-thread hardware accelerated)
 * - Deep wine/burgundy bold title ("Loading Your Orders...")
 * - Muted slate subtitle ("Fetching your active and past orders")
 */
const OrderLoader: React.FC<OrderLoaderProps> = ({
  title,
  subtitle,
  showText = true,
}) => {
  const { t } = useTranslation();
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: 1100, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(spin);
  }, [spin]);

  const animatedSpinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${spin.value}deg` }],
  }));

  const displayTitle = title ?? t('orders.loadingTitle', 'Loading Your Orders...');
  const displaySubtitle =
    subtitle ?? t('orders.loadingSubtitle', 'Fetching your active and past orders');

  return (
    <View style={styles.container} accessibilityRole="progressbar">
      {/* 360° Rotating Gradient Ring Spinner */}
      <Animated.View style={[styles.spinnerWrapper, animatedSpinnerStyle]}>
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Defs>
            {/* Arc 1 Gradient: Top-Right Head -> Faded Tail */}
            <LinearGradient
              id="orderArcGrad1"
              x1="58.0"
              y1="18.55"
              x2="37.56"
              y2="67.89"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="#E91E63" stopOpacity="1" />
              <Stop offset="40%" stopColor="#F06292" stopOpacity="0.75" />
              <Stop offset="75%" stopColor="#F8BBD0" stopOpacity="0.30" />
              <Stop offset="100%" stopColor="#FCE4EC" stopOpacity="0.04" />
            </LinearGradient>

            {/* Arc 2 Gradient: Bottom-Left Head -> Faded Tail (180° Symmetrical) */}
            <LinearGradient
              id="orderArcGrad2"
              x1="22.0"
              y1="61.45"
              x2="42.44"
              y2="12.11"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="#E91E63" stopOpacity="1" />
              <Stop offset="40%" stopColor="#F06292" stopOpacity="0.75" />
              <Stop offset="75%" stopColor="#F8BBD0" stopOpacity="0.30" />
              <Stop offset="100%" stopColor="#FCE4EC" stopOpacity="0.04" />
            </LinearGradient>
          </Defs>

          {/* Symmetrical Dual Arcs with Rounded End Caps */}
          <Path
            d="M 58.0 18.55 A 28 28 0 0 1 37.56 67.89"
            stroke="url(#orderArcGrad1)"
            strokeWidth={7.5}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 22.0 61.45 A 28 28 0 0 1 42.44 12.11"
            stroke="url(#orderArcGrad2)"
            strokeWidth={7.5}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* Copy: Title & Subtitle matching reference design */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {displayTitle}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {displaySubtitle}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  spinnerWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: '#461427',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.1,
    marginTop: 6,
  },
});

export default OrderLoader;
