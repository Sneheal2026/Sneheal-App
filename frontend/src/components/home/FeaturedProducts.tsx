import React, { useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  ImageSourcePropType,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';

const { colors, spacing, typography, moderateScale } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive card sizing - adapts to screen width
const HORIZONTAL_PADDING = spacing.lg;
const CARD_GAP = spacing.sm + 4;
const getResponsiveCardWidth = () => {
  if (SCREEN_WIDTH < 360) return moderateScale(130); // Small phones
  if (SCREEN_WIDTH < 400) return moderateScale(140); // Medium phones
  return moderateScale(152); // Large phones & tablets
};
const CARD_WIDTH = getResponsiveCardWidth();
const CARD_HEIGHT = moderateScale(245);
const IMAGE_HEIGHT = moderateScale(125);

const DISCOUNT_GREEN = '#1F9D55';
const PRICE_COLOR = '#0A74DA';

interface Product {
  id: string;
  name: string;
  image: ImageSourcePropType;
  price: number;
  originalPrice?: number;
  discount?: string;
}

const FEATURED_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Dietary Supplement Health Products',
    image: { uri: 'https://images.unsplash.com/photo-1550572017-4950f68cdd8a?w=400&h=400&fit=crop&q=80' },
    price: 6.99,
    discount: '25% OFF',
  },
  {
    id: '2',
    name: 'Pediacare Super Immune Plus',
    image: { uri: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&q=80' },
    price: 15.99,
    originalPrice: 18.15,
    discount: '25% OFF',
  },
  {
    id: '3',
    name: 'Daily Multivitamin Capsules',
    image: { uri: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&h=400&fit=crop&q=80' },
    price: 12.49,
    originalPrice: 16.65,
    discount: '25% OFF',
  },
  {
    id: '4',
    name: 'Omega-3 Fish Oil 1000mg',
    image: { uri: 'https://images.unsplash.com/photo-1526045478516-99145907023c?w=400&h=400&fit=crop&q=80' },
    price: 18.99,
    discount: '30% OFF',
  },
  {
    id: '5',
    name: 'Vitamin D3 5000 IU',
    image: { uri: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=400&fit=crop&q=80' },
    price: 9.99,
    originalPrice: 14.99,
    discount: '33% OFF',
  },
  {
    id: '6',
    name: 'Turmeric Curcumin Complex',
    image: { uri: 'https://images.unsplash.com/photo-1615485500834-bc10199bc6ed?w=400&h=400&fit=crop&q=80' },
    price: 22.99,
    discount: '20% OFF',
  },
  {
    id: '7',
    name: 'Probiotic 50 Billion CFU',
    image: { uri: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&h=400&fit=crop&q=80' },
    price: 27.99,
    originalPrice: 34.99,
    discount: '20% OFF',
  },
  {
    id: '8',
    name: 'Biotin Hair Growth Support',
    image: { uri: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=400&fit=crop&q=80' },
    price: 14.99,
    discount: '15% OFF',
  },
];

const ProductImage = React.memo(({ source }: { source: ImageSourcePropType }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  const handleLoadEnd = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.Image
      source={source}
      style={[styles.productImage, { opacity }]}
      resizeMode="contain"
      onLoadEnd={handleLoadEnd}
    />
  );
});

ProductImage.displayName = 'ProductImage';

interface ProductCardProps {
  item: Product;
  onAddToCart: (id: string) => void;
  onDelete: (id: string) => void;
}

const ProductCard = React.memo(({ item, onAddToCart, onDelete }: ProductCardProps) => {
  const handleAddToCart = useCallback(() => {
    onAddToCart(item.id);
  }, [item.id, onAddToCart]);

  const handleDelete = useCallback(() => {
    onDelete(item.id);
  }, [item.id, onDelete]);

  return (
    <View style={styles.cardWrapper} pointerEvents="box-none">
      <View style={styles.card} pointerEvents="box-none">
        {item.discount && (
          <View style={styles.discountBadge} pointerEvents="none">
            <Text style={styles.discountText}>{item.discount}</Text>
          </View>
        )}

        <View style={styles.imageContainer} pointerEvents="none">
          <ProductImage source={item.image} />
        </View>

        <View style={styles.contentContainer} pointerEvents="box-none">
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.priceRow} pointerEvents="box-none">
            <View style={styles.priceContainer} pointerEvents="none">
              <Text style={styles.price}>${item.price.toFixed(2)}</Text>
              {item.originalPrice && (
                <Text style={styles.originalPrice}>${item.originalPrice.toFixed(2)}</Text>
              )}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={moderateScale(16)} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddToCart}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add" size={moderateScale(20)} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

ProductCard.displayName = 'ProductCard';

const FeaturedProducts = () => {
  const scrollX = useRef(new Animated.Value(0)).current;
  
  const handleAddToCart = useCallback((productId: string) => {
    console.log('Add to cart:', productId);
  }, []);

  const handleDelete = useCallback((productId: string) => {
    console.log('Delete product:', productId);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard item={item} onAddToCart={handleAddToCart} onDelete={handleDelete} />
    ),
    [handleAddToCart, handleDelete],
  );

  const keyExtractor = useCallback((item: Product) => item.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: CARD_WIDTH + CARD_GAP,
      offset: (CARD_WIDTH + CARD_GAP) * index,
      index,
    }),
    [],
  );

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
      }),
    [scrollX],
  );

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Wellness Product</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <Animated.FlatList
        data={FEATURED_PRODUCTS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        scrollEventThrottle={16}
        onScroll={onScroll}
        decelerationRate={0.9}
        bounces={true}
        bouncesZoom={false}
        overScrollMode="never"
        removeClippedSubviews={false}
        maxToRenderPerBatch={6}
        initialNumToRender={4}
        windowSize={10}
        getItemLayout={getItemLayout}
        updateCellsBatchingPeriod={50}
        disableIntervalMomentum={true}
        directionalLockEnabled={true}
        nestedScrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg + spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: spacing.md + 2,
  },
  sectionTitle: {
    ...typography.h4,
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  viewAllText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: PRICE_COLOR,
    letterSpacing: -0.2,
  },
  listContent: {
    paddingLeft: HORIZONTAL_PADDING,
    paddingRight: HORIZONTAL_PADDING,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
  },
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    backgroundColor: colors.white,
    borderRadius: moderateScale(14),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
    borderWidth: Platform.OS === 'android' ? 0.5 : 0,
    borderColor: colors.borderLight,
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: DISCOUNT_GREEN,
    paddingHorizontal: spacing.sm,
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
    zIndex: 10,
  },
  discountText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: '#F5F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  productImage: {
    width: '80%',
    height: '80%',
  },
  contentContainer: {
    flex: 1,
    padding: spacing.sm,
    paddingTop: spacing.xs,
  },
  productName: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: moderateScale(17),
    marginBottom: spacing.xs,
    minHeight: moderateScale(34),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  price: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: PRICE_COLOR,
    letterSpacing: -0.3,
  },
  originalPrice: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    letterSpacing: -0.2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deleteButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    backgroundColor: DISCOUNT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(FeaturedProducts);
