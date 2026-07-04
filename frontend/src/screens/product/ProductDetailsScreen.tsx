import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import theme from '@/styles/theme';
import type { AuthStackParamList } from '@/navigation/types';
import { getMedicineById } from '@/constants/medicines';
import { SimilarItems } from '@/components/product';

const { colors, spacing, moderateScale } = theme;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.34;

const ADD_GREEN = '#1F9D55';
const ADD_GREEN_DARK = '#188A47';
const PRICE_BLUE = '#0A74DA';

const SPRING = { damping: 16, stiffness: 320, mass: 0.7 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ProductDetails'>;
type Rt = RouteProp<AuthStackParamList, 'ProductDetails'>;

const ProductDetailsScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const { productId } = route.params;

  const medicine = useMemo(() => getMedicineById(productId), [productId]);
  const [quantity, setQuantity] = useState(0);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const handleAdd = useCallback(() => setQuantity((q) => q + 1), []);
  const handleRemove = useCallback(() => setQuantity((q) => Math.max(0, q - 1)), []);

  const openSimilar = useCallback(
    (id: string) => {
      navigation.push('ProductDetails', { productId: id });
    },
    [navigation],
  );

  if (!medicine) {
    return (
      <View style={styles.emptyWrap}>
        <ExpoStatusBar style="dark" />
        <Text style={styles.emptyText}>Product not found.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.emptyBtn}>
          <Text style={styles.emptyBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ExpoStatusBar style="dark" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: spacing.xxxxxl + spacing.xxxxl + Math.max(insets.bottom, spacing.md),
        }}
        bounces={Platform.OS === 'ios'}
      >
        {/* Hero image */}
        <View style={[styles.hero, { height: HERO_HEIGHT + topInset }]}>
          <Animated.Image
            entering={FadeIn.duration(320)}
            source={medicine.image}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        {/* Body */}
        <Animated.View entering={FadeInUp.duration(360)} style={styles.body}>
          <Text style={styles.name}>{medicine.name}</Text>

          <View style={styles.mfrRow}>
            <Ionicons
              name="business-outline"
              size={moderateScale(13)}
              color={colors.textSecondary}
            />
            <Text style={styles.mfr}>{medicine.manufacturer}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={moderateScale(12)} color="#F5A623" />
              <Text style={styles.ratingText}>{medicine.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.reviews}>{medicine.reviews.toLocaleString()} ratings</Text>
            <View style={styles.dot} />
            <Text style={styles.unit}>{medicine.unit}</Text>
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{medicine.price.toFixed(2)}</Text>
            {medicine.originalPrice ? (
              <Text style={styles.oldPrice}>₹{medicine.originalPrice.toFixed(2)}</Text>
            ) : null}
            <Text style={styles.taxNote}>incl. all taxes</Text>
          </View>

          {/* Highlights */}
          <View style={styles.highlights}>
            {medicine.highlights.map((h) => (
              <View key={h.label} style={styles.highlightItem}>
                <View style={styles.highlightIcon}>
                  <Ionicons
                    name={h.icon as keyof typeof Ionicons.glyphMap}
                    size={moderateScale(18)}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.highlightLabel}>{h.label}</Text>
              </View>
            ))}
          </View>

          {/* Uses */}
          <Text style={styles.sectionTitle}>Key Uses</Text>
          <View style={styles.usesBox}>
            {medicine.uses.map((use) => (
              <View key={use} style={styles.useRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={moderateScale(18)}
                  color={ADD_GREEN}
                />
                <Text style={styles.useText}>{use}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>About this product</Text>
          <Text style={styles.description}>{medicine.description}</Text>

          <SimilarItems productId={productId} onPressItem={openSimilar} />
        </Animated.View>
      </ScrollView>

      {/* Floating back button */}
      <Pressable
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { top: topInset + spacing.xs }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
      </Pressable>

      {/* Sticky bottom bar */}
      <Animated.View
        entering={FadeInDown.duration(360)}
        style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
      >
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceValue}>₹{medicine.price.toFixed(2)}</Text>
          <Text style={styles.bottomPriceUnit}>{medicine.unit}</Text>
        </View>

        {quantity === 0 ? (
          <AddToCartButton onPress={handleAdd} />
        ) : (
          <Animated.View entering={ZoomIn.springify().damping(18)} style={styles.stepper}>
            <Pressable
              onPress={handleRemove}
              style={styles.stepBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="remove" size={20} color={colors.white} />
            </Pressable>
            <Text style={styles.stepQty}>{quantity}</Text>
            <Pressable
              onPress={handleAdd}
              style={styles.stepBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="add" size={20} color={colors.white} />
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

const AddToCartButton = ({ onPress }: { onPress: () => void }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING);
      }}
      style={[styles.addToCart, animatedStyle]}
    >
      <Ionicons name="cart" size={18} color={colors.white} />
      <Text style={styles.addToCartText}>Add to Cart</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: moderateScale(15),
    color: colors.textSecondary,
  },
  emptyBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: colors.primary,
  },
  emptyBtnText: {
    color: colors.white,
    fontWeight: '600',
  },
  hero: {
    width: '100%',
    backgroundColor: '#EEF4FB',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: moderateScale(28),
    borderBottomRightRadius: moderateScale(28),
    overflow: 'hidden',
  },
  heroImage: {
    width: '62%',
    height: '72%',
  },
  backBtn: {
    position: 'absolute',
    left: spacing.lg,
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  name: {
    fontSize: moderateScale(21),
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
    lineHeight: moderateScale(27),
  },
  mfrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  mfr: {
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF6E5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  ratingText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#B26A00',
  },
  reviews: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  unit: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  price: {
    fontSize: moderateScale(26),
    fontWeight: '800',
    color: PRICE_BLUE,
  },
  oldPrice: {
    fontSize: moderateScale(15),
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  taxNote: {
    fontSize: moderateScale(11),
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  highlights: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  highlightItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  highlightIcon: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightLabel: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  usesBox: {
    gap: spacing.sm,
  },
  useRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  useText: {
    flex: 1,
    fontSize: moderateScale(14),
    color: colors.textPrimary,
    lineHeight: moderateScale(20),
  },
  description: {
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    lineHeight: moderateScale(22),
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 12 },
    }),
  },
  bottomPrice: {
    flexShrink: 1,
  },
  bottomPriceValue: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bottomPriceUnit: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
  },
  addToCart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: ADD_GREEN,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: theme.borderRadius.full,
    ...Platform.select({
      ios: {
        shadowColor: ADD_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  addToCartText: {
    color: colors.white,
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADD_GREEN,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: spacing.sm,
  },
  stepBtn: {
    width: moderateScale(40),
    height: moderateScale(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepQty: {
    minWidth: moderateScale(34),
    textAlign: 'center',
    color: colors.white,
    fontSize: moderateScale(17),
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});

export default ProductDetailsScreen;
