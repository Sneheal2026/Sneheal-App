import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import SearchBar from '@/components/home/SearchBar';
import {
  CategoryTile,
  SearchEmptyState,
  SearchPill,
  SearchResultRow,
} from '@/components/search';
import { SEARCH_CATEGORIES, TRENDING_SEARCHES, type SearchCategory } from '@/constants/searchCatalog';
import { useMedicineSearch } from '@/hooks/useMedicineSearch';
import { useTabBarScrollHandler } from '@/hooks/useTabBarScrollHandler';
import { useTheme } from '@/hooks/useTheme';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import type { AuthStackParamList } from '@/navigation/types';
import { getTabBarHeight } from '@/navigation/tabBarConfig';
import {
  addSearchTerm,
  clearSearchHistory,
  getSearchHistory,
} from '@/services/searchHistoryStorage';

const SearchScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography, borderRadius, gradients, moderateScale } = useTheme();

  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const results = useMedicineSearch(query);
  const hasQuery = query.trim().length > 0;
  const tabBarHeight = getTabBarHeight(insets.bottom);
  const tabBarScrollHandler = useTabBarScrollHandler();

  const { toggleListening, isListening } = useVoiceRecognition({
    onTranscriptChange: setQuery,
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void getSearchHistory().then((stored) => {
        if (active) setHistory(stored);
      });

      return () => {
        active = false;
      };
    }, []),
  );

  const applyTerm = useCallback(async (term: string) => {
    setQuery(term);
    setHistory(await addSearchTerm(term));
  }, []);

  const handleClearHistory = useCallback(async () => {
    await clearSearchHistory();
    setHistory([]);
  }, []);

  const openProduct = useCallback(
    (productId: string) => {
      void addSearchTerm(query);
      navigation.navigate('ProductDetails', { productId });
    },
    [navigation, query],
  );

  const handleCategoryPress = useCallback(
    (category: SearchCategory) => {
      void applyTerm(category.query);
    },
    [applyTerm],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.surfaceSecondary,
        },
        hero: {
          paddingBottom: spacing.xl,
        },
        heroInner: {
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          gap: spacing.xxs,
        },
        heroTitle: {
          ...typography.h3,
          fontSize: moderateScale(21),
          fontWeight: '800',
          color: colors.textPrimary,
        },
        heroSubtitle: {
          ...typography.caption,
          color: colors.textSecondary,
          marginBottom: spacing.md,
        },
        scroll: {
          flex: 1,
          marginTop: -spacing.md,
        },
        scrollContent: {
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          gap: spacing.xl,
        },
        section: {
          gap: spacing.md,
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        sectionTitle: {
          ...typography.bodySmall,
          fontWeight: '800',
          color: colors.textPrimary,
        },
        sectionAction: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.primary,
        },
        pressed: {
          opacity: 0.7,
        },
        pillsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
        },
        categoryGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: spacing.lg,
        },
        resultsHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
        resultsTitle: {
          ...typography.bodySmall,
          fontWeight: '800',
          color: colors.textPrimary,
          flex: 1,
        },
        countBadge: {
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: borderRadius.full,
          backgroundColor: colors.primarySurface,
          borderWidth: 1,
          borderColor: colors.primaryBorder,
        },
        countText: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.primary,
        },
        resultsList: {
          gap: spacing.sm,
        },
      }),
    [borderRadius, colors, moderateScale, spacing, typography],
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradients.settingsHero}
        locations={[0, 0.5, 1]}
        style={styles.hero}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.heroInner}>
            <Text style={styles.heroTitle}>{t('search.heroTitle')}</Text>
            <Text style={styles.heroSubtitle}>{t('search.heroSubtitle')}</Text>

            <SearchBar
              value={query}
              onChangeText={setQuery}
              onMicPress={toggleListening}
              isListening={isListening}
              placeholder={t('search.placeholder')}
              animatePlaceholder={false}
              compact
              elevated
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={tabBarScrollHandler}
        scrollEventThrottle={16}
      >
        {hasQuery ? (
          results.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle} numberOfLines={1}>
                  {t('search.resultsFor', { query: query.trim() })}
                </Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>
                    {t('search.resultCount', { count: results.length })}
                  </Text>
                </View>
              </View>

              <View style={styles.resultsList}>
                {results.map((medicine, index) => (
                  <SearchResultRow
                    key={medicine.id}
                    medicine={medicine}
                    index={index}
                    onPress={openProduct}
                  />
                ))}
              </View>
            </View>
          ) : (
            <SearchEmptyState onBrowse={() => setQuery('')} />
          )
        ) : (
          <>
            {history.length > 0 ? (
              <Animated.View entering={FadeInDown.duration(320)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('search.recent')}</Text>
                  <Pressable
                    onPress={() => void handleClearHistory()}
                    hitSlop={8}
                    style={({ pressed }) => pressed && styles.pressed}
                    accessibilityRole="button"
                  >
                    <Text style={styles.sectionAction}>{t('search.clear')}</Text>
                  </Pressable>
                </View>

                <View style={styles.pillsRow}>
                  {history.map((term) => (
                    <SearchPill
                      key={term}
                      label={term}
                      icon="time-outline"
                      onPress={() => void applyTerm(term)}
                    />
                  ))}
                </View>
              </Animated.View>
            ) : null}

            <Animated.View
              entering={FadeInDown.delay(60).duration(320)}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>{t('search.trending')}</Text>
              <View style={styles.pillsRow}>
                {TRENDING_SEARCHES.map((item) => (
                  <SearchPill
                    key={item.id}
                    label={t(item.labelKey)}
                    icon="trending-up"
                    accented
                    onPress={() => void applyTerm(item.query)}
                  />
                ))}
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(120).duration(320)}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>{t('search.shopByCategory')}</Text>
              <View style={styles.categoryGrid}>
                {SEARCH_CATEGORIES.map((category, index) => (
                  <CategoryTile
                    key={category.id}
                    category={category}
                    label={t(category.labelKey)}
                    index={index}
                    onPress={handleCategoryPress}
                  />
                ))}
              </View>
            </Animated.View>
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
};

export default SearchScreen;
