import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useCart } from '@/context/CartContext';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import { emptyCartBill, estimateCartBill, formatInr } from '@/utils/cartBilling';
import { createCheckoutOrder, seedOrderInCache } from '@/services/orderService';
import { isLocationServiceable } from '@/utils/serviceableArea';
import { CartLocationWarningModal } from '@/components/cart';
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
  const {
    lines,
    clearCart,
    ready,
    quote,
    quoteLoading,
    quoteError,
    refreshQuote,
    checkoutCouponCode,
    hasRxItems,
    attachedPrescription,
    prescriptionMode,
    isRxFulfilled,
  } = useCart();
  const { selectedAddress, addresses, refresh } = useSavedAddresses();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocationWarning, setShowLocationWarning] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh(false);
      if (lines.length > 0 && (!quote || quoteError)) {
        refreshQuote();
      }
    }, [refresh, lines.length, quote, quoteError, refreshQuote]),
  );

  const bill = useMemo(() => {
    if (quote?.bill) return quote.bill;
    if (lines.length > 0) return estimateCartBill(lines);
    return emptyCartBill();
  }, [quote?.bill, lines]);

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

    if (!isLocationServiceable(selectedAddress.coords, selectedAddress.addressLine)) {
      setShowLocationWarning(true);
      return;
    }

    if (hasRxItems && !isRxFulfilled) {
      Alert.alert(
        t('cart.rxRequiredTitle', 'Doctor Prescription Required'),
        t(
          'cart.rxRequiredAlertBody',
          'Please attach a prescription or select free doctor consultation before placing the order.',
        ),
        [{ text: t('common.ok', 'OK'), onPress: () => navigation.goBack() }],
      );
      return;
    }

    if (lines.length === 0) {
      navigation.goBack();
      return;
    }

    if (!quote) {
      refreshQuote();
      Alert.alert(
        t('cart.networkErrorTitle', 'Connection Needed'),
        t(
          'cart.networkErrorBody',
          'Please ensure internet is connected so we can verify final pricing before placing the order.',
        ),
      );
      return;
    }

    setSubmitting(true);
    try {
      const order = await createCheckoutOrder(
        selectedAddress.id,
        lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        checkoutCouponCode,
        attachedPrescription ? attachedPrescription.id : null,
        prescriptionMode === 'doctor_call' ? 'doctor_consultation' : 'upload',
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
        err instanceof ApiError && err.status === 401
          ? t('auth.sessionExpiredBody')
          : err instanceof ApiError
            ? err.message
            : t('cart.placeOrderFailed');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [
    clearCart,
    lines,
    quote,
    refreshQuote,
    navigation,
    openAddresses,
    checkoutCouponCode,
    selectedAddress,
    submitting,
    hasRxItems,
    attachedPrescription,
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

        {prescriptionMode === 'doctor_call' ? (
          <Animated.View entering={FadeInDown.delay(140).duration(280)} style={styles.rxDoctorSummaryCard}>
            <View style={styles.rxDoctorSummaryIconWrap}>
              <Ionicons name="call" size={20} color="#0F766E" />
            </View>
            <View style={styles.rxSummaryInfo}>
              <View style={styles.rxSummaryTitleRow}>
                <Ionicons name="checkmark-circle" size={16} color="#0D9488" />
                <Text style={[styles.rxSummaryTitle, { color: '#0F766E' }]}>
                  {t('cart.doctorCallScheduled', 'Doctor Call Scheduled')}
                </Text>
              </View>
              <Text style={[styles.rxSummarySub, { color: '#115E59' }]}>
                {t(
                  'cart.doctorCallNotice',
                  'Our certified doctor will call you to confirm symptoms & prescribe medicines for FREE.',
                )}
              </Text>
            </View>
          </Animated.View>
        ) : attachedPrescription ? (
          <Animated.View entering={FadeInDown.delay(140).duration(280)} style={styles.rxSummaryCard}>
            <Image source={{ uri: attachedPrescription.imageUrl }} style={styles.rxSummaryThumb} />
            <View style={styles.rxSummaryInfo}>
              <View style={styles.rxSummaryTitleRow}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.rxSummaryTitle}>
                  {t('cart.prescriptionAttached', 'Prescription Attached')}
                </Text>
              </View>
              <Text style={styles.rxSummarySub}>
                {t(
                  'cart.pharmacistReviewNotice',
                  'A registered pharmacist will verify your prescription before dispatch.',
                )}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(160).duration(280)} style={styles.complianceCard}>
          <Ionicons name="medical-outline" size={16} color="#4B5563" />
          <Text style={styles.complianceText}>
            {t(
              'cart.legalPharmacyNotice',
              'Fulfilled by licensed retail pharmacy partners under Form 20/21. All prescription medicines are verified by a registered pharmacist before delivery.',
            )}
          </Text>
        </Animated.View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom:
              Math.max(insets.bottom, spacing.md) + (Platform.OS === 'android' ? 12 : 0),
          },
        ]}
      >
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
            disabled={submitting || quoteLoading || !quote}
            style={({ pressed }) => [
              styles.placeBtn,
              pressed && styles.pressed,
              (submitting || quoteLoading || !quote) && styles.placeDisabled,
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
      <CartLocationWarningModal
        visible={showLocationWarning}
        onClose={() => setShowLocationWarning(false)}
        onChangeAddress={() => {
          setShowLocationWarning(false);
          openAddresses();
        }}
        selectedAddressText={selectedAddress?.addressLine}
      />
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
  rxSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  rxDoctorSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  rxDoctorSummaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxSummaryThumb: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: '#E5E7EB',
  },
  rxSummaryInfo: {
    flex: 1,
    minWidth: 0,
  },
  rxSummaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rxSummaryTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: '#065F46',
  },
  rxSummarySub: {
    ...typography.caption,
    color: '#047857',
    marginTop: 2,
    lineHeight: 15,
  },
  complianceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  complianceText: {
    ...typography.caption,
    color: '#4B5563',
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
