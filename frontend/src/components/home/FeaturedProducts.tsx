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
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeOut,
  ZoomIn,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import theme from '@/styles/theme';
import { useTheme } from '@/hooks/useTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_PRESS = { damping: 18, stiffness: 420, mass: 0.6 };
const SPRING_LAYOUT = { damping: 22, stiffness: 320, mass: 0.8 };

const { colors, spacing, moderateScale, device } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_WIDTH = device.isSmallDevice
  ? SCREEN_WIDTH * 0.44
  : SCREEN_WIDTH * 0.42;
const CARD_MARGIN = spacing.md;
const ADD_BTN_SIZE = moderateScale(34, 0.35);
const ACTION_SLOT_WIDTH = moderateScale(92, 0.35);
const INNER_BTN = ADD_BTN_SIZE - moderateScale(6, 0.35);

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

export interface Product {
  id: string;
  name: string;
  image: ImageSourcePropType;
  price: number;
  originalPrice?: number;
}

export const FEATURED_PRODUCTS: Product[] = [
  { id: '1', name: 'Daily Multivitamin Capsules', image: PRODUCT_IMAGES.vitaminsMinerals, price: 12.49, originalPrice: 16.65 },
  { id: '2', name: 'Pediacare Super Immune Plus', image: PRODUCT_IMAGES.nutritionDrinks, price: 15.99, originalPrice: 18.15 },
  { id: '3', name: 'Fever & Cold Relief Syrup', image: PRODUCT_IMAGES.feverCold, price: 6.99 },
  { id: '4', name: 'Pain Relief Tablets', image: PRODUCT_IMAGES.painRelief, price: 4.99, originalPrice: 6.99 },
  { id: '5', name: 'Ayurvedic Immunity Booster', image: PRODUCT_IMAGES.ayurveda, price: 22.99 },
  { id: '6', name: 'Dietary Supplement Health Products', image: PRODUCT_IMAGES.fitness, price: 18.99 },
  { id: '7', name: 'Oral Care Essentials', image: PRODUCT_IMAGES.oralCare, price: 9.99, originalPrice: 14.99 },
  { id: '8', name: 'Biotin Hair Growth Support', image: PRODUCT_IMAGES.hairCare, price: 14.99 },
];

const ADD_GREEN = '#1F9D55';
const ADD_GREEN_LIGHT = '#E8F7EE';
const ADD_GREEN_DARK = '#188A47';
const BTN_SIZE = INNER_BTN;

interface ScalePressableProps {
  onPress: () => void;
  style?: object | object[];
  hitSlop?: { top: number; bottom: number; left: number; right: number };
  children: React.ReactNode;
}

const ScalePressable = ({ onPress, style, hitSlop, children }: ScalePressableProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.9, SPRING_PRESS);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_PRESS);
      }}
      hitSlop={hitSlop}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};

interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

const QuantityStepper = ({ quantity, onIncrement, onDecrement }: QuantityStepperProps) => (
  <Animated.View
    layout={LinearTransition.springify()
      .damping(SPRING_LAYOUT.damping)
      .stiffness(SPRING_LAYOUT.stiffness)
      .mass(SPRING_LAYOUT.mass)}
    style={styles.actionSlot}
  >
    {quantity === 0 ? (
      <Animated.View
        entering={ZoomIn.springify().damping(20).stiffness(340)}
        exiting={FadeOut.duration(140)}
        style={styles.addBtnWrap}
      >
        <ScalePressable
          onPress={onIncrement}
          style={styles.addBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add" size={moderateScale(19, 0.35)} color={colors.white} />
        </ScalePressable>
      </Animated.View>
    ) : (
      <Animated.View
        entering={ZoomIn.springify().damping(20).stiffness(340)}
        exiting={FadeOut.duration(140)}
        style={styles.qtyCounter}
      >
        <ScalePressable
          onPress={onDecrement}
          style={styles.qtyBtnMinus}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="remove" size={moderateScale(14, 0.35)} color={ADD_GREEN} />
        </ScalePressable>

        <View style={styles.qtyValueWrap}>
          <Animated.Text
            key={quantity}
            entering={ZoomIn.springify().damping(22).stiffness(380)}
            style={styles.qtyText}
          >
            {quantity}
          </Animated.Text>
        </View>

        <ScalePressable
          onPress={onIncrement}
          style={styles.qtyBtnPlus}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="add" size={moderateScale(14, 0.35)} color={colors.white} />
        </ScalePressable>
      </Animated.View>
    )}
  </Animated.View>
);

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
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>

      <View style={styles.footer}>
        <View style={styles.priceBox}>
          <Text
            style={[styles.price, { color: colors.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            ₹{item.price.toFixed(2)}
          </Text>
          {item.originalPrice ? (
            <Text style={styles.oldPrice} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
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
};

interface FeaturedProductsProps {
  quantities: Record<string, number>;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onPressItem?: (id: string) => void;
}

const FeaturedProducts = ({ quantities, onIncrement, onDecrement, onPressItem }: FeaturedProductsProps) => {
  const { colors } = useTheme();

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Featured Products</Text>
        <Pressable>
          <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
        </Pressable>
      </View>

      <FlatList
        data={FEATURED_PRODUCTS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: CARD_MARGIN }} />}
        nestedScrollEnabled
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
    zIndex: 10,
    elevation: 10,
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
  },
  list: {
    paddingHorizontal: spacing.lg,
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: ADD_BTN_SIZE,
    paddingTop: spacing.xxs,
  },
  priceBox: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-end',
    paddingRight: spacing.sm,
    paddingBottom: spacing.xxs,
  },
  price: {
    fontSize: moderateScale(18, 0.35),
    fontWeight: '700',
    lineHeight: moderateScale(22, 0.35),
  },
  oldPrice: {
    fontSize: moderateScale(12, 0.35),
    fontWeight: '500',
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    lineHeight: moderateScale(15, 0.35),
    marginTop: 2,
  },
  actionSlot: {
    width: ACTION_SLOT_WIDTH,
    height: ADD_BTN_SIZE,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 20,
    elevation: 20,
  },
  addBtnWrap: {
    width: ADD_BTN_SIZE,
    height: ADD_BTN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: ADD_BTN_SIZE,
    height: ADD_BTN_SIZE,
    borderRadius: ADD_BTN_SIZE / 2,
    backgroundColor: ADD_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: ADD_GREEN,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  qtyCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: ACTION_SLOT_WIDTH,
    height: ADD_BTN_SIZE,
    backgroundColor: ADD_GREEN_LIGHT,
    borderRadius: ADD_BTN_SIZE / 2,
    paddingHorizontal: moderateScale(3, 0.35),
    borderWidth: 1,
    borderColor: 'rgba(31, 157, 85, 0.15)',
  },
  qtyBtnMinus: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  qtyBtnPlus: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADD_GREEN,
    ...Platform.select({
      ios: {
        shadowColor: ADD_GREEN_DARK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  qtyValueWrap: {
    flex: 1,
    height: BTN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    textAlign: 'center',
    fontSize: moderateScale(13, 0.35),
    fontWeight: '800',
    color: ADD_GREEN_DARK,
    fontVariant: ['tabular-nums'],
    lineHeight: moderateScale(16, 0.35),
    includeFontPadding: false,
  },
});

export default FeaturedProducts;
