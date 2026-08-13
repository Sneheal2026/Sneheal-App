import React, { useCallback } from 'react';
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
} from 'react-native-reanimated';
import theme from '@/styles/theme';
import type { AuthStackParamList } from '@/navigation/types';
import { useProductDetails } from '@/hooks/useCatalog';
import { useCart } from '@/context/CartContext';
import { SimilarItems } from '@/components/product';
import Loader from '@/components/common/Loader';
import QuantityStepper from '@/components/common/QuantityStepper';
import { useTranslation } from 'react-i18next';

const { colors, spacing, moderateScale } = theme;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.34;

const ADD_GREEN = '#1F9D55';
const PRICE_BLUE = '#0A74DA';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ProductDetails'>;
type Rt = RouteProp<AuthStackParamList, 'ProductDetails'>;

const ProductDetailsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const { productId } = route.params;

  const { data: medicine, loading, error, refetch } = useProductDetails(productId);
  const { getQuantity, addProduct, decrement } = useCart();
  const quantity = getQuantity(productId);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const handleAdd = useCallback(() => {
    if (medicine) addProduct(medicine);
  }, [medicine, addProduct]);
  const handleRemove = useCallback(() => decrement(productId), [decrement, productId]);

  const openSimilar = useCallback(
    (id: string) => {
      navigation.push('ProductDetails', { productId: id });
    },
    [navigation],
  );

  if (loading) {
    return (
      <View style={styles.emptyWrap}>
        <ExpoStatusBar style="dark" />
        <Loader message={t('common.loading')} fullScreen={false} />
      </View>
    );
  }

  if (error || !medicine) {
    return (
      <View style={styles.emptyWrap}>
        <ExpoStatusBar style="dark" />
        <Text style={styles.emptyText}>{error ?? t('product.notFound')}</Text>
        <Pressable
          onPress={() => (error ? refetch() : navigation.goBack())}
          style={styles.emptyBtn}
        >
          <Text style={styles.emptyBtnText}>
            {error ? t('common.retry') : t('product.goBack')}
          </Text>
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
            <Text style={styles.taxNote}>{t('product.inclTaxes')}</Text>
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
          <Text style={styles.sectionTitle}>{t('product.keyUses')}</Text>
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
          <Text style={styles.sectionTitle}>{t('product.about')}</Text>
          <Text style={styles.description}>{medicine.description}</Text>

          <SimilarItems productId={productId} onPressItem={openSimilar} />
        </Animated.View>
      </ScrollView>

      {/* Floating back button */}
      <Pressable
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { top: topInset + spacing.xs }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={t('common.back')}
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

        <QuantityStepper
          size="lg"
          reserveSlot={false}
          quantity={quantity}
          onIncrement={handleAdd}
          onDecrement={handleRemove}
        />
      </Animated.View>
    </View>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    minHeight: moderateScale(64),
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
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.md,
    justifyContent: 'center',
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
});

export default ProductDetailsScreen;
