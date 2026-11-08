import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import Shimmer from '@/components/common/Shimmer';
import { useSimilarProducts } from '@/hooks/useCatalog';
import type { Product } from '@/types/product.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.42;

export interface SimilarItemsProps {
  productId: string;
  onPressItem: (id: string) => void;
  title?: string;
  limit?: number;
}

const SimilarCard = ({
  item,
  onPress,
}: {
  item: Product;
  onPress: (id: string) => void;
}) => {
  const { colors, moderateScale } = useTheme();
  const discountPercent =
    item.originalPrice && item.originalPrice > item.price
      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
      : 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: colors.borderLight,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      <View style={styles.imageBox}>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
        {discountPercent > 0 ? (
          <View style={[styles.discountBadge, { backgroundColor: colors.successLight }]}>
            <Text style={[styles.discountText, { color: colors.success }]}>
              {discountPercent}% OFF
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.unit, { color: colors.textMuted }]} numberOfLines={1}>
          {item.unit}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.textPrimary }]}>
            ₹{item.price.toFixed(2)}
          </Text>
          {item.originalPrice && item.originalPrice > item.price ? (
            <Text style={[styles.oldPrice, { color: colors.textMuted }]}>
              ₹{item.originalPrice.toFixed(2)}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const SimilarSkeleton = () => {
  const { moderateScale } = useTheme();
  return (
    <View style={styles.card}>
      <View style={styles.imageBox}>
        <Shimmer width="72%" height="72%" borderRadius={moderateScale(8)} />
      </View>
      <View style={styles.info}>
        <Shimmer width="90%" height={moderateScale(12)} />
        <View style={{ height: 6 }} />
        <Shimmer width="50%" height={moderateScale(14)} />
      </View>
    </View>
  );
};

export const SimilarItems = ({
  productId,
  onPressItem,
  title = 'Similar Medicines & Alternatives',
  limit = 6,
}: SimilarItemsProps) => {
  const { colors, moderateScale } = useTheme();
  const { data: items, loading } = useSimilarProducts(productId, limit);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <SimilarCard item={item} onPress={onPressItem} />
    ),
    [onPressItem],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Ionicons name="repeat-outline" size={moderateScale(18)} color={colors.primary} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        </View>
        <View style={[styles.list, styles.skeletonRow]}>
          {[0, 1, 2].map((key) => (
            <View key={key} style={styles.skeletonItem}>
              <SimilarSkeleton />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="repeat-outline" size={moderateScale(18)} color={colors.primary} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={renderItem}
        nestedScrollEnabled
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  list: {
    paddingVertical: 4,
    paddingRight: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
  },
  skeletonItem: {
    marginRight: 12,
  },
  separator: {
    width: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imageBox: {
    width: '100%',
    height: CARD_WIDTH * 0.78,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    width: '74%',
    height: '74%',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  info: {
    padding: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
    minHeight: 34,
  },
  unit: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
  },
  oldPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
});

export default SimilarItems;
