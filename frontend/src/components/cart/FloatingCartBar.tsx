import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ImageSourcePropType,
  type LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect } from 'react-native-svg';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOptionalTabBarVisibility } from '@/context/TabBarVisibilityContext';
import theme from '@/styles/theme';
import { useTranslation } from 'react-i18next';

const { colors, spacing, typography, moderateScale, shadows } = theme;

const BAR_RADIUS = moderateScale(32, 0.35);
const THUMB_SIZE = moderateScale(48, 0.35);
const CTA_SIZE = moderateScale(44, 0.35);
const STROKE = 3;
const FLASH_RX = Math.max(0, BAR_RADIUS - STROKE / 2);
const FLASH_LEN = 96;
const TAIL_LEN = 40;
const LOOP_MS = 4000;
const RUN_PORTION = 0.32;

export const FLOATING_CART_BAR_HEIGHT =
  THUMB_SIZE + spacing.md * 2;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface FloatingCartBarProps {
  totalItems: number;
  previewImages: ImageSourcePropType[];
  onPress: () => void;
  /** Distance from the screen bottom. When set, tab-bar tracking is skipped. */
  bottomOffset?: number;
}

const roundedPerimeter = (width: number, height: number, radius: number) => {
  const rx = Math.min(radius, width / 2, height / 2);
  return 2 * (width + height - 2 * rx) + 2 * Math.PI * rx;
};

