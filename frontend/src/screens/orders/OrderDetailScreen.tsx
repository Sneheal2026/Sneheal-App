import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Loader from '@/components/common/Loader';
import OrderStatusPanel from '@/components/orders/OrderStatusPanel';
import { fetchOrderById } from '@/services/orderService';
import { ApiError } from '@/services/apiClient';
import { formatInr } from '@/utils/cartBilling';
import { resolveCatalogImage } from '@/utils/productImage';
import type { OrderDetail } from '@/types/order.types';
import type { AuthStackParamList } from '@/navigation/types';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius } = theme;
const PAGE_BG = '#F5F6F8';

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

  if (loading && !order) {
    return (
      <View style={styles.root}>
        <Loader message={t('common.loading')} />
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

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <OrderStatusPanel
          publicId={order.publicId}
          grandTotal={order.grandTotal}
          paymentStatus={order.paymentStatus}
          status={order.status}
          showClose
          onClose={() => navigation.goBack()}
        />

        <View style={styles.body}>
          <Text style={styles.section}>{t('orders.deliverTo')}</Text>
          <View style={styles.card}>
            <Text style={styles.name}>{order.address.receiverName}</Text>
            <Text style={styles.meta}>{order.address.mobile}</Text>
            <Text style={styles.address}>
              {order.address.flatNumber}, {order.address.addressLine}
            </Text>
          </View>

          <Text style={styles.section}>{t('cart.itemsInCart')}</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Image source={resolveCatalogImage(item.imageUrl)} style={styles.thumb} />
              <View style={styles.itemText}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.meta}>
                  {item.quantity} × {formatInr(item.unitPrice)}
                </Text>
              </View>
              <Text style={styles.lineTotal}>{formatInr(item.lineTotal)}</Text>
            </View>
          ))}
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
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  name: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  address: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EEF0FF',
  },
  itemText: { flex: 1, minWidth: 0 },
  lineTotal: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
});

export default OrderDetailScreen;
