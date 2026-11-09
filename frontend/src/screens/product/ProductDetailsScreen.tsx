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
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import type { AuthStackParamList } from '@/navigation/types';
import { useProductDetails } from '@/hooks/useCatalog';
import { useCart } from '@/context/CartContext';
import { SimilarItems, ProductImageGallery, MedicineDetailsLoader } from '@/components/product';
import Loader from '@/components/common/Loader';
import QuantityStepper from '@/components/common/QuantityStepper';
import FloatingCartBar, {
  FLOATING_CART_BAR_HEIGHT,
} from '@/components/cart/FloatingCartBar';
import { resolveCatalogImage } from '@/utils/productImage';
import { useTranslation } from 'react-i18next';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(SCREEN_HEIGHT * 0.35, 300);

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ProductDetails'>;
type Rt = RouteProp<AuthStackParamList, 'ProductDetails'>;

const ProductDetailsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows, moderateScale } = useTheme();
  const { productId } = route.params;

  const { data: medicine, loading, error, refetch } = useProductDetails(productId);
  const { getQuantity, addProduct, decrement, lines, totalItems } = useCart();
  const quantity = getQuantity(productId);

  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const previewImages = useMemo(
    () => lines.map((line) => resolveCatalogImage(line.imageUrl)),
    [lines],
  );

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const estimatedActionBarHeight =
    spacing.md + moderateScale(52, 0.35) + Math.max(insets.bottom, spacing.md);
  const [actionBarHeight, setActionBarHeight] = useState(estimatedActionBarHeight);
  const cartGap = spacing.sm;
  const floatingCartOffset = actionBarHeight + cartGap;
  const scrollBottomPad =
    actionBarHeight +
    (totalItems > 0 ? FLOATING_CART_BAR_HEIGHT + cartGap : 0) +
    spacing.lg;

  const handleAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (medicine) addProduct(medicine);
  }, [medicine, addProduct]);

  const handleRemove = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    decrement(productId);
  }, [decrement, productId]);

  const openCart = useCallback(() => {
    navigation.navigate('Main', { screen: 'Cart' });
  }, [navigation]);

  const openSimilar = useCallback(
    (id: string) => {
      navigation.push('ProductDetails', { productId: id });
    },
    [navigation],
  );

  const discountPercent = useMemo(() => {
    if (!medicine?.originalPrice || medicine.originalPrice <= medicine.price) return 0;
    return Math.round(((medicine.originalPrice - medicine.price) / medicine.originalPrice) * 100);
  }, [medicine?.price, medicine?.originalPrice]);

  const savingsAmount = useMemo(() => {
    if (!medicine?.originalPrice || medicine.originalPrice <= medicine.price) return null;
    return (medicine.originalPrice - medicine.price).toFixed(2);
  }, [medicine?.price, medicine?.originalPrice]);

  if (loading) {
    return (
      <>
        <ExpoStatusBar style="dark" />
        <MedicineDetailsLoader onBack={() => navigation.goBack()} />
      </>
    );
  }

  if (error || !medicine) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor: colors.background }]}>
        <ExpoStatusBar style="dark" />
        <Ionicons name="alert-circle-outline" size={54} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {error ?? t('product.notFound')}
        </Text>
        <Pressable
          onPress={() => (error ? refetch() : navigation.goBack())}
          style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.emptyBtnText}>
            {error ? t('common.retry') : t('product.goBack')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: '#F8FAFC' }]}>
      <ExpoStatusBar style="dark" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: scrollBottomPad,
        }}
        bounces={Platform.OS === 'ios'}
      >
        {/* Hero Gallery with rounded container */}
        <View style={styles.heroWrapper}>
          <ProductImageGallery
            images={medicine.images}
            fallbackImage={medicine.image}
            height={HERO_HEIGHT}
            topInset={topInset + spacing.lg}
          />

          {/* Discount badge overlay */}
          {discountPercent > 0 ? (
            <View
              style={[
                styles.discountBadgeHero,
                {
                  top: topInset + spacing.xl + 44,
                  backgroundColor: colors.successLight,
                },
              ]}
            >
              <Text style={[styles.discountBadgeHeroText, { color: colors.success }]}>
                {discountPercent}% OFF
              </Text>
            </View>
          ) : null}
        </View>

        {/* Content Body */}
        <Animated.View entering={FadeInUp.duration(360)} style={styles.body}>
          {/* Main Info & Price Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
                borderRadius: borderRadius.xl,
              },
              shadows.sm,
            ]}
          >
            {/* Category / Form Tags */}
            {medicine.form || medicine.isFeatured ? (
              <View style={styles.tagRow}>
                {medicine.form ? (
                  <View
                    style={[
                      styles.tagPill,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}
                  >
                    <Ionicons name="fitness-outline" size={11} color={colors.textSecondary} />
                    <Text style={[styles.tagPillText, { color: colors.textSecondary }]}>
                      {medicine.form.toUpperCase()}
                    </Text>
                  </View>
                ) : null}

                {medicine.isFeatured ? (
                  <View style={[styles.tagPill, { backgroundColor: '#FDF2F8' }]}>
                    <Ionicons name="sparkles" size={11} color={colors.primary} />
                    <Text style={[styles.tagPillText, { color: colors.primary }]}>
                      FEATURED
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Medicine Name */}
            <Text style={[styles.name, { color: colors.textPrimary }]}>
              {medicine.name}
            </Text>

            {/* Generic / Salt Name */}
            {medicine.genericName ? (
              <View style={styles.genericRow}>
                <Text style={[styles.genericLabel, { color: colors.textSecondary }]}>
                  Salt:
                </Text>
                <Text style={[styles.genericValue, { color: colors.textPrimary }]}>
                  {medicine.genericName}
                </Text>
              </View>
            ) : null}

            {/* Manufacturer & Distributor */}
            <View style={styles.mfrRow}>
              <Ionicons
                name="business-outline"
                size={moderateScale(13)}
                color={colors.textSecondary}
              />
              <Text style={[styles.mfr, { color: colors.textSecondary }]}>
                By <Text style={styles.mfrBold}>{medicine.manufacturer}</Text>
                {medicine.distributorName ? ` • ${medicine.distributorName}` : ''}
              </Text>
            </View>

            {/* Rating & Packaging Info */}
            <View style={styles.metaRow}>
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={moderateScale(12)} color="#F59E0B" />
                <Text style={styles.ratingText}>{medicine.rating.toFixed(1)}</Text>
              </View>
              <Text style={[styles.reviews, { color: colors.textSecondary }]}>
                {medicine.reviews.toLocaleString()} ratings
              </Text>
              <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
              <View style={styles.unitPill}>
                <Ionicons name="cube-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.unit, { color: colors.textSecondary }]}>
                  {medicine.unit}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            {/* Pricing Section */}
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <Text style={[styles.price, { color: colors.textPrimary }]}>
                  ₹{medicine.price.toFixed(2)}
                </Text>
                {medicine.originalPrice && medicine.originalPrice > medicine.price ? (
                  <Text style={[styles.oldPrice, { color: colors.textMuted }]}>
                    MRP ₹{medicine.originalPrice.toFixed(2)}
                  </Text>
                ) : null}
                {discountPercent > 0 ? (
                  <View style={[styles.savePill, { backgroundColor: colors.successLight }]}>
                    <Text style={[styles.savePillText, { color: colors.success }]}>
                      {discountPercent}% OFF
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.taxRow}>
                <Text style={[styles.taxNote, { color: colors.textMuted }]}>
                  {t('product.inclTaxes')}
                </Text>
                {savingsAmount ? (
                  <Text style={[styles.savingsNote, { color: colors.success }]}>
                    You save ₹{savingsAmount}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Medical Specifications Card */}
          {(medicine.genericName || medicine.strength || medicine.form) ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                  borderRadius: borderRadius.xl,
                },
                shadows.sm,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.cardHeaderIconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="flask-outline" size={17} color="#0284C7" />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Medicine Specifications
                </Text>
              </View>

              <View style={styles.specTable}>
                {medicine.genericName ? (
                  <View style={[styles.specRow, { borderBottomColor: colors.borderLight }]}>
                    <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                      Composition
                    </Text>
                    <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                      {medicine.genericName}
                    </Text>
                  </View>
                ) : null}

                {medicine.strength ? (
                  <View style={[styles.specRow, { borderBottomColor: colors.borderLight }]}>
                    <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                      Strength
                    </Text>
                    <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                      {medicine.strength}
                    </Text>
                  </View>
                ) : null}

                {medicine.form ? (
                  <View style={[styles.specRow, { borderBottomColor: colors.borderLight }]}>
                    <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                      Dosage Form
                    </Text>
                    <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                      {medicine.form}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                    Packaging
                  </Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                    {medicine.unit}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Key Uses Card */}
          {medicine.uses && medicine.uses.length > 0 ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                  borderRadius: borderRadius.xl,
                },
                shadows.sm,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.cardHeaderIconBox, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="medkit-outline" size={17} color={colors.secondary} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  {t('product.keyUses')}
                </Text>
              </View>

              <View style={styles.usesBox}>
                {medicine.uses.map((use, idx) => (
                  <View key={use || idx} style={styles.useRow}>
                    <View style={[styles.useCheckCircle, { backgroundColor: colors.secondaryLight }]}>
                      <Ionicons name="checkmark" size={12} color="#0F766E" />
                    </View>
                    <Text style={[styles.useText, { color: colors.textPrimary }]}>
                      {use}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Highlights Card */}
          {medicine.highlights && medicine.highlights.length > 0 ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                  borderRadius: borderRadius.xl,
                },
                shadows.sm,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.cardHeaderIconBox, { backgroundColor: '#FDF2F8' }]}>
                  <Ionicons name="sparkles-outline" size={17} color={colors.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Product Highlights
                </Text>
              </View>

              <View style={styles.highlightsGrid}>
                {medicine.highlights.map((h, index) => (
                  <View
                    key={h.label || index}
                    style={[
                      styles.highlightItem,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}
                  >
                    <View
                      style={[
                        styles.highlightIcon,
                        { backgroundColor: '#FFFFFF' },
                      ]}
                    >
                      <Ionicons
                        name={(h.icon as keyof typeof Ionicons.glyphMap) || 'checkmark-circle-outline'}
                        size={moderateScale(18)}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={[styles.highlightLabel, { color: colors.textPrimary }]}>
                      {h.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Description Card */}
          {medicine.description ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                  borderRadius: borderRadius.xl,
                },
                shadows.sm,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.cardHeaderIconBox, { backgroundColor: colors.surfaceSecondary }]}>
                  <Ionicons name="information-circle-outline" size={17} color={colors.textSecondary} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  {t('product.about')}
                </Text>
              </View>

              <Text
                numberOfLines={isDescExpanded ? undefined : 4}
                style={[styles.description, { color: colors.textSecondary }]}
              >
                {medicine.description}
              </Text>

              {medicine.description.length > 160 ? (
                <Pressable
                  onPress={() => setIsDescExpanded((prev) => !prev)}
                  style={styles.readMoreBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.readMoreText, { color: colors.primary }]}>
                    {isDescExpanded ? 'Read Less' : 'Read More'}
                  </Text>
                  <Ionicons
                    name={isDescExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.primary}
                  />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Sneheal Quality Assurance Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
                borderRadius: borderRadius.xl,
              },
              shadows.sm,
            ]}
          >
            <View style={styles.qualityHeader}>
              <View style={[styles.qualityHeaderIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="shield-checkmark" size={19} color={colors.secondary} />
              </View>
              <View style={styles.qualityTitleCol}>
                <Text style={[styles.qualityTitle, { color: colors.textPrimary }]}>
                  Sneheal Quality Promise
                </Text>
                <Text style={[styles.qualitySubtitle, { color: colors.textSecondary }]}>
                  Clinical-grade safety & handling standards
                </Text>
              </View>
            </View>

            <View style={styles.qualityPillars}>
              <View
                style={[
                  styles.qualityPillarCard,
                  { backgroundColor: '#F8FAFC', borderColor: colors.borderLight },
                ]}
              >
                <View style={[styles.qualityPillarIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="ribbon" size={18} color="#4F46E5" />
                </View>
                <View style={styles.qualityPillarBody}>
                  <Text style={[styles.qualityPillarTitle, { color: colors.textPrimary }]}>
                    Certified Authentic
                  </Text>
                  <Text style={[styles.qualityPillarDesc, { color: colors.textSecondary }]}>
                    Procured directly from verified pharmaceutical distributors with full batch traceability.
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.qualityPillarCard,
                  { backgroundColor: '#F8FAFC', borderColor: colors.borderLight },
                ]}
              >
                <View style={[styles.qualityPillarIcon, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="snow" size={18} color="#0284C7" />
                </View>
                <View style={styles.qualityPillarBody}>
                  <Text style={[styles.qualityPillarTitle, { color: colors.textPrimary }]}>
                    Potency Protected
                  </Text>
                  <Text style={[styles.qualityPillarDesc, { color: colors.textSecondary }]}>
                    Stored and handled in humidity and temperature regulated pharmacy hubs.
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.qualityPillarCard,
                  { backgroundColor: '#F8FAFC', borderColor: colors.borderLight },
                ]}
              >
                <View style={[styles.qualityPillarIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="checkmark-done-circle" size={19} color="#15803D" />
                </View>
                <View style={styles.qualityPillarBody}>
                  <Text style={[styles.qualityPillarTitle, { color: colors.textPrimary }]}>
                    Pharmacist Supervised
                  </Text>
                  <Text style={[styles.qualityPillarDesc, { color: colors.textSecondary }]}>
                    Every medicine undergoes safety audit and expiry verification prior to dispatch.
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.qualityFooter, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="lock-closed" size={12} color={colors.textSecondary} />
              <Text style={[styles.qualityFooterText, { color: colors.textSecondary }]}>
                Tamper-Proof Packaging • Expiry & Quality Guaranteed
              </Text>
            </View>
          </View>

          {/* Similar Items Section */}
          <SimilarItems productId={productId} onPressItem={openSimilar} />
        </Animated.View>
      </ScrollView>

      {/* Floating Top Header Navigation */}
      <View style={[styles.topHeader, { top: topInset + spacing.xs }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.floatingBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={21} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.topRightActions}>
          <Pressable
            onPress={openCart}
            style={styles.floatingBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="View cart"
            accessibilityRole="button"
          >
            <Ionicons name="cart-outline" size={22} color={colors.textPrimary} />
            {totalItems > 0 ? (
              <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.cartBadgeText}>
                  {totalItems > 99 ? '99+' : totalItems}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* Sticky Bottom Action Bar */}
      <Animated.View
        entering={FadeInDown.duration(360)}
        onLayout={(event) => {
          const next = event.nativeEvent.layout.height;
          setActionBarHeight((prev) => (Math.abs(prev - next) < 1 ? prev : next));
        }}
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, spacing.md),
            backgroundColor: colors.white,
            borderTopColor: colors.borderLight,
          },
        ]}
      >
        <View style={styles.bottomPrice}>
          <Text style={[styles.bottomPriceLabel, { color: colors.textSecondary }]}>
            TOTAL PRICE
          </Text>
          <View style={styles.bottomPriceRow}>
            <Text style={[styles.bottomPriceValue, { color: colors.textPrimary }]}>
              ₹{((quantity > 0 ? quantity : 1) * medicine.price).toFixed(2)}
            </Text>
            <Text style={[styles.bottomPriceUnit, { color: colors.textMuted }]}>
              /{medicine.unit}
            </Text>
          </View>
        </View>

        <QuantityStepper
          size="lg"
          reserveSlot={false}
          quantity={quantity}
          onIncrement={handleAdd}
          onDecrement={handleRemove}
        />
      </Animated.View>

      <FloatingCartBar
        totalItems={totalItems}
        previewImages={previewImages}
        onPress={openCart}
        bottomOffset={floatingCartOffset}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  heroWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  discountBadgeHero: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountBadgeHeroText: {
    fontSize: 12,
    fontWeight: '800',
  },
  topHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 12,
  },
  card: {
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  genericRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  genericLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  genericValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  mfrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  mfr: {
    fontSize: 13,
    fontWeight: '500',
  },
  mfrBold: {
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  reviews: {
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  unitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unit: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  priceContainer: {
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  oldPrice: {
    fontSize: 15,
    textDecorationLine: 'line-through',
  },
  savePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  savePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  taxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  taxNote: {
    fontSize: 11,
  },
  savingsNote: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardHeaderIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  specTable: {
    gap: 8,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    gap: 12,
  },
  specLabel: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 0,
    lineHeight: 18,
  },
  specValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    lineHeight: 18,
  },
  usesBox: {
    gap: 10,
  },
  useRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  useCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  useText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  highlightItem: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
  },
  highlightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  description: {
    fontSize: 13.5,
    lineHeight: 21,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  qualityHeaderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityTitleCol: {
    flex: 1,
  },
  qualityTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  qualitySubtitle: {
    fontSize: 11.5,
    marginTop: 1,
    fontWeight: '500',
  },
  qualityPillars: {
    gap: 10,
  },
  qualityPillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  qualityPillarIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityPillarBody: {
    flex: 1,
    gap: 2,
  },
  qualityPillarTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  qualityPillarDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  qualityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  qualityFooterText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    minHeight: 68,
    borderTopWidth: 1,
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
    justifyContent: 'center',
  },
  bottomPriceLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bottomPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  bottomPriceValue: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  bottomPriceUnit: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default ProductDetailsScreen;
