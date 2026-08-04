import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';

interface SearchEmptyStateProps {
  onBrowse: () => void;
}

const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({ onBrowse }) => {
  const { t } = useTranslation();
  const { colors, spacing, typography, borderRadius, moderateScale } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          paddingVertical: spacing.xxl,
          paddingHorizontal: spacing.lg,
          gap: spacing.sm,
        },
        iconWrap: {
          width: moderateScale(72),
          height: moderateScale(72),
          borderRadius: moderateScale(36),
          backgroundColor: colors.surfaceSecondary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        },
        title: {
          ...typography.body,
          fontWeight: '700',
          color: colors.textPrimary,
        },
        subtitle: {
          ...typography.caption,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: moderateScale(18),
          maxWidth: moderateScale(250),
        },
        cta: {
          marginTop: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.full,
          backgroundColor: colors.primary,
        },
        ctaPressed: {
          opacity: 0.8,
        },
        ctaText: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.textInverse,
        },
      }),
    [borderRadius, colors, moderateScale, spacing, typography],
  );

  return (
    <Animated.View entering={FadeInDown.duration(320)} style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name="search-outline" size={moderateScale(30)} color={colors.textMuted} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {t('search.noResultsTitle')}
      </Text>
      <Text style={styles.subtitle}>{t('search.noResultsSubtitle')}</Text>
      <Pressable
        onPress={onBrowse}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>{t('search.browseCta')}</Text>
      </Pressable>
    </Animated.View>
  );
};

export default SearchEmptyState;
