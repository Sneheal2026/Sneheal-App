import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/common/ScreenHeader';
import { CartBilling, CartItemRow, type BillLine } from '@/components/cart';
import { useCart } from '@/context/CartContext';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import { computeCartBill, formatInr } from '@/utils/cartBilling';
import { resolveCatalogImage } from '@/utils/productImage';
import { getTabBarHeight } from '@/navigation/tabBarConfig';
import { createCheckoutOrder, seedOrderInCache } from '@/services/orderService';
import { ApiError } from '@/services/apiClient';
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
  const { lines, totalItems, increment, decrement, clearCart } = useCart();
  const { selectedAddress, addresses, refresh } = useSavedAddresses();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh(false);
    }, [refresh]),
  );

  const bill = useMemo(() => computeCartBill(lines), [lines]);

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
        label: t('cart.snehealDiscount'),
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

  const openAddresses = useCallback(() => {
    const parent = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
    if (addresses.length > 0) {
      parent?.navigate('SavedAddresses');
      return;
    }
    parent?.navigate('LocationMap', { returnTo: 'Main' });
  }, [navigation, addresses.length]);

  const openShop = useCallback(() => {
    tabNavigation.navigate('Home');
  }, [tabNavigation]);

  const onPlaceOrder = useCallback(async () => {
    if (submitting) return;
    setError(null);

    if (!selectedAddress) {
      openAddresses();
      return;
    }

    setSubmitting(true);
    try {
      const order = await createCheckoutOrder(
        selectedAddress.id,
        lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      );
      seedOrderInCache(order);
      clearCart();
      const parent = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
      parent?.replace('OrderPlaced', {
        orderId: order.id,
        publicId: order.publicId,
        grandTotal: order.grandTotal,
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t('cart.placeOrderFailed');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [clearCart, lines, navigation, openAddresses, selectedAddress, submitting, t]);

  const subtitle =
    totalItems > 0
      ? t('cart.itemCount', { count: totalItems })
      : t('cart.subtitle');

  return (
    <View style={styles.root}>
      <ScreenHeader title={t('cart.title')} subtitle={subtitle} />

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
              style={({ pressed }) => [styles.addressCard, pressed && styles.pressed]}
            >
              <View style={styles.addressIcon}>
                <Ionicons name="location" size={16} color={CART_GREEN} />
              </View>
              <View style={styles.addressText}>
                <Text style={styles.addressKicker}>
                  {addressTag
                    ? `${t('cart.deliverTo')} ${addressTag}`
                    : t('cart.addAddress')}
                </Text>
                <Text style={styles.addressLine} numberOfLines={1}>
                  {addressLabel ?? t('cart.addAddress')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>

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

            <CartBilling
              lines={billLines}
              savings={bill.savings}
              grandTotal={bill.grandTotal}
            />

            <View style={styles.codCard}>
              <View style={styles.codIcon}>
                <Ionicons name="cash-outline" size={18} color={CART_GREEN} />
              </View>
              <View style={styles.codText}>
                <Text style={styles.codTitle}>{t('cart.codTitle')}</Text>
                <Text style={styles.codHint}>{t('cart.codHint')}</Text>
              </View>
              <View style={styles.codCheck}>
                <Ionicons name="checkmark" size={14} color={colors.white} />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.checkoutBar}>
              <View>
                <Text style={styles.checkoutKicker}>{t('cart.toPay')}</Text>
                <Text style={styles.checkoutTotal}>{formatInr(bill.grandTotal)}</Text>
              </View>
              <Pressable
                onPress={() => {
                  void onPlaceOrder();
                }}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.proceedBtn,
                  pressed && styles.pressed,
                  submitting && styles.proceedDisabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.proceedText}>{t('cart.placeOrder')}</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.white} />
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
      )}
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
  addressText: {
    flex: 1,
    minWidth: 0,
  },
  addressKicker: {
    ...typography.caption,
    fontWeight: '700',
    color: CART_GREEN,
    textTransform: 'capitalize',
  },
  addressLine: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 1,
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
  codCard: {
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
  codIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codText: {
    flex: 1,
    minWidth: 0,
  },
  codTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  codHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  codCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: CART_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '600',
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
  proceedDisabled: {
    opacity: 0.7,
  },
  proceedText: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.white,
  },
});

export default CartScreen;
