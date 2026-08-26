import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/common/ScreenHeader';
import { fetchOrders, peekOrdersCache } from '@/services/orderService';
import { ApiError } from '@/services/apiClient';
import { formatInr } from '@/utils/cartBilling';
import { getTabBarHeight } from '@/navigation/tabBarConfig';
import type { OrderListItem } from '@/types/order.types';
import type { AuthStackParamList, TabScreenProps } from '@/navigation/types';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, moderateScale, shadows } = theme;

const NO_ORDERS_PIC = require('../../../assets/images/No-Orders-Pic.webp');
const PAGE_BG = '#F5F6F8';
const CART_GREEN = '#111152';

const OrdersScreen = (_props: TabScreenProps<'Orders'>) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(insets.bottom);
  const cached = peekOrdersCache();
  const [orders, setOrders] = useState<OrderListItem[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    const cachedRows = peekOrdersCache();
    if (force) setRefreshing(true);
    else if (!cachedRows) setLoading(true);

    try {
      const data = await fetchOrders({ force });
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('orders.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openDetail = useCallback(
    (orderId: string) => {
      const parent = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
      parent?.navigate('OrderDetail', { orderId });
    },
    [navigation],
  );

  const statusKey = (order: OrderListItem) => order.status;

  return (
    <View style={styles.root}>
      <ScreenHeader title={t('orders.title')} subtitle={t('orders.subtitle')} />

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          orders.length === 0 && styles.listEmpty,
          { paddingBottom: tabBarHeight + spacing.lg },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
        ListEmptyComponent={
          loading ? (
            <Text style={styles.emptyText}>{t('common.loading')}</Text>
          ) : (
            <View style={styles.emptyState}>
              <Image source={NO_ORDERS_PIC} style={styles.emptyImage} resizeMode="contain" />
              <Text style={styles.emptyText}>{error || t('orders.empty')}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openDetail(item.id)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.cardTop}>
              <Text style={styles.publicId}>{item.publicId}</Text>
              <Text style={styles.chip}>{t(`orders.status.${statusKey(item)}`)}</Text>
            </View>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.firstItemName}
              {item.itemCount > 1
                ? ` + ${item.itemCount - 1}`
                : ''}
            </Text>
            <View style={styles.cardBottom}>
              <Text style={styles.meta}>
                {new Date(item.createdAt).toLocaleDateString()} · {t('cart.itemCount', { count: item.itemCount })}
              </Text>
              <Text style={styles.total}>{formatInr(item.grandTotal)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  listEmpty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    width: '100%',
    maxWidth: moderateScale(320, 0.35),
  },
  emptyImage: {
    width: moderateScale(280, 0.35),
    height: moderateScale(280, 0.35),
    marginBottom: spacing.xs,
    opacity: 0.95,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.88,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  publicId: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: CART_GREEN,
  },
  chip: {
    ...typography.caption,
    fontWeight: '700',
    color: CART_GREEN,
    backgroundColor: '#EEF0FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
  itemName: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  total: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.textPrimary,
  },
});

export default OrdersScreen;
