import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  InteractionManager,
  type ListRenderItemInfo,
  type TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type CompositeNavigationProp,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
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
import { useProductSearch } from '@/hooks/useCatalog';
import { useTabBarScrollHandler } from '@/hooks/useTabBarScrollHandler';
import { useTheme } from '@/hooks/useTheme';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import type { AuthStackParamList, TabParamList } from '@/navigation/types';
import { getTabBarHeight } from '@/navigation/tabBarConfig';
import type { Product } from '@/types/product.types';
import {
  addSearchTerm,
  clearSearchHistory,
  getSearchHistory,
} from '@/services/searchHistoryStorage';

type SearchNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Search'>,
  NativeStackNavigationProp<AuthStackParamList>
>;

const SearchScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<SearchNavigation>();
  const route = useRoute<RouteProp<TabParamList, 'Search'>>();
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography, borderRadius, gradients, moderateScale } = useTheme();
  const searchInputRef = useRef<TextInput>(null);
  const paramsRef = useRef(route.params);
  const startListeningRef = useRef<() => Promise<void>>(async () => {});
  paramsRef.current = route.params;

  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const {
    data: results,
    total,
    loading: searchLoading,
    loadingMore,
    hasMore,
    loadMore,
  } = useProductSearch(query);

  const hasQuery = query.trim().length > 0;
  const tabBarHeight = getTabBarHeight(insets.bottom);
  const tabBarScrollHandler = useTabBarScrollHandler();

  const { toggleListening, startListening, isListening } = useVoiceRecognition({
    onTranscriptChange: setQuery,
  });
  startListeningRef.current = startListening;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let cancelled = false;
      let voiceTimer: ReturnType<typeof setTimeout> | undefined;

      void getSearchHistory().then((stored) => {
        if (active) setHistory(stored);
      });

      const params = paramsRef.current;
      const incomingQuery = params?.query?.trim();
      const shouldFocus = Boolean(params?.autofocus);
      const shouldStartVoice = Boolean(params?.startVoice);

      if (incomingQuery) {
        setQuery(incomingQuery);
      }

      if (shouldFocus || shouldStartVoice || incomingQuery) {
        navigation.setParams({
          query: undefined,
          autofocus: undefined,
          startVoice: undefined,
        });
      }

      const interactionTask = InteractionManager.runAfterInteractions(() => {
        if (cancelled) return;

        if (shouldStartVoice) {
          voiceTimer = setTimeout(() => {
            if (!cancelled) void startListeningRef.current();
          }, 80);
          return;
        }

        if (shouldFocus) {
          searchInputRef.current?.focus();
        }
      });

      return () => {
        active = false;
        cancelled = true;
        interactionTask.cancel();
        if (voiceTimer) clearTimeout(voiceTimer);
      };
    }, [navigation]),
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

  const handleEndReached = useCallback(() => {
    if (hasQuery && hasMore && !searchLoading && !loadingMore) {
      void loadMore();
    }
  }, [hasQuery, hasMore, searchLoading, loadingMore, loadMore]);

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
        list: {
          flex: 1,
          marginTop: -spacing.md,
        },
        listContent: {
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          gap: spacing.sm,
        },
        browseContent: {
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
          marginBottom: spacing.sm,
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
        loadingBox: {
          paddingVertical: spacing.xxxl,
          alignItems: 'center',
          justifyContent: 'center',
        },
        footerLoading: {
          paddingVertical: spacing.lg,
          alignItems: 'center',
        },
        endOfList: {
          ...typography.caption,
          color: colors.textMuted,
          textAlign: 'center',
          paddingVertical: spacing.md,
        },
      }),
    [borderRadius, colors, moderateScale, spacing, typography],
  );

  const renderResult = useCallback(
    ({ item, index }: ListRenderItemInfo<Product>) => (
      <SearchResultRow medicine={item} index={index} onPress={openProduct} />
    ),
    [openProduct],
  );

  const keyExtractor = useCallback((item: Product) => item.id, []);

  const browseHeader = useMemo(
    () => (
      <View style={styles.browseContent}>
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

        <Animated.View entering={FadeInDown.delay(60).duration(320)} style={styles.section}>
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

        <Animated.View entering={FadeInDown.delay(120).duration(320)} style={styles.section}>
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
      </View>
    ),
    [
      applyTerm,
      handleCategoryPress,
      handleClearHistory,
      history,
      styles,
      t,
    ],
  );

  const resultsHeader = useMemo(() => {
    if (!hasQuery || searchLoading || results.length === 0) return null;

    return (
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle} numberOfLines={1}>
          {t('search.resultsFor', { query: query.trim() })}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {t('search.resultCount', { count: total })}
          </Text>
        </View>
      </View>
    );
  }, [
    hasQuery,
    query,
    results.length,
    searchLoading,
    styles,
    t,
    total,
  ]);

  const listEmpty = useMemo(() => {
    if (!hasQuery) return null;
    if (searchLoading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    return <SearchEmptyState onBrowse={() => setQuery('')} />;
  }, [colors.primary, hasQuery, searchLoading, styles.loadingBox]);

  const listFooter = useMemo(() => {
    if (!hasQuery || results.length === 0) return null;
    if (loadingMore) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }
    if (!hasMore && results.length > 0) {
      return <Text style={styles.endOfList}>{t('search.endOfResults')}</Text>;
    }
    return null;
  }, [
    colors.primary,
    hasMore,
    hasQuery,
    loadingMore,
    results.length,
    styles.endOfList,
    styles.footerLoading,
    t,
  ]);

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
              ref={searchInputRef}
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

      <Animated.FlatList
        style={styles.list}
        data={hasQuery ? results : []}
        keyExtractor={keyExtractor}
        renderItem={renderResult}
        ListHeaderComponent={hasQuery ? resultsHeader : browseHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + spacing.xl },
          !hasQuery && styles.browseContent,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={tabBarScrollHandler}
        scrollEventThrottle={16}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
      />
    </View>
  );
};

export default SearchScreen;
