import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { AUTH_HERO_IMAGES } from './authTheme';
import { APP_CONFIG } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { mixWithWhite, withAlpha } from '@/utils/colorUtils';

type IoniconName = keyof typeof Ionicons.glyphMap;

type FloatIcon = {
  name: IoniconName;
  tint: string;
  wash: string;
  top: number;
  left: number;
  delay: number;
  distance: number;
};

const STAGE = 236;

const PulseRing = ({
  color,
  delay,
  size,
}: {
  color: string;
  delay: number;
  size: number;
}) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );

    return () => cancelAnimation(pulse);
  }, [delay, pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.28, 0]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.92, 1.42]) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulseRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          top: (STAGE - size) / 2,
          left: (STAGE - size) / 2,
        },
        style,
      ]}
    />
  );
};

const FloatingIcon = ({
  name,
  tint,
  wash,
  top,
  left,
  delay,
  distance,
}: FloatIcon) => {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );

    return () => cancelAnimation(float);
  }, [delay, float]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [0, -distance]) },
      { scale: interpolate(float.value, [0, 0.5, 1], [1, 1.08, 1]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.floatBubble,
        { top, left, backgroundColor: wash },
        style,
      ]}
    >
      <Ionicons name={name} size={18} color={tint} />
    </Animated.View>
  );
};

const CapsuleBubble = ({
  top,
  left,
  delay,
}: {
  top: number;
  left: number;
  delay: number;
}) => {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );

    return () => cancelAnimation(float);
  }, [delay, float]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [0, -10]) },
      { rotate: `${interpolate(float.value, [0, 1], [-12, 10])}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.capsuleWrap, { top, left }, style]}>
      <View style={styles.capsule}>
        <View style={[styles.capsuleHalf, styles.capsuleLeft]} />
        <View style={[styles.capsuleHalf, styles.capsuleRight]} />
      </View>
    </Animated.View>
  );
};

const LoadingDots = ({ color }: { color: string }) => {
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map((index) => (
        <LoadingDot key={index} color={color} delay={index * 160} />
      ))}
    </View>
  );
};

const LoadingDot = ({ color, delay }: { color: string; delay: number }) => {
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );

    return () => cancelAnimation(bounce);
  }, [bounce, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(bounce.value, [0, 1], [0.35, 1]),
    transform: [
      { translateY: interpolate(bounce.value, [0, 1], [0, -5]) },
      { scale: interpolate(bounce.value, [0, 1], [0.75, 1]) },
    ],
  }));

  return (
    <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />
  );
};

const SessionRestoreVisual = () => {
  const { t } = useTranslation();
  const { colors, typography, spacing, moderateScale } = useTheme();
  const bounce = useSharedValue(0);

  const washBlue = mixWithWhite(colors.primary, 0.86);
  const washTeal = mixWithWhite(colors.secondary, 0.84);
  const washPink = mixWithWhite('#F472B6', 0.78);
  const washGold = mixWithWhite(colors.accentGold, 0.72);

  const floatingIcons: FloatIcon[] = [
    {
      name: 'medical',
      tint: colors.primary,
      wash: washBlue,
      top: 8,
      left: 88,
      delay: 0,
      distance: 10,
    },
    {
      name: 'heart',
      tint: '#EC4899',
      wash: washPink,
      top: 46,
      left: 8,
      delay: 180,
      distance: 12,
    },
    {
      name: 'bag-handle',
      tint: colors.secondary,
      wash: washTeal,
      top: 46,
      left: 176,
      delay: 240,
      distance: 11,
    },
    {
      name: 'cart',
      tint: '#EA580C',
      wash: mixWithWhite('#FB923C', 0.72),
      top: 154,
      left: 18,
      delay: 80,
      distance: 9,
    },
    {
      name: 'sparkles',
      tint: '#D97706',
      wash: washGold,
      top: 154,
      left: 168,
      delay: 320,
      distance: 13,
    },
  ];

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 780, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 780, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    return () => cancelAnimation(bounce);
  }, [bounce]);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(bounce.value, [0, 1], [0, -8]) },
      { scale: interpolate(bounce.value, [0, 1], [1, 1.04]) },
    ],
  }));

  return (
    <View
      style={styles.root}
      accessibilityRole="progressbar"
      accessibilityLabel={t('auth.restoringMessage')}
    >
      <LinearGradient
        colors={[
          mixWithWhite(colors.primary, 0.9),
          colors.white,
          mixWithWhite(colors.secondary, 0.94),
        ]}
        locations={[0, 0.46, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View
        pointerEvents="none"
        style={[
          styles.blob,
          styles.blobTop,
          { backgroundColor: withAlpha(colors.primary, 0.1) },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blob,
          styles.blobBottom,
          { backgroundColor: withAlpha(colors.secondary, 0.1) },
        ]}
      />

      <Animated.View entering={FadeIn.duration(420)} style={styles.content}>
        <View style={styles.stage}>
          <PulseRing color={withAlpha(colors.primary, 0.45)} delay={0} size={148} />
          <PulseRing color={withAlpha(colors.secondary, 0.4)} delay={700} size={148} />

          {floatingIcons.map((icon) => (
            <FloatingIcon key={icon.name} {...icon} />
          ))}
          <CapsuleBubble top={108} left={-6} delay={140} />
          <CapsuleBubble top={108} left={198} delay={400} />

          <Animated.View style={[styles.heroWrap, heroStyle]}>
            <LinearGradient
              colors={[colors.white, mixWithWhite(colors.primary, 0.88)]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.heroCircle}
            >
              <View
                style={[
                  styles.bagWell,
                  { backgroundColor: mixWithWhite(colors.primary, 0.82) },
                ]}
              >
                <Ionicons
                  name="bag-handle"
                  size={moderateScale(34)}
                  color={colors.primary}
                />
              </View>
              <View
                style={[
                  styles.plusBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="medical" size={12} color={colors.white} />
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInDown.delay(120).duration(420)}
          style={styles.copy}
        >
          <Image
            source={AUTH_HERO_IMAGES.logo}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel={APP_CONFIG.APP_NAME}
          />
          <Text
            style={[
              typography.h4,
              styles.title,
              { color: colors.textPrimary, marginTop: spacing.md },
            ]}
          >
            {t('auth.restoringTitle')}
          </Text>
          <Text
            style={[
              typography.bodySmall,
              styles.subtitle,
              { color: colors.textSecondary, marginTop: spacing.xs },
            ]}
          >
            {t('auth.restoringMessage')}
          </Text>
          <LoadingDots color={colors.primary} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  blobTop: {
    top: -70,
    right: -50,
  },
  blobBottom: {
    bottom: -80,
    left: -60,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  stage: {
    width: STAGE,
    height: STAGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  floatBubble: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  capsuleWrap: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  capsule: {
    width: 26,
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  capsuleHalf: {
    flex: 1,
    height: '100%',
  },
  capsuleLeft: {
    backgroundColor: '#60A5FA',
  },
  capsuleRight: {
    backgroundColor: '#FFFFFF',
  },
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  bagWell: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadge: {
    position: 'absolute',
    right: 14,
    bottom: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  copy: {
    alignItems: 'center',
    marginTop: 28,
  },
  logo: {
    width: 56,
    height: 56,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    marginTop: 18,
    height: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});

export default SessionRestoreVisual;
