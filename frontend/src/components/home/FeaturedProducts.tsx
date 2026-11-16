import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import theme from '@/styles/theme';
import { useTheme } from '@/hooks/useTheme';
import Shimmer from '@/components/common/Shimmer';
import QuantityStepper from '@/components/common/QuantityStepper';
import type { Product } from '@/types/product.types';

export type { Product } from '@/types/product.types';

const { colors, spacing, typography, moderateScale } = theme;

const FLOWER_DESIGN = require('../../../assets/images/FlowerDesignn.webp');
const TITLE_FLOWER_SIZE = moderateScale(38);

interface ProductCardProps {
  item: Product;
  quantity: number;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onPress?: (id: string) => void;
}

const ProductCard = React.memo(
  ({ item, quantity, onIncrement, onDecrement, onPress }: ProductCardProps) => {
    const { colors } = useTheme();

    const discountPercent =
      item.originalPrice && item.originalPrice > item.price
        ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
        : 0;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { borderColor: colors.cardBorder },
          pressed && styles.cardPressed,
        ]}
        onPress={() => onPress?.(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ₹${item.price.toFixed(2)}`}
      >
        <View style={styles.imageBox}>
          {discountPercent > 0 ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          ) : null}
          <Image source={item.image} style={styles.image} resizeMode="contain" />
        </View>

        <View style={styles.info}>
          <View style={styles.textBlock}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.unit} numberOfLines={1}>
              {item.unit || ' '}
            </Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.priceBox}>
              <View style={styles.priceLine}>
                <Text style={[styles.price, { color: colors.primary }]}>
                  ₹{item.price.toFixed(2)}
                </Text>
                {item.originalPrice ? (
                  <Text style={styles.oldPrice}>₹{item.originalPrice.toFixed(2)}</Text>
                ) : null}
              </View>
            </View>
            <QuantityStepper
              size="xs"
              reserveSlot={false}
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

const SkeletonCard = React.memo(() => (
  <View style={styles.card}>
    <View style={styles.imageBox}>
      <Shimmer width="72%" height="72%" borderRadius={moderateScale(8)} />
    </View>
    <View style={styles.info}>
      <View style={styles.textBlock}>
        <Shimmer width="90%" height={moderateScale(14)} />
        <View style={{ height: 4 }} />
        <Shimmer width="60%" height={moderateScale(14)} />
        <View style={{ height: 4 }} />
        <Shimmer width="45%" height={moderateScale(12)} />
      </View>
      <View style={styles.footer}>
        <Shimmer width="50%" height={moderateScale(16)} />
        <Shimmer
          width={moderateScale(28)}
          height={moderateScale(28)}
          borderRadius={moderateScale(14)}
        />
      </View>
    </View>
  </View>
));
SkeletonCard.displayName = 'SkeletonCard';

interface FeaturedProductsProps {
  products: Product[];
  loading?: boolean;
  error?: string | null;
  quantities: Record<string, number>;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onPressItem?: (id: string) => void;
  onRetry?: () => void;
}

const SKELETON_ROWS = [[0, 1], [2, 3], [4, 5]];

const FeaturedProducts = ({
  products,
  loading = false,
  error = null,
  quantities,
  onIncrement,
  onDecrement,
  onPressItem,
  onRetry,
}: FeaturedProductsProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const productRows = useMemo(() => {
    const rows: Product[][] = [];
    for (let i = 0; i < products.length; i += 2) {
      rows.push(products.slice(i, i + 2));
    }
    return rows;
  }, [products]);

  const showSkeletons = loading && products.length === 0;
  const showError = !loading && error && products.length === 0;
  const showEmpty = !loading && !error && products.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.sectionTitleRow}>
        <ExpoImage
          source={FLOWER_DESIGN}
          style={styles.titleFlowerLeft}
          contentFit="contain"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <Text style={styles.sectionTitle}>{t('home.featuredProducts')}</Text>
        <ExpoImage
          source={FLOWER_DESIGN}
          style={styles.titleFlowerRight}
          contentFit="contain"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>

      {showSkeletons ? (
        <View style={styles.grid}>
          {SKELETON_ROWS.map((row, index) => (
            <View key={`skeleton-row-${index}`} style={styles.row}>
              {row.map((item) => (
                <SkeletonCard key={`skeleton-${item}`} />
              ))}
            </View>
          ))}
        </View>
      ) : showError ? (
        <Pressable style={styles.stateBox} onPress={onRetry}>
          <Ionicons name="cloud-offline-outline" size={moderateScale(22)} color={colors.textSecondary} />
          <Text style={styles.stateText}>{error}</Text>
          <Text style={[styles.stateAction, { color: colors.primary }]}>{t('common.retry')}</Text>
        </Pressable>
      ) : showEmpty ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>{t('home.noProducts')}</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {productRows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.row}>
              {row.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  quantity={quantities[item.id] ?? 0}
                  onIncrement={onIncrement}
                  onDecrement={onDecrement}
                  onPress={onPressItem}
                />
              ))}
              {row.length === 1 ? <View style={styles.cardSpacer} /> : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
    zIndex: 10,
    elevation: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  titleFlowerLeft: {
    width: TITLE_FLOWER_SIZE,
    height: TITLE_FLOWER_SIZE,
    transform: [{ scaleX: -1 }],
    opacity: 0.9,
  },
  titleFlowerRight: {
    width: TITLE_FLOWER_SIZE,
    height: TITLE_FLOWER_SIZE,
    opacity: 0.9,
  },
  sectionTitle: {
    ...typography.h4,
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 0,
  },
  grid: {
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: moderateScale(10),
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  cardSpacer: {
    flex: 1,
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F5F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    borderTopLeftRadius: moderateScale(8),
    borderTopRightRadius: moderateScale(8),
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '82%',
    height: '82%',
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.xs + 2,
    left: spacing.xs + 2,
    backgroundColor: '#E8F7EE',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: moderateScale(4),
    borderWidth: 0.5,
    borderColor: '#C6EED5',
    zIndex: 2,
  },
  discountText: {
    fontSize: moderateScale(9.5),
    fontWeight: '700',
    color: '#1F9D55',
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs + 2,
  },
  textBlock: {
    gap: 2,
  },
  name: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: moderateScale(18),
    minHeight: moderateScale(36),
  },
  unit: {
    fontSize: moderateScale(11),
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: moderateScale(15),
    minHeight: moderateScale(15),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  priceBox: {
    flex: 1,
    minWidth: 0,
  },
  priceLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: spacing.xxs,
    rowGap: 1,
  },
  price: {
    fontSize: moderateScale(15, 0.35),
    fontWeight: '700',
    lineHeight: moderateScale(19, 0.35),
    flexShrink: 0,
  },
  oldPrice: {
    fontSize: moderateScale(11, 0.35),
    fontWeight: '500',
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    lineHeight: moderateScale(14, 0.35),
    flexShrink: 0,
  },
  stateBox: {
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  stateText: {
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stateAction: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    marginTop: spacing.xxs,
  },
});

export default FeaturedProducts;
