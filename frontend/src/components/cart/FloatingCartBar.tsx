import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ImageSourcePropType,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarVisibility } from '@/context/TabBarVisibilityContext';
import theme from '@/styles/theme';

const { colors, spacing, typography, moderateScale, shadows } = theme;

const CART_GREEN = '#111152';
const THUMB_SIZE = moderateScale(36, 0.35);

interface FloatingCartBarProps {
  totalItems: number;
  previewImages: ImageSourcePropType[];
  onPress: () => void;
}

const FloatingCartBar = ({ totalItems, previewImages, onPress }: FloatingCartBarProps) => {
  const { tabBarOffset, tabBarHeight } = useTabBarVisibility();
  const { bottom: bottomInset } = useSafeAreaInsets();

  const wrapperStyle = useAnimatedStyle(() => {
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

  const itemLabel = totalItems === 1 ? '1 item' : `${totalItems} items`;

  return (
    <Animated.View style={[styles.wrapper, wrapperStyle]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.bar, pressed && styles.barPressed]}
      >
        <View style={styles.thumbsRow}>
          {previewImages.slice(0, 3).map((image, index) => (
            <View
              key={index}
              style={[
                styles.thumbWrap,
                index > 0 && { marginLeft: -moderateScale(10, 0.35) },
                { zIndex: 3 - index },
              ]}
            >
              <Image source={image} style={styles.thumb} resizeMode="contain" />
            </View>
          ))}
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>View cart</Text>
          <Text style={styles.subtitle}>{itemLabel}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.white} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 50,
    elevation: 50,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CART_GREEN,
    borderRadius: moderateScale(14, 0.35),
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    ...shadows.md,
    shadowColor: CART_GREEN,
    shadowOpacity: 0.35,
    elevation: 8,
  },
  barPressed: {
    opacity: 0.92,
  },
  thumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.xxs,
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: CART_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumb: {
    width: THUMB_SIZE - 8,
    height: THUMB_SIZE - 8,
  },
  textBlock: {
    flex: 1,
    gap: 1,
  },
  title: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.white,
  },
  subtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
});

export default FloatingCartBar;
