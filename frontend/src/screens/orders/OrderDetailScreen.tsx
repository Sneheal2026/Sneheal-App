import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OrderLoader from '@/components/orders/OrderLoader';
import OrderStatusPanel from '@/components/orders/OrderStatusPanel';
import { useLiveOrderStatus } from '@/hooks/useLiveOrderStatus';
import { fetchOrderById } from '@/services/orderService';
import { ApiError } from '@/services/apiClient';
import { formatInr } from '@/utils/cartBilling';
import { resolveCatalogImage } from '@/utils/productImage';
import type { OrderDetail } from '@/types/order.types';
import type { AuthStackParamList } from '@/navigation/types';
import theme from '@/styles/theme';

const { colors, spacing, typography } = theme;
const PAGE_BG = '#F6F8FB';
const NAVY = '#111152';
const MINT = '#ECFDF5';
const MINT_TEXT = '#047857';
const SKY = '#EFF6FF';
const SKY_ICON = '#2563EB';
const LAVENDER = '#F4F5FF';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'OrderDetail'>;
type Rt = RouteProp<AuthStackParamList, 'OrderDetail'>;

const OrderDetailScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (force) setRefreshing(true);
      try {
        const data = await fetchOrderById(params.orderId);
        setOrder(data);
        setError(null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t('orders.loadFailed'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [params.orderId, t],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const liveStatus = useLiveOrderStatus(params.orderId, order?.status ?? 'confirmed');

  if (loading && !order) {
    return (
      <View style={styles.centered}>
        <OrderLoader />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error || t('orders.loadFailed')}</Text>
      </View>
    );
  }

  const paid = order.paymentStatus === 'paid';
  const addressParts = [order.address.flatNumber, order.address.addressLine, order.address.landmark]
    .filter((part, index, list) => {
      const value = part?.trim();
      if (!value) return false;
      return list.findIndex((other) => other?.trim() === value) === index;
    });

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <OrderStatusPanel
          publicId={order.publicId}
          grandTotal={order.grandTotal}
          paymentStatus={order.paymentStatus}
          status={liveStatus}
          showClose
          onClose={() => navigation.goBack()}
        />

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
                  <Text style={styles.paidPillText}>{t('orders.status.paid')}</Text>
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
              <View key={item.id} style={[styles.itemRow, index > 0 && styles.itemGap]}>
                <Image source={resolveCatalogImage(item.imageUrl)} style={styles.thumb} />
                <View style={styles.itemCopy}>
                  <Text style={styles.primary} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.secondary}>
                    {item.quantity} × {formatInr(item.unitPrice)}
                  </Text>
                </View>
                <Text style={styles.lineTotal}>{formatInr(item.lineTotal)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: PAGE_BG,
  },
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
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
});

export default OrderDetailScreen;
