import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  BackHandler,
  Platform,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OrderStatusPanel from '@/components/orders/OrderStatusPanel';
import OrderDeliverySupportCard from '@/components/orders/OrderDeliverySupportCard';
import { useLiveOrderStatus } from '@/hooks/useLiveOrderStatus';
import { fetchOrderById } from '@/services/orderService';
import { formatInr } from '@/utils/cartBilling';
import { resolveCatalogImage } from '@/utils/productImage';
import type { OrderDetail } from '@/types/order.types';
import type { AuthStackParamList } from '@/navigation/types';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius } = theme;
const NAVY = '#111152';
const PAGE_BG = '#F6F8FB';
const MINT = '#ECFDF5';
const MINT_TEXT = '#047857';
const SKY = '#EFF6FF';
const SKY_ICON = '#2563EB';
const LAVENDER = '#F4F5FF';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'OrderPlaced'>;
type Rt = RouteProp<AuthStackParamList, 'OrderPlaced'>;

const OrderPlacedScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (force = false) => {
      if (!params?.orderId) return;
      if (force) setRefreshing(true);
      try {
        const data = await fetchOrderById(params.orderId);
        setOrder(data);
      } catch {
        // Fallback silently to params if network glitch
      } finally {
        setRefreshing(false);
      }
    },
    [params?.orderId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const liveStatus = useLiveOrderStatus(
    params?.orderId,
    order?.status ?? 'confirmed',
  );

  const goOrders = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { screen: 'Orders' } }],
    });
  }, [navigation]);

  const goHome = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { screen: 'Home' } }],
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        goOrders();
        return true;
      });
      return () => sub.remove();
    }, [goOrders]),
  );

  const showActiveSupport =
    liveStatus !== 'cancelled' && liveStatus !== 'delivered';
  const showDeliveredSupport = liveStatus === 'delivered';
  const bottomInset = Math.max(insets.bottom, spacing.lg);

  const addressParts = order?.address
    ? [
        order.address.flatNumber,
        order.address.addressLine,
        order.address.landmark,
      ].filter((part, index, list) => {
        const value = part?.trim();
        if (!value) return false;
        return list.findIndex((other) => other?.trim() === value) === index;
      })
    : [];

  const paid = order?.paymentStatus === 'paid';

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
          />
        }
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomInset + spacing.xl },
        ]}
      >
        <OrderStatusPanel
          publicId={order?.publicId ?? params?.publicId ?? ''}
          grandTotal={order?.grandTotal ?? params?.grandTotal ?? 0}
          paymentStatus={order?.paymentStatus ?? 'pending'}
          status={liveStatus}
          showHome
          onHome={goHome}
        />

        {order?.prescriptionMode === 'doctor_consultation' && order?.prescriptionStatus !== 'verified' ? (
          <View style={styles.rxStatusCardDoctor}>
            <View style={styles.rxStatusHeader}>
              <Ionicons name="call" size={18} color="#0D9488" />
              <Text style={[styles.rxStatusTitle, { color: '#0F766E' }]}>
                {t('orders.doctorCallTitle', 'Doctor Consultation Scheduled (FREE)')}
              </Text>
            </View>
            <Text style={[styles.rxStatusBody, { color: '#115E59' }]}>
              {t(
                'orders.doctorCallBody',
                'Our certified doctor will call you shortly on your registered number to review your symptoms and prescribe medicines before dispatch.',
              )}
            </Text>
            <View style={styles.doctorConsultBadgeRow}>
              <View style={styles.doctorConsultChip}>
                <Ionicons name="shield-checkmark" size={13} color="#0D9488" />
                <Text style={styles.doctorConsultChipText}>
                  {t('orders.doctorConsultZeroFee', 'Zero Extra Fee')}
                </Text>
              </View>
              <View style={styles.doctorConsultChip}>
                <Ionicons name="time" size={13} color="#0D9488" />
                <Text style={styles.doctorConsultChipText}>
                  {t('orders.doctorConsultQuickCall', 'Quick Callback')}
                </Text>
              </View>
            </View>
          </View>
        ) : order?.prescriptionStatus === 'pending_verification' ? (
          <View style={styles.rxStatusCardWarning}>
            <View style={styles.rxStatusHeader}>
              <Ionicons name="time" size={18} color="#D97706" />
              <Text style={styles.rxStatusTitle}>
                {t(
                  'orders.rxUnderReviewTitle',
                  'Prescription Under Pharmacist Review',
                )}
              </Text>
            </View>
            <Text style={styles.rxStatusBody}>
              {t(
                'orders.rxUnderReviewBody',
                'Our registered pharmacist is reviewing your uploaded prescription before packing your medicines.',
              )}
            </Text>
            {order.prescriptionUrl ? (
              <View style={styles.rxAttachedThumbRow}>
                <Image
                  source={{ uri: order.prescriptionUrl }}
                  style={styles.rxOrderThumb}
                />
                <Text style={styles.rxAttachedLabel}>
                  {t('orders.rxAttachedLabel', 'Uploaded prescription slip')}
                </Text>
              </View>
            ) : null}
          </View>
        ) : order?.prescriptionStatus === 'verified' ? (
          <View style={styles.rxStatusCardSuccess}>
            <View style={styles.rxStatusHeader}>
              <Ionicons name="shield-checkmark" size={18} color="#059669" />
              <Text style={[styles.rxStatusTitle, { color: '#065F46' }]}>
                {t('orders.rxVerifiedTitle', 'Prescription Verified ✓')}
              </Text>
            </View>
            <Text style={[styles.rxStatusBody, { color: '#047857' }]}>
              {t(
                'orders.rxVerifiedBody',
                'Verified by a registered pharmacist. Your medicines are approved for fulfillment.',
              )}
            </Text>
          </View>
        ) : order?.prescriptionStatus === 'rejected' ? (
          <View style={styles.rxStatusCardRejected}>
            <View style={styles.rxStatusHeader}>
              <Ionicons name="close-circle" size={18} color="#DC2626" />
              <Text style={[styles.rxStatusTitle, { color: '#991B1B' }]}>
                {t('orders.rxRejectedTitle', 'Prescription Rejected')}
              </Text>
            </View>
            <Text style={[styles.rxStatusBody, { color: '#B91C1C' }]}>
              {order.prescriptionRejectedReason ||
                t(
                  'orders.rxRejectedBody',
                  'The uploaded prescription could not be verified. Our pharmacy team will contact you.',
                )}
            </Text>
          </View>
        ) : null}

        {order ? (
          <View style={styles.sheet}>
            <View style={styles.block}>
              <Text style={styles.label}>{t('orders.paymentMethod')}</Text>
              <View style={styles.row}>
                <View style={[styles.iconWell, { backgroundColor: MINT }]}>
                  <Ionicons name="cash-outline" size={18} color={MINT_TEXT} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.primary}>{t('cart.codTitle')}</Text>
                  <Text style={styles.secondary}>
                    {paid ? t('orders.paidAtDelivery') : t('cart.codHint')}
                  </Text>
                </View>
                {paid ? (
                  <View style={styles.paidPill}>
                    <Text style={styles.paidPillText}>
                      {t('orders.status.paid')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.block}>
              <Text style={styles.label}>{t('orders.deliverTo')}</Text>
              <View style={styles.row}>
                <View style={[styles.iconWell, { backgroundColor: SKY }]}>
                  <Ionicons name="home-outline" size={18} color={SKY_ICON} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.primary}>{order.address.receiverName}</Text>
                  <Text style={styles.secondary}>{order.address.mobile}</Text>
                  <Text style={styles.address}>{addressParts.join(', ')}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.block}>
              <Text style={styles.label}>
                {t('cart.itemCount', { count: order.items.length })}
              </Text>
              {order.items.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.itemRow, index > 0 && styles.itemGap]}
                >
                  <Image
                    source={resolveCatalogImage(item.imageUrl)}
                    style={styles.thumb}
                  />
                  <View style={styles.itemCopy}>
                    <Text style={styles.primary} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.secondary}>
                      {item.quantity} × {formatInr(item.unitPrice)}
                    </Text>
                  </View>
                  <Text style={styles.lineTotal}>
                    {formatInr(item.lineTotal)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {showActiveSupport ? (
          <OrderDeliverySupportCard variant="active" />
        ) : null}
        {showDeliveredSupport ? (
          <OrderDeliverySupportCard variant="delivered" />
        ) : null}

        <View style={styles.footer}>
          <Pressable
            onPress={goOrders}
            android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
            style={({ pressed }) => [
              styles.btn,
              pressed && Platform.OS === 'ios' && styles.pressed,
            ]}
          >
            <Text style={styles.btnText}>{t('orders.viewOrders')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },
  scroll: {
    flexGrow: 1,
  },
  footer: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  btn: {
    backgroundColor: NAVY,
    borderRadius: borderRadius.lg,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnText: {
    ...typography.body,
    fontWeight: '800',
    color: colors.white,
  },
  pressed: { opacity: 0.88 },
  sheet: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF1F6',
    overflow: 'hidden',
  },
  block: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  label: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  primary: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  secondary: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 3,
  },
  paidPill: {
    backgroundColor: MINT,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  paidPillText: {
    ...typography.caption,
    fontWeight: '800',
    color: MINT_TEXT,
  },
  address: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E8ECF2',
    marginHorizontal: spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemGap: {
    marginTop: spacing.md,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: LAVENDER,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
  },
  lineTotal: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: NAVY,
  },
  rxStatusCardWarning: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  rxStatusCardDoctor: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  doctorConsultBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  doctorConsultChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  doctorConsultChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  rxStatusCardSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  rxStatusCardRejected: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  rxStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  rxStatusTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: '#92400E',
  },
  rxStatusBody: {
    ...typography.caption,
    color: '#B45309',
    lineHeight: 16,
  },
  rxAttachedThumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  rxOrderThumb: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  rxAttachedLabel: {
    ...typography.caption,
    color: '#78350F',
    fontWeight: '600',
  },
});

export default OrderPlacedScreen;
