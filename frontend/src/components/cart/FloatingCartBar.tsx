import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import RunningBorderHighlight from '@/components/common/RunningBorderHighlight';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOptionalTabBarVisibility } from '@/context/TabBarVisibilityContext';
import theme from '@/styles/theme';
import { useTranslation } from 'react-i18next';

const { colors, spacing, typography, moderateScale, shadows } = theme;

const BAR_RADIUS = moderateScale(32, 0.35);
const THUMB_SIZE = moderateScale(48, 0.35);
const CTA_SIZE = moderateScale(44, 0.35);
const LOOP_MS = 4000;

export const FLOATING_CART_BAR_HEIGHT =
  THUMB_SIZE + spacing.md * 2;

interface FloatingCartBarProps {
  totalItems: number;
  previewImages: ImageSourcePropType[];
  onPress: () => void;
  /** Distance from the screen bottom. When set, tab-bar tracking is skipped. */
  bottomOffset?: number;
}

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
        <RunningBorderHighlight borderRadius={BAR_RADIUS} loopMs={LOOP_MS} />
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
