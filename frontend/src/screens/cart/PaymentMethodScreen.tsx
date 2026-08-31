import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useCart } from '@/context/CartContext';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import { computeCartBill, formatInr } from '@/utils/cartBilling';
import { createCheckoutOrder, seedOrderInCache } from '@/services/orderService';
import { ApiError } from '@/services/apiClient';
import type { AuthStackParamList } from '@/navigation/types';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, moderateScale, shadows } = theme;
const NAVY = '#111152';
const PAGE_BG = '#F5F6F8';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'PaymentMethod'>;

const PaymentMethodScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { lines, clearCart, ready } = useCart();
  const { selectedAddress, addresses, refresh } = useSavedAddresses();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bill = useMemo(() => computeCartBill(lines), [lines]);

  useFocusEffect(
    useCallback(() => {
      void refresh(false);
    }, [refresh]),
  );

  useEffect(() => {
    if (ready && lines.length === 0 && !submitting) {
      navigation.goBack();
    }
  }, [lines.length, navigation, ready, submitting]);

  const addressTag = selectedAddress
    ? selectedAddress.type === 'other'
      ? selectedAddress.customTypeLabel || t('addresses.typeOther')
      : selectedAddress.type.charAt(0).toUpperCase() + selectedAddress.type.slice(1)
    : null;

  const openAddresses = useCallback(() => {
    if (addresses.length > 0) {
      navigation.navigate('SavedAddresses');
      return;
    }
    navigation.navigate('LocationMap', { returnTo: 'Main' });
  }, [addresses.length, navigation]);

  const onPlaceOrder = useCallback(async () => {
    if (submitting) return;
    setError(null);

    if (!selectedAddress) {
      Alert.alert(t('cart.addressRequiredTitle'), t('cart.addressRequiredBody'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('cart.addAddress'), onPress: openAddresses },
      ]);
      return;
    }

    if (lines.length === 0) {
      navigation.goBack();
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
      navigation.replace('OrderPlaced', {
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
  }, [
    clearCart,
    lines,
    navigation,
    openAddresses,
    selectedAddress,
    submitting,
    t,
  ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('cart.paymentTitle')}</Text>
          <Text style={styles.headerSubtitle}>{t('cart.paymentSubtitle')}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Animated.View entering={FadeInDown.duration(280)}>
          <Pressable
            onPress={openAddresses}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('common.change')}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="location" size={18} color={NAVY} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardKicker}>{t('cart.deliveringTo')}</Text>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {addressTag ?? t('cart.addAddress')}
              </Text>
              <Text style={styles.cardHint} numberOfLines={2}>
                {selectedAddress?.addressLine ?? t('cart.addressNeededHint')}
              </Text>
            </View>
            <Text style={styles.changeLink}>{t('common.change')}</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(70).duration(280)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('cart.paymentMethod')}</Text>

          <View style={styles.methodCard}>
            <View style={styles.methodIcon}>
              <Ionicons name="cash-outline" size={22} color={NAVY} />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.methodTitleRow}>
                <Text style={styles.codTitle}>{t('cart.codTitle')}</Text>
                <View style={styles.selectedPill}>
                  <Text style={styles.selectedPillText}>{t('cart.codSelected')}</Text>
                </View>
              </View>
              <Text style={styles.cardHint}>{t('cart.codHint')}</Text>
              <Text style={styles.codNote}>{t('cart.codNote')}</Text>
            </View>
            <View style={styles.radioOuter}>
              <View style={styles.radioInner} />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(280)} style={styles.trustRow}>
          <Ionicons name="shield-checkmark" size={16} color={NAVY} />
          <Text style={styles.trustText}>{t('cart.codSecureNote')}</Text>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
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
              styles.placeBtn,
              pressed && styles.pressed,
              submitting && styles.placeDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('cart.placeOrder')}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Text style={styles.placeText}>{t('cart.placeOrder')}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.white} />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    ...typography.h4,
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  headerSpacer: {
    width: moderateScale(38),
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: NAVY,
    ...shadows.sm,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardKicker: {
    ...typography.caption,
    fontWeight: '700',
    color: NAVY,
  },
  cardTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 1,
    textTransform: 'capitalize',
  },
  cardHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  changeLink: {
    ...typography.caption,
    fontWeight: '800',
    color: NAVY,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  codTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  selectedPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: '#EEF0FF',
  },
  selectedPillText: {
    ...typography.caption,
    fontWeight: '800',
    color: NAVY,
  },
  codNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: NAVY,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  trustText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    ...shadows.md,
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
    gap: spacing.md,
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
  placeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NAVY,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
    minWidth: 140,
    minHeight: 48,
    justifyContent: 'center',
  },
  placeDisabled: {
    opacity: 0.7,
  },
  placeText: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
});

export default PaymentMethodScreen;
