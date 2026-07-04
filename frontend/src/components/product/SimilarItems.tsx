import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  FlatList,
  Dimensions,
} from 'react-native';
import theme from '@/styles/theme';
import { getSimilarMedicines, type Medicine } from '@/constants/medicines';

const { colors, spacing, moderateScale } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_WIDTH = SCREEN_WIDTH * 0.4;
const PRICE_BLUE = '#0A74DA';

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
  item: Medicine;
  onPress: (id: string) => void;
}) => (
  <Pressable
    style={styles.card}
    onPress={() => onPress(item.id)}
    accessibilityRole="button"
    accessibilityLabel={item.name}
  >
    <View style={styles.imageBox}>
      <Image source={item.image} style={styles.image} resizeMode="contain" />
    </View>
    <View style={styles.info}>
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
        {item.originalPrice ? (
          <Text style={styles.oldPrice}>₹{item.originalPrice.toFixed(2)}</Text>
        ) : null}
      </View>
    </View>
  </Pressable>
);

const SimilarItems = ({
  productId,
  onPressItem,
  title = 'Similar items',
  limit = 6,
}: SimilarItemsProps) => {
  const items = useMemo(
    () => getSimilarMedicines(productId, limit),
    [productId, limit],
  );

  const renderItem = useCallback(
    ({ item }: { item: Medicine }) => (
      <SimilarCard item={item} onPress={onPressItem} />
    ),
    [onPressItem],
  );

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
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
    marginTop: spacing.sm,
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  list: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.lg,
  },
  separator: {
    width: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: moderateScale(10),
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  imageBox: {
    width: '100%',
    height: CARD_WIDTH * 0.78,
    backgroundColor: '#F5F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '72%',
    height: '72%',
  },
  info: {
    padding: spacing.sm,
  },
  name: {
    fontSize: moderateScale(12.5),
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: moderateScale(16),
    minHeight: moderateScale(32),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  price: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: PRICE_BLUE,
  },
  oldPrice: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
});

export default SimilarItems;
