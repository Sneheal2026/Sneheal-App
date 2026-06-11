import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';

const { colors, spacing, typography, moderateScale, device } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_WIDTH = device.isSmallDevice
  ? SCREEN_WIDTH * 0.44
  : SCREEN_WIDTH * 0.42;
const CARD_MARGIN = spacing.md;
const ADD_BTN_SIZE = moderateScale(32, 0.35);

const PRODUCT_IMAGES = {
  vitaminsMinerals: require('../../../assets/images/Vitamins-Minerals.png'),
  nutritionDrinks: require('../../../assets/images/Nutrition-Drinks.png'),
  feverCold: require('../../../assets/images/Fever-Cold.png'),
  painRelief: require('../../../assets/images/Pain-Relief.png'),
  ayurveda: require('../../../assets/images/Ayurveda.png'),
  fitness: require('../../../assets/images/Fitness.png'),
  oralCare: require('../../../assets/images/Oral-Care.png'),
  hairCare: require('../../../assets/images/Hair-Care.png'),
} as const;

interface Product {
  id: string;
  name: string;
  image: ImageSourcePropType;
  price: number;
  originalPrice?: number;
}

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Daily Multivitamin Capsules',
    image: PRODUCT_IMAGES.vitaminsMinerals,
    price: 12.49,
    originalPrice: 16.65,
  },
  {
    id: '2',
    name: 'Pediacare Super Immune Plus',
    image: PRODUCT_IMAGES.nutritionDrinks,
    price: 15.99,
    originalPrice: 18.15,
  },
  {
    id: '3',
    name: 'Fever & Cold Relief Syrup',
    image: PRODUCT_IMAGES.feverCold,
    price: 6.99,
  },
  {
    id: '4',
    name: 'Pain Relief Tablets',
    image: PRODUCT_IMAGES.painRelief,
    price: 4.99,
    originalPrice: 6.99,
  },
  {
    id: '5',
    name: 'Ayurvedic Immunity Booster',
    image: PRODUCT_IMAGES.ayurveda,
    price: 22.99,
  },
  {
    id: '6',
    name: 'Dietary Supplement Health Products',
    image: PRODUCT_IMAGES.fitness,
    price: 18.99,
  },
  {
    id: '7',
    name: 'Oral Care Essentials',
    image: PRODUCT_IMAGES.oralCare,
    price: 9.99,
    originalPrice: 14.99,
  },
  {
    id: '8',
    name: 'Biotin Hair Growth Support',
    image: PRODUCT_IMAGES.hairCare,
    price: 14.99,
  },
];

const ADD_GREEN = '#1F9D55';
const PRICE_BLUE = '#0A74DA';

interface ProductCardProps {
  item: Product;
  quantity: number;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}

const ProductCard = ({ item, quantity, onIncrement, onDecrement }: ProductCardProps) => (
  <View style={styles.card} pointerEvents="box-none">
    <View style={styles.imageBox} pointerEvents="none">
      <Image source={item.image} style={styles.image} resizeMode="contain" />
    </View>

    <View style={styles.info} pointerEvents="box-none">
      <Text style={styles.name} numberOfLines={2} pointerEvents="none">
        {item.name}
      </Text>

      <View style={styles.footer} pointerEvents="box-none">
        <View style={styles.priceBox} pointerEvents="none">
          <Text style={styles.price} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            ${item.price.toFixed(2)}
          </Text>
          {item.originalPrice ? (
            <Text style={styles.oldPrice} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              ${item.originalPrice.toFixed(2)}
            </Text>
          ) : null}
        </View>

        {quantity === 0 ? (
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.8}
            onPress={() => onIncrement(item.id)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="add" size={moderateScale(18, 0.35)} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyCounter}>
            <TouchableOpacity
              style={styles.qtyBtn}
              activeOpacity={0.7}
              onPress={() => onDecrement(item.id)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="remove" size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            <Text style={styles.qtyText} pointerEvents="none">
              {quantity}
            </Text>

            <TouchableOpacity
              style={[styles.qtyBtn, styles.qtyBtnAdd]}
              activeOpacity={0.8}
              onPress={() => onIncrement(item.id)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="add" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  </View>
);

const FeaturedProducts = () => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleIncrement = useCallback((id: string) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
  }, []);

  const handleDecrement = useCallback((id: string) => {
    setQuantities((prev) => {
      const current = prev[id] ?? 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: current - 1 };
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        item={item}
        quantity={quantities[item.id] ?? 0}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
      />
    ),
    [quantities, handleIncrement, handleDecrement],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Featured Products</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={PRODUCTS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: CARD_MARGIN }} />}
        nestedScrollEnabled
        directionalLockEnabled
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  viewAll: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: PRICE_BLUE,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: moderateScale(8),
    overflow: 'hidden',
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
        elevation: 2,
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
  },
  image: {
    width: '75%',
    height: '75%',
  },
  info: {
    padding: spacing.sm,
    paddingTop: spacing.xs,
  },
  name: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: moderateScale(17),
    marginBottom: spacing.xs,
    minHeight: moderateScale(34),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: ADD_BTN_SIZE,
  },
  priceBox: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingRight: spacing.xxs,
  },
  price: {
    fontSize: moderateScale(15, 0.35),
    fontWeight: '700',
    color: PRICE_BLUE,
    lineHeight: moderateScale(18, 0.35),
  },
  oldPrice: {
    fontSize: moderateScale(11, 0.35),
    fontWeight: '500',
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    lineHeight: moderateScale(14, 0.35),
    marginTop: 1,
  },
  addBtn: {
    width: ADD_BTN_SIZE,
    height: ADD_BTN_SIZE,
    borderRadius: moderateScale(9, 0.35),
    backgroundColor: ADD_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#188A47',
    flexShrink: 0,
  },
  qtyCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: moderateScale(9, 0.35),
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flexShrink: 0,
    height: ADD_BTN_SIZE,
  },
  qtyBtn: {
    width: moderateScale(28, 0.35),
    height: ADD_BTN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  qtyBtnAdd: {
    backgroundColor: ADD_GREEN,
  },
  qtyText: {
    minWidth: moderateScale(22, 0.35),
    textAlign: 'center',
    fontSize: moderateScale(13, 0.35),
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: 2,
  },
});

export default FeaturedProducts;
