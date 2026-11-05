import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
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

const { colors, spacing, typography, moderateScale, device } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FLOWER_DESIGN = require('../../../assets/images/FlowerDesignn.webp');
const TITLE_FLOWER_SIZE = moderateScale(38);

const CARD_WIDTH = device.isSmallDevice
  ? SCREEN_WIDTH * 0.44
  : SCREEN_WIDTH * 0.42;
const CARD_MARGIN = spacing.md;

interface ProductCardProps {
  item: Product;
  quantity: number;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onPress?: (id: string) => void;
}

const ProductCard = ({ item, quantity, onIncrement, onDecrement, onPress }: ProductCardProps) => {
  const { colors } = useTheme();

  return (
  <Pressable style={styles.card} onPress={() => onPress?.(item.id)}>
    <View style={styles.imageBox}>
      <Image source={item.image} style={styles.image} resizeMode="contain" />
    </View>

    <View style={styles.info}>
      <View style={styles.textBlock}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        {item.unit ? (
          <Text style={styles.unit} numberOfLines={1}>
            {item.unit}
          </Text>
        ) : null}
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
};

const SkeletonCard = () => (
  <View style={styles.card}>
    <View style={styles.imageBox}>
      <Shimmer width="75%" height="75%" borderRadius={moderateScale(6)} />
    </View>
    <View style={styles.info}>
      <Shimmer width="90%" height={moderateScale(13)} />
      <View style={{ height: 2 }} />
      <Shimmer width="65%" height={moderateScale(11)} />
      <View style={{ height: spacing.xxs }} />
      <Shimmer width="55%" height={moderateScale(16)} />
    </View>
  </View>
);

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

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        item={item}
        quantity={quantities[item.id] ?? 0}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onPress={onPressItem}
      />
    ),
    [quantities, onIncrement, onDecrement, onPressItem],
  );

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
        <View style={[styles.list, styles.skeletonRow]}>
          {[0, 1, 2].map((key) => (
            <View key={key} style={{ marginRight: CARD_MARGIN }}>
              <SkeletonCard />
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
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ width: CARD_MARGIN }} />}
          nestedScrollEnabled
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxs,
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
  list: {
    paddingHorizontal: spacing.lg,
  },
  skeletonRow: {
    flexDirection: 'row',
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
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: moderateScale(8),
    borderWidth: 2,
    borderColor: colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  imageBox: {
    width: '100%',
    height: CARD_WIDTH * 0.8,
    backgroundColor: '#F5F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    borderTopLeftRadius: moderateScale(6),
    borderTopRightRadius: moderateScale(6),
    overflow: 'hidden',
  },
  image: {
    width: '75%',
    height: '75%',
  },
  info: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xxs,
  },
  textBlock: {
    gap: 1,
    marginBottom: spacing.xxs,
  },
  name: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: moderateScale(22),
  },
  unit: {
    fontSize: moderateScale(11),
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: moderateScale(13),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xxs,
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
    fontSize: moderateScale(16, 0.35),
    fontWeight: '700',
    lineHeight: moderateScale(20, 0.35),
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
});

export default FeaturedProducts;
