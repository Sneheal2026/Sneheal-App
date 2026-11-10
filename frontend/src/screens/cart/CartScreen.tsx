import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/common/ScreenHeader';
import HeaderHomeButton from '@/components/common/HeaderHomeButton';
import {
  CartBilling,
  CartItemRow,
  CartOffersSection,
  CouponAutoApplyToast,
  CartLocationWarningModal,
  type BillLine,
} from '@/components/cart';
import { useCart } from '@/context/CartContext';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import { emptyCartBill, formatInr } from '@/utils/cartBilling';
import { resolveCatalogImage } from '@/utils/productImage';
import { getTabBarHeight } from '@/navigation/tabBarConfig';
import { isLocationServiceable } from '@/utils/serviceableArea';
import type { AuthStackParamList, TabScreenProps } from '@/navigation/types';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, moderateScale, shadows } = theme;

const CART_EMPTY_PIC = require('../../../assets/images/Cart-Empty-Pic.webp');
const PAGE_BG = '#F5F6F8';
const CART_GREEN = '#111152';

const CartScreen = ({ navigation: tabNavigation }: TabScreenProps<'Cart'>) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(insets.bottom);
  const {
    lines,
    totalItems,
    increment,
    decrement,
    quote,
    quoteLoading,
    couponDraft,
    setCouponDraft,
    applyCouponDraft,
    clearCoupon,
    couponApplyError,
    couponApplying,
    autoApplyToast,
    dismissAutoApplyToast,
    quoteError,
  } = useCart();
  const { selectedAddress, addresses, refresh } = useSavedAddresses();
  const [addressMissing, setAddressMissing] = useState(false);
  const [showLocationWarning, setShowLocationWarning] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh(false);
    }, [refresh]),
  );

  const bill = quote?.bill ?? emptyCartBill();

  const billLines = useMemo<BillLine[]>(() => {
    const rows: BillLine[] = [
      {
        label: t('cart.itemTotal'),
        value: formatInr(bill.itemDiscount > 0 ? bill.itemMrp : bill.itemSelling),
      },
    ];

    if (bill.itemDiscount > 0) {
      rows.push({
        label: t('cart.discount'),
        value: `- ${formatInr(bill.itemDiscount)}`,
        highlight: true,
      });
    }

    if (bill.promoDiscount > 0) {
      rows.push({
        label: bill.appliedCartPromotion?.title ?? t('cart.snehealDiscount'),
        value: `- ${formatInr(bill.promoDiscount)}`,
        highlight: true,
      });
    }

    rows.push({
      label: t('cart.handling'),
      value: formatInr(bill.handlingFee),
    });

    rows.push({
      label: t('cart.delivery'),
      value: bill.deliveryFree ? t('cart.free') : formatInr(bill.deliveryFee),
      strikethrough: bill.deliveryFree ? formatInr(bill.deliveryOriginal) : undefined,
      free: bill.deliveryFree,
    });

    rows.push({
      label: t('cart.gst'),
      value: formatInr(bill.gstOnFees),
    });

    return rows;
  }, [bill, t]);

  const addressLabel = selectedAddress?.addressLine;
  const addressTag = selectedAddress
    ? selectedAddress.type === 'other'
      ? selectedAddress.customTypeLabel || 'Other'
      : selectedAddress.type.charAt(0).toUpperCase() + selectedAddress.type.slice(1)
    : null;

  const isAddressServiceable = useMemo(() => {
    if (!selectedAddress) return true;
    return isLocationServiceable(selectedAddress.coords, selectedAddress.addressLine);
  }, [selectedAddress]);

  useEffect(() => {
    if (selectedAddress) setAddressMissing(false);
  }, [selectedAddress]);

  const openAddresses = useCallback(() => {
    const parent = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
    if (addresses.length > 0) {
      parent?.navigate('SavedAddresses');
      return;
    }
    parent?.navigate('LocationMap', { returnTo: 'Main' });
  }, [navigation, addresses.length]);

  const goHome = useCallback(() => {
    tabNavigation.navigate('Home');
  }, [tabNavigation]);

  const openShop = useCallback(() => {
    goHome();
  }, [goHome]);

  const isUpdating = quoteLoading || couponApplying;
  const isContinueDisabled = isUpdating || lines.length === 0;

  const onContinue = useCallback(() => {
    if (isContinueDisabled) return;

    if (!selectedAddress) {
      setAddressMissing(true);
      Alert.alert(t('cart.addressRequiredTitle'), t('cart.addressRequiredBody'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('cart.addAddress'), onPress: openAddresses },
      ]);
      return;
    }

    if (!isLocationServiceable(selectedAddress.coords, selectedAddress.addressLine)) {
      setShowLocationWarning(true);
      return;
    }

    const parent = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
    parent?.navigate('PaymentMethod');
  }, [isContinueDisabled, navigation, openAddresses, selectedAddress, t]);

  const subtitle =
    totalItems > 0
      ? t('cart.itemCount', { count: totalItems })
      : t('cart.subtitle');

  return (
    <View style={styles.root}>
      <CouponAutoApplyToast
        visible={autoApplyToast != null}
        payload={autoApplyToast}
        onDismiss={dismissAutoApplyToast}
      />
      <ScreenHeader
        title={t('cart.title')}
        subtitle={subtitle}
        rightElement={<HeaderHomeButton onPress={goHome} />}
      />

      {lines.length === 0 ? (
        <View style={[styles.emptyWrap, { paddingBottom: tabBarHeight }]}>
          <View style={styles.emptyState}>
            <Image source={CART_EMPTY_PIC} style={styles.emptyImage} resizeMode="contain" />
            <Text style={styles.emptyText}>{t('cart.empty')}</Text>
            <Text style={styles.emptyHint}>{t('cart.emptyHint')}</Text>
            <Pressable
              onPress={openShop}
              style={({ pressed }) => [styles.buyBtn, pressed && styles.pressed]}
            >
              <Text style={styles.buyBtnText}>{t('cart.buyMedicines')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: tabBarHeight + spacing.xl },
          ]}
        >
          <Pressable
            onPress={openAddresses}
            style={({ pressed }) => [
              styles.addressCard,
              addressMissing && styles.addressCardWarn,
              !isAddressServiceable && styles.addressCardOutZone,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.addressIcon,
                addressMissing && styles.addressIconWarn,
                !isAddressServiceable && styles.addressIconOutZone,
              ]}
            >
              <Ionicons
                name={
                  addressMissing
                    ? 'alert-circle'
                    : !isAddressServiceable
                    ? 'warning'
                    : 'location'
                }
                size={16}
                color={
                  addressMissing
                    ? colors.error
                    : !isAddressServiceable
                    ? '#D97706'
                    : CART_GREEN
                }
              />
            </View>
            <View style={styles.addressText}>
              <View style={styles.addressKickerRow}>
                <Text
                  style={[
                    styles.addressKicker,
                    addressMissing && styles.addressKickerWarn,
                    !isAddressServiceable && styles.addressKickerOutZone,
                  ]}
                >
                  {addressTag
                    ? `${t('cart.deliverTo')} ${addressTag}`
                    : t('cart.addAddress')}
                </Text>
                {!isAddressServiceable && selectedAddress ? (
                  <View style={styles.outZonePill}>
                    <Text style={styles.outZonePillText}>Outside Zone</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.addressLine} numberOfLines={1}>
                {addressLabel ?? t('cart.addAddress')}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={
                addressMissing
                  ? colors.error
                  : !isAddressServiceable
                  ? '#D97706'
                  : colors.textMuted
              }
            />
          </Pressable>

          {addressMissing ? (
            <Text style={styles.addressWarnText}>{t('cart.addressNeededHint')}</Text>
          ) : null}

          {!isAddressServiceable && selectedAddress ? (
            <Pressable
              onPress={() => setShowLocationWarning(true)}
              style={({ pressed }) => [
                styles.inlineZoneWarning,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Delivery outside serviceable zone. Tap for details."
            >
              <Ionicons name="alert-circle" size={18} color="#D97706" />
              <View style={styles.inlineZoneWarningContent}>
                <Text style={styles.inlineZoneWarningTitle}>
                  Delivery unavailable at this location
                </Text>
                <Text style={styles.inlineZoneWarningAction}>
                  Sneheal delivers in Solapur & Akkalkot only. Tap to change →
                </Text>
              </View>
            </Pressable>
          ) : null}

          <Text style={styles.sectionTitle}>{t('cart.itemsInCart')}</Text>
          <View style={styles.itemsList}>
            {lines.map((line) => (
              <CartItemRow
                key={line.productId}
                name={line.name}
                image={resolveCatalogImage(line.imageUrl)}
                price={line.price}
                originalPrice={line.originalPrice}
                quantity={line.quantity}
                unit={line.unit}
                onIncrement={() => increment(line.productId)}
                onDecrement={() => decrement(line.productId)}
              />
            ))}
          </View>

          <CartOffersSection
            offers={quote?.offers ?? []}
            draftCode={couponDraft}
            onChangeDraftCode={setCouponDraft}
            onApplyCode={applyCouponDraft}
            onClearCode={clearCoupon}
            applyError={couponApplyError}
            applyLoading={couponApplying}
          />

          {quoteError ? (
            <Text style={styles.quoteErrorText}>{quoteError}</Text>
          ) : null}

          <View style={isUpdating ? styles.billingDimmed : undefined}>
            <CartBilling
              lines={billLines}
              savings={bill.savings}
              grandTotal={bill.grandTotal}
            />
          </View>

          <View style={styles.checkoutBar}>
            <View>
              <Text style={styles.checkoutKicker}>{t('cart.toPay')}</Text>
              <View style={styles.totalRowWrap}>
                <Text style={[styles.checkoutTotal, isUpdating && styles.checkoutTotalDimmed]}>
                  {formatInr(bill.grandTotal)}
                </Text>
                {isUpdating ? (
                  <ActivityIndicator size="small" color={CART_GREEN} style={styles.updatingSpinner} />
                ) : null}
              </View>
            </View>
            <Pressable
              onPress={onContinue}
              disabled={isContinueDisabled}
              style={({ pressed }) => [
                styles.proceedBtn,
                isContinueDisabled && styles.proceedBtnDisabled,
                pressed && !isContinueDisabled && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('common.continue')}
              accessibilityState={{ disabled: isContinueDisabled }}
            >
              {isUpdating ? (
                <View style={styles.updatingBtnContent}>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={styles.proceedText}>{t('cart.updating', 'Updating…')}</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.proceedText}>{t('common.continue')}</Text>
                  {/* <Ionicons name="arrow-forward" size={16} color={colors.white} /> */}
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      )}

      <CartLocationWarningModal
        visible={showLocationWarning}
        onClose={() => setShowLocationWarning(false)}
        onChangeAddress={() => {
          setShowLocationWarning(false);
          openAddresses();
        }}
        selectedAddressText={selectedAddress?.addressLine}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    width: '100%',
    maxWidth: moderateScale(320, 0.35),
  },
  emptyImage: {
    width: moderateScale(220, 0.35),
    height: moderateScale(220, 0.35),
    marginBottom: spacing.xs,
    opacity: 0.95,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyHint: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  buyBtn: {
    marginTop: spacing.xl,
    backgroundColor: CART_GREEN,
    paddingVertical: spacing.sm + 6,
    paddingHorizontal: spacing.xxxl,
    borderRadius: borderRadius.lg,
    minWidth: moderateScale(200, 0.35),
    alignItems: 'center',
  },
  buyBtnText: {
    ...typography.body,
    fontWeight: '800',
    color: colors.white,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  addressCardWarn: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  addressCardOutZone: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  pressed: {
    opacity: 0.85,
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressIconWarn: {
    backgroundColor: colors.errorLight,
  },
  addressIconOutZone: {
    backgroundColor: '#FEF3C7',
  },
  addressText: {
    flex: 1,
    minWidth: 0,
  },
  addressKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addressKicker: {
    ...typography.caption,
    fontWeight: '700',
    color: CART_GREEN,
    textTransform: 'capitalize',
  },
  addressKickerWarn: {
    color: colors.error,
  },
  addressKickerOutZone: {
    color: '#D97706',
  },
  outZonePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  outZonePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  addressLine: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 1,
  },
  addressWarnText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
    marginTop: -spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  inlineZoneWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: -spacing.xs,
  },
  inlineZoneWarningContent: {
    flex: 1,
  },
  inlineZoneWarningTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: '#92400E',
  },
  inlineZoneWarningAction: {
    ...typography.caption,
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  itemsList: {
    gap: spacing.sm,
  },
  checkoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  checkoutKicker: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  checkoutTotal: {
    fontSize: moderateScale(18, 0.35),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  proceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CART_GREEN,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
    minWidth: 120,
    justifyContent: 'center',
  },
  proceedText: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.white,
  },
  quoteErrorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  billingDimmed: {
    opacity: 0.6,
  },
  totalRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutTotalDimmed: {
    opacity: 0.45,
  },
  updatingSpinner: {
    marginLeft: 6,
  },
  proceedBtnDisabled: {
    opacity: 0.55,
  },
  updatingBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});

export default CartScreen;
