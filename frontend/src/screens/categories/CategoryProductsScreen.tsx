import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  FlatList,
  ActivityIndicator,
  Platform,
  StatusBar,
  type ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useCategoryProducts } from '@/hooks/useCatalog';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/hooks/useTheme';
import QuantityStepper from '@/components/common/QuantityStepper';
import FloatingCartBar, { FLOATING_CART_BAR_HEIGHT } from '@/components/cart/FloatingCartBar';
import Shimmer from '@/components/common/Shimmer';
import { resolveCatalogImage } from '@/utils/productImage';
import type { AuthStackParamList } from '@/navigation/types';
import type { Product } from '@/types/product.types';
import theme from '@/styles/theme';

const { colors, spacing, moderateScale, borderRadius, shadows, typography } = theme;

type Nav = NativeStackNavigationProp<AuthStackParamList, 'CategoryProducts'>;
type Rt = RouteProp<AuthStackParamList, 'CategoryProducts'>;

const NUM_COLUMNS = 2;

interface ProductCardProps {
  item: Product;
  quantity: number;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onPress: (id: string) => void;
}

const ProductCard = React.memo(
  ({ item, quantity, onIncrement, onDecrement, onPress }: ProductCardProps) => {
    const { colors: themeColors } = useTheme();

    return (
      <Pressable
        style={styles.card}
        onPress={() => onPress(item.id)}
        accessibilityRole="button"
        accessibilityLabel={item.name}
      >
        <View style={styles.cardImageBox}>
          <Image source={item.image} style={styles.cardImage} resizeMode="contain" />
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>
            {item.name}
          </Text>

          {item.manufacturer ? (
            <Text style={styles.cardMfr} numberOfLines={1}>
              {item.manufacturer}
            </Text>
          ) : null}

          <View style={styles.cardFooter}>
            <View style={styles.cardPriceCol}>
              <Text
                style={[styles.cardPrice, { color: themeColors.primary }]}
                numberOfLines={1}
              >
                ₹{item.price.toFixed(2)}
              </Text>
              {item.originalPrice ? (
                <Text style={styles.cardOldPrice} numberOfLines={1}>
                  ₹{item.originalPrice.toFixed(2)}
                </Text>
              ) : null}
            </View>

            <QuantityStepper
              quantity={quantity}
              onIncrement={() => onIncrement(item.id)}
              onDecrement={() => onDecrement(item.id)}
            />
          </View>
        </View>
      </Pressable>
    );
  },
);
ProductCard.displayName = 'ProductCard';

const CardSkeleton = () => (
  <View style={styles.card}>
    <View style={styles.cardImageBox}>
      <Shimmer width="100%" height="100%" borderRadius={moderateScale(14)} />
    </View>
    <View style={styles.cardBody}>
      <Shimmer width="85%" height={moderateScale(12)} />
      <View style={{ height: spacing.xs }} />
      <Shimmer width="55%" height={moderateScale(10)} />
      <View style={{ height: spacing.sm }} />
      <Shimmer width="40%" height={moderateScale(14)} />
    </View>
  </View>
);

const CategoryProductsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();
  const { categoryId, categoryName } = route.params;

  const {
    data: products,
    total,
    loading,
    loadingMore,
    hasMore,
    error,
    refetch,
    loadMore,
  } = useCategoryProducts(categoryId);

  const { lines, totalItems, addProduct, decrement } = useCart();

  const quantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of lines) {
      map[line.productId] = line.quantity;
    }
    return map;
  }, [lines]);

  const handleIncrement = useCallback(
    (id: string) => {
      const product = products.find((p) => p.id === id);
      if (product) addProduct(product);
    },
    [products, addProduct],
  );

  const handleDecrement = useCallback(
    (id: string) => decrement(id),
    [decrement],
  );

  const previewImages = useMemo(
    () => lines.map((line) => resolveCatalogImage(line.imageUrl)),
    [lines],
  );

  const openProduct = useCallback(
    (id: string) => navigation.push('ProductDetails', { productId: id }),
    [navigation],
  );

  const openCart = useCallback(
    () => navigation.navigate('Main', { screen: 'Cart' }),
    [navigation],
  );

  const handleEndReached = useCallback(() => {
    if (hasMore && !loading && !loadingMore) void loadMore();
  }, [hasMore, loading, loadingMore, loadMore]);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Product>) => (
      <ProductCard
        item={item}
        quantity={quantities[item.id] ?? 0}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onPress={openProduct}
      />
    ),
    [quantities, handleIncrement, handleDecrement, openProduct],
  );

  const keyExtractor = useCallback((item: Product) => item.id, []);

  const headerComponent = useMemo(() => {
    if (!loading && total > 0) {
      return (
        <Animated.View entering={FadeIn.duration(250)} style={styles.countRow}>
          <View style={styles.countBadge}>
            <Text style={[styles.countText, { color: themeColors.primary }]}>
              {t('category.productsCount', { count: total })}
            </Text>
          </View>
        </Animated.View>
      );
    }
    return null;
  }, [loading, total, t, themeColors.primary]);

  const footerComponent = useMemo(() => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator color={themeColors.primary} />
        </View>
      );
    }
    if (!loading && products.length > 0 && !hasMore) {
      return <Text style={styles.endOfList}>{t('search.endOfResults')}</Text>;
    }
    return null;
  }, [loadingMore, loading, products.length, hasMore, t, themeColors.primary]);

  const emptyComponent = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>{error}</Text>
          <Pressable onPress={refetch} style={styles.retryCta}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <Animated.View entering={FadeInDown.duration(350)} style={styles.emptyWrap}>
        <Ionicons name="cube-outline" size={56} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>{t('category.empty')}</Text>
        <Text style={styles.emptySubtitle}>{t('category.emptySubtitle')}</Text>
        <Pressable
          onPress={() => navigation.navigate('Main', { screen: 'Search' })}
          style={[styles.browseCta, { backgroundColor: themeColors.primary }]}
        >
          <Text style={styles.browseCtaText}>{t('category.browseCta')}</Text>
        </Pressable>
      </Animated.View>
    );
  }, [loading, error, refetch, t, navigation, themeColors.primary]);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {categoryName}
          </Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Main', { screen: 'Search' })}
          style={styles.headerAction}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={t('search.placeholder')}
          accessibilityRole="button"
        >
          <Ionicons name="search" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Product list */}
      <FlatList
        data={loading ? [] : products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom:
              totalItems > 0
                ? Math.max(insets.bottom, spacing.md) + FLOATING_CART_BAR_HEIGHT + spacing.xl + spacing.md
                : Math.max(insets.bottom, spacing.md) + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={headerComponent}
        ListFooterComponent={footerComponent}
        ListEmptyComponent={emptyComponent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
      />

      <FloatingCartBar
        totalItems={totalItems}
        previewImages={previewImages}
        onPress={openCart}
        bottomOffset={Math.max(insets.bottom, spacing.md) + spacing.md}
      />
    </View>
  );
};

const CARD_GAP = spacing.sm;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerAction: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  countBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
  },
  countText: {
    ...typography.caption,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  columnWrapper: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...shadows.sm,
  },
  cardImageBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#EEF4FB',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  cardImage: {
    width: '60%',
    height: '60%',
  },
  cardBody: {
    padding: spacing.sm,
  },
  cardName: {
    ...typography.bodySmall,
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: moderateScale(17),
    minHeight: moderateScale(34),
  },
  cardMfr: {
    ...typography.caption,
    fontSize: moderateScale(10.5),
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  cardPriceCol: {
    flex: 1,
    minWidth: 0,
  },
  cardPrice: {
    fontSize: moderateScale(15),
    fontWeight: '800',
  },
  cardOldPrice: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  browseCta: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
  },
  browseCtaText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: moderateScale(14),
  },
  retryCta: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
  },
  retryText: {
    fontWeight: '700',
    color: colors.textPrimary,
    fontSize: moderateScale(14),
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
});

export default CategoryProductsScreen;
