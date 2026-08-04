import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import type { SearchCategory } from '@/constants/searchCatalog';

interface CategoryTileProps {
  category: SearchCategory;
  label: string;
  index: number;
  onPress: (category: SearchCategory) => void;
}

const CategoryTile: React.FC<CategoryTileProps> = ({ category, label, index, onPress }) => {
  const { colors, spacing, typography, borderRadius, shadows, moderateScale } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          width: '23%',
        },
        tile: {
          alignItems: 'center',
          gap: spacing.xs,
        },
        pressed: {
          opacity: 0.7,
        },
        imageBox: {
          width: '100%',
          aspectRatio: 1,
          borderRadius: borderRadius.lg,
          backgroundColor: category.tint,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          ...shadows.sm,
        },
        image: {
          width: '72%',
          height: '72%',
        },
        label: {
          ...typography.caption,
          fontSize: moderateScale(11),
          fontWeight: '600',
          color: colors.textPrimary,
          textAlign: 'center',
        },
      }),
    [borderRadius, category.tint, colors, moderateScale, shadows, spacing, typography],
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 45).duration(340)}
      style={styles.wrapper}
    >
      <Pressable
        onPress={() => onPress(category)}
        style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.imageBox}>
          <Image source={category.image} style={styles.image} resizeMode="contain" />
        </View>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export default CategoryTile;