/** Gold comet + cyan tail that runs the outline every 4s. */
const RunningBorder = () => {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const progress = useSharedValue(0);
  const perimeter = useSharedValue(1);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width === size.w && height === size.h) return;
    setSize({ w: width, h: height });
  };

  useEffect(() => {
    if (size.w < 8 || size.h < 8) return;

    const innerW = size.w - STROKE;
    const innerH = size.h - STROKE;
    perimeter.value = roundedPerimeter(innerW, innerH, FLASH_RX);
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: LOOP_MS, easing: Easing.linear }),
      -1,
      false,
    );

    return () => cancelAnimation(progress);
  }, [size.w, size.h, perimeter, progress]);

  const flashStyle = useAnimatedStyle(() => {
    const t = progress.value;
    if (t >= RUN_PORTION) return { opacity: 0 };
    const fadeStart = RUN_PORTION * 0.8;
    const opacity = t < fadeStart ? 1 : 1 - (t - fadeStart) / (RUN_PORTION - fadeStart);
    return { opacity };
  });

  const headProps = useAnimatedProps(() => ({
    strokeDashoffset: -perimeter.value * Math.min(progress.value / RUN_PORTION, 1),
  }));

  const tailProps = useAnimatedProps(() => ({
    strokeDashoffset:
      -perimeter.value * Math.min(progress.value / RUN_PORTION, 1) + 36,
  }));

  const innerW = Math.max(0, size.w - STROKE);
  const innerH = Math.max(0, size.h - STROKE);
  const dashGap = Math.max(roundedPerimeter(innerW, innerH, FLASH_RX), FLASH_LEN);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {size.w > 0 ? (
        <>
          <Svg width={size.w} height={size.h}>
            <Rect
              x={STROKE / 2}
              y={STROKE / 2}
              width={innerW}
              height={innerH}
              rx={FLASH_RX}
              ry={FLASH_RX}
              fill="none"
              stroke="rgba(255, 224, 138, 0.35)"
              strokeWidth={1.5}
            />
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, flashStyle]}>
            <Svg width={size.w} height={size.h}>
              <AnimatedRect
                x={STROKE / 2}
                y={STROKE / 2}
                width={innerW}
                height={innerH}
                rx={FLASH_RX}
                ry={FLASH_RX}
                fill="none"
                stroke="#7EE8F0"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray={`${TAIL_LEN} ${dashGap}`}
                animatedProps={tailProps}
              />
              <AnimatedRect
                x={STROKE / 2}
                y={STROKE / 2}
                width={innerW}
                height={innerH}
                rx={FLASH_RX}
                ry={FLASH_RX}
                fill="none"
                stroke="#FFE08A"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${FLASH_LEN} ${dashGap}`}
                animatedProps={headProps}
              />
            </Svg>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
};

const FloatingCartBar = ({
  totalItems,
  previewImages,
  onPress,
  bottomOffset,
}: FloatingCartBarProps) => {
  const { t } = useTranslation();
  const tabBar = useOptionalTabBarVisibility();
  const fallbackOffset = useSharedValue(0);
  const tabBarOffset = tabBar?.tabBarOffset ?? fallbackOffset;
  const tabBarHeight = tabBar?.tabBarHeight ?? 0;
  const { bottom: bottomInset } = useSafeAreaInsets();

  const tabAwareStyle = useAnimatedStyle(() => {
    const offset = tabBarOffset.value;
    const hiddenProgress = tabBarHeight > 0 ? offset / tabBarHeight : 0;

    return {
      bottom:
        spacing.md +
        tabBarHeight -
        offset +
        hiddenProgress * bottomInset,
    };
  });

  if (totalItems === 0) return null;

  const thumbs = previewImages.slice(0, 3);
  const extraCount = totalItems > 9 ? '9+' : String(totalItems);

  return (
    <Animated.View
      entering={FadeInUp.duration(280).springify().damping(18)}
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        bottomOffset != null ? { bottom: bottomOffset } : tabAwareStyle,
      ]}
    >
      <View>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.bar, pressed && styles.barPressed]}
        >
          <LinearGradient
            colors={['#0E0A3A', '#1A1468', '#0C4A52']}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <LinearGradient
            colors={['rgba(255,255,255,0.18)', 'transparent']}
            style={styles.glassSheen}
          />

          <View style={styles.thumbsRow}>
            {thumbs.map((image, index) => (
              <View
                key={index}
                style={[
                  styles.thumbWrap,
                  index > 0 && { marginLeft: -moderateScale(12, 0.35) },
                  { zIndex: 3 - index },
                ]}
              >
                <Image source={image} style={styles.thumb} resizeMode="contain" />
              </View>
            ))}
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{extraCount}</Text>
            </View>
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.title}>{t('cart.viewCart')}</Text>
            <Text style={styles.subtitle}>
              {t('cart.itemCount', { count: totalItems })}
            </Text>
          </View>

          <LinearGradient
            colors={['#FFF1B8', '#F5C542', '#E0A106']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaOrb}
          >
            <Ionicons name="arrow-forward" size={22} color="#1A1468" />
          </LinearGradient>
        </Pressable>
        <RunningBorder />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 50,
    elevation: 50,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BAR_RADIUS,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    overflow: 'hidden',
    minHeight: FLOATING_CART_BAR_HEIGHT,
    ...shadows.lg,
    shadowColor: '#1A1468',
    shadowOpacity: 0.45,
    elevation: 12,
  },
  barPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  glassSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
  },
  thumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.xxs,
    zIndex: 1,
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.white,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 224, 138, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumb: {
    width: THUMB_SIZE - 10,
    height: THUMB_SIZE - 10,
  },
  countBadge: {
    marginLeft: -moderateScale(8, 0.35),
    zIndex: 4,
    minWidth: moderateScale(22, 0.35),
    height: moderateScale(22, 0.35),
    paddingHorizontal: 5,
    borderRadius: moderateScale(11, 0.35),
    backgroundColor: '#F5C542',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0E0A3A',
  },
  countText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#1A1468',
  },
  textBlock: {
    flex: 1,
    gap: 2,
    zIndex: 1,
  },
  title: {
    ...typography.body,
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.2,
  },
  subtitle: {
    ...typography.caption,
    fontSize: moderateScale(12),
    color: 'rgba(255, 224, 138, 0.9)',
    fontWeight: '600',
  },
  ctaOrb: {
    width: CTA_SIZE,
    height: CTA_SIZE,
    borderRadius: CTA_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    ...shadows.md,
    shadowColor: '#F5C542',
    shadowOpacity: 0.45,
  },
});

export default FloatingCartBar;
