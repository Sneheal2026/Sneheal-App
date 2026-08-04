import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import type { Medicine } from '@/constants/medicines';

const RATING_GOLD = '#F5A623';
const DISCOUNT_GREEN = '#1F9D55';

interface SearchResultRowProps {
  medicine: Medicine;
  index: number;
  onPress: (id: string) => void;
}

const SearchResultRow: React.FC<SearchResultRowProps> = ({ medicine, index, onPress }) => {
  const { t } = useTranslation();
  const { colors, spacing, typography, borderRadius, shadows, moderateScale } = useTheme();

  const discount = medicine.originalPrice
    ? Math.round((1 - medicine.price / medicine.originalPrice) * 100)
    : 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.borderLight,
          padding: spacing.md,
          ...shadows.sm,
        },
        pressed: {
          opacity: 0.75,
        },
        imageBox: {
          width: moderateScale(64),
          height: moderateScale(64),
          borderRadius: borderRadius.md,
          backgroundColor: colors.surfaceSecondary,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        image: {
          width: '82%',
          height: '82%',
        },
        info: {
          flex: 1,
          minWidth: 0,
          gap: spacing.xxs,
        },
        name: {
          ...typography.bodySmall,
          fontWeight: '700',
          color: colors.textPrimary,
        },
        manufacturer: {
          ...typography.caption,
          color: colors.textMuted,
        },
        metaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.xxs,
        },
        ratingPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2,
          paddingHorizontal: spacing.xs,
          paddingVertical: 1,
          borderRadius: borderRadius.sm,
          backgroundColor: colors.warningLight,
        },
        ratingText: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.textPrimary,
        },
        unit: {
          ...typography.caption,
          color: colors.textMuted,
          flexShrink: 1,
        },
        priceRow: {
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: spacing.xs,
          marginTop: spacing.xxs,
        },
        price: {
          ...typography.bodySmall,
          fontWeight: '800',
          color: colors.textPrimary,
        },
        oldPrice: {
          ...typography.caption,
          color: colors.textMuted,
          textDecorationLine: 'line-through',
        },
        discount: {
          ...typography.caption,
          fontWeight: '800',
          color: DISCOUNT_GREEN,
        },
      }),
    [borderRadius, colors, moderateScale, shadows, spacing, typography],
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(320)}>
      <Pressable
        onPress={() => onPress(medicine.id)}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={medicine.name}
      >
        <View style={styles.imageBox}>
          <Image source={medicine.image} style={styles.image} resizeMode="contain" />
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {medicine.name}
          </Text>
          <Text style={styles.manufacturer} numberOfLines={1}>
            {medicine.manufacturer}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={moderateScale(10)} color={RATING_GOLD} />
              <Text style={styles.ratingText}>{medicine.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.unit} numberOfLines={1}>
              {medicine.unit}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{medicine.price.toFixed(2)}</Text>
            {medicine.originalPrice ? (
              <Text style={styles.oldPrice}>₹{medicine.originalPrice.toFixed(2)}</Text>
            ) : null}
            {discount > 0 ? (
              <Text style={styles.discount}>{t('search.offBadge', { percent: discount })}</Text>
            ) : null}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={moderateScale(18)} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
};

export default SearchResultRow;
