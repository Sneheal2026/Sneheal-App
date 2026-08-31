import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import PharmacyAssistCard from './PharmacyAssistCard';

interface SearchEmptyStateProps {
  query?: string;
  onBrowse: () => void;
}

const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({ query, onBrowse }) => {
  const { t } = useTranslation();
  const { colors, spacing, typography, moderateScale } = useTheme();
  const trimmedQuery = query?.trim() ?? '';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          gap: spacing.lg,
          paddingVertical: spacing.md,
        },
        header: {
          alignItems: 'center',
          gap: spacing.xs,
        },
        iconWrap: {
          width: moderateScale(56),
          height: moderateScale(56),
          borderRadius: moderateScale(28),
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        },
        title: {
          ...typography.body,
          fontWeight: '700',
          color: colors.textPrimary,
          textAlign: 'center',
        },
        subtitle: {
          ...typography.caption,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: moderateScale(18),
        },
        browse: {
          alignSelf: 'center',
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
        },
        browsePressed: {
          opacity: 0.7,
        },
        browseText: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.primary,
        },
      }),
    [colors, moderateScale, spacing, typography],
  );

  return (
    <View style={styles.wrap}>
      <Animated.View entering={FadeInDown.duration(320)} style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="search-outline" size={moderateScale(24)} color={colors.textMuted} />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {trimmedQuery
            ? t('search.noResultsTitle', { query: trimmedQuery })
            : t('search.noResultsTitleFallback')}
        </Text>
        <Text style={styles.subtitle}>{t('search.noResultsSubtitle')}</Text>
      </Animated.View>

      <PharmacyAssistCard variant="hero" query={trimmedQuery} />

      <Pressable
        onPress={onBrowse}
        style={({ pressed }) => [styles.browse, pressed && styles.browsePressed]}
        accessibilityRole="button"
      >
        <Text style={styles.browseText}>{t('search.browseCta')}</Text>
      </Pressable>
    </View>
  );
};

export default SearchEmptyState;
