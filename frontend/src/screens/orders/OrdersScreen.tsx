import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/common/ScreenHeader';
import OrderLoader from '@/components/orders/OrderLoader';
import OrderCard from '@/components/orders/OrderCard';
import {
  isActiveOrderStatus,
  matchesOrderFilter,
  type OrderFilter,
} from '@/components/orders/orderStatusMeta';
import { fetchOrders, peekOrdersCache } from '@/services/orderService';
import { ApiError } from '@/services/apiClient';
import { getTabBarHeight } from '@/navigation/tabBarConfig';
import { useTheme } from '@/hooks/useTheme';
import type { OrderListItem } from '@/types/order.types';
import type { AuthStackParamList, TabScreenProps } from '@/navigation/types';

const NO_ORDERS_PIC = require('../../../assets/images/No-Orders-Pic.webp');
const PAGE_BG = '#F5F6F8';

const OrdersScreen = (_props: TabScreenProps<'Orders'>) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const tabBarHeight = getTabBarHeight(insets.bottom);
  const cached = peekOrdersCache();
  const [orders, setOrders] = useState<OrderListItem[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderFilter>('active');

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

  const visibleOrders = useMemo(
    () => orders.filter((order) => order.status !== 'cancelled'),
    [orders],
  );

  const activeCount = useMemo(
    () => visibleOrders.filter((order) => isActiveOrderStatus(order.status)).length,
    [visibleOrders],
  );

  const deliveredCount = useMemo(
    () => visibleOrders.filter((order) => order.status === 'delivered').length,
    [visibleOrders],
  );

  const filteredOrders = useMemo(
    () => visibleOrders.filter((order) => matchesOrderFilter(order.status, filter)),
    [filter, visibleOrders],
  );

  const renderItem = useCallback(
    ({ item }: { item: OrderListItem }) => (
      <OrderCard order={item} onPress={openDetail} />
    ),
    [openDetail],
  );

  const goShop = useCallback(() => {
    navigation.navigate('Home' as never);
  }, [navigation]);

  const listHeader = useMemo(() => {
    if (loading && visibleOrders.length === 0) return null;

    const tabs: { key: OrderFilter; label: string; count: number }[] = [
      { key: 'active', label: t('orders.filters.active'), count: activeCount },
      { key: 'delivered', label: t('orders.filters.delivered'), count: deliveredCount },
    ];

    return (
      <View style={styles.headerBlock}>
        <View style={styles.segmented}>
          {tabs.map((tab) => {
            const selected = filter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                style={({ pressed }) => [
                  styles.segment,
                  selected && [styles.segmentOn, { backgroundColor: colors.white }],
                  pressed && styles.segmentPressed,
                ]}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextOn]}>
                  {tab.label}
                </Text>
                {tab.count > 0 ? (
                  <View style={[styles.countBadge, selected && styles.countBadgeOn]}>
                    <Text style={[styles.countText, selected && styles.countTextOn]}>
                      {tab.count}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }, [
    activeCount,
    colors.white,
    deliveredCount,
    filter,
    loading,
    t,
    visibleOrders.length,
  ]);

  const emptyComponent = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loaderWrap}>
          <OrderLoader />
          <Text style={styles.loadingText}>{t('orders.loading')}</Text>
        </View>
      );
    }

    const isFilteredEmpty = visibleOrders.length > 0 && filteredOrders.length === 0;

    return (
      <View style={styles.emptyState}>
        <Image source={NO_ORDERS_PIC} style={styles.emptyImage} resizeMode="contain" />
        <Text style={styles.emptyTitle}>
          {error ||
            (isFilteredEmpty
              ? filter === 'active'
                ? t('orders.emptyActive')
                : t('orders.emptyDelivered')
              : t('orders.empty'))}
        </Text>
        <Text style={styles.emptySubtitle}>
          {error ? t('orders.emptyErrorHint') : t('orders.emptySubtitle')}
        </Text>
        {!error && visibleOrders.length === 0 ? (
          <Pressable
            onPress={goShop}
            style={({ pressed }) => [styles.shopBtn, pressed && styles.shopBtnPressed]}
          >
            <Ionicons name="bag-handle-outline" size={18} color={colors.white} />
            <Text style={styles.shopBtnText}>{t('orders.shopNow')}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }, [
    colors.white,
    error,
    filter,
    filteredOrders.length,
    goShop,
    loading,
    t,
    visibleOrders.length,
  ]);

  return (
    <View style={styles.root}>
      <ScreenHeader title={t('orders.title')} subtitle={t('orders.subtitle')} />

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={listHeader}
        contentContainerStyle={[
          styles.list,
          filteredOrders.length === 0 && styles.listEmpty,
          { paddingBottom: tabBarHeight + spacing.lg },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={emptyComponent}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  listEmpty: {
    flexGrow: 1,
  },
  headerBlock: {
    marginBottom: 8,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#E8ECF0',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentOn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentPressed: {
    opacity: 0.9,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextOn: {
    color: '#111152',
    fontWeight: '700',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(100,116,139,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeOn: {
    backgroundColor: '#EEF0FF',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  countTextOn: {
    color: '#111152',
  },
  loaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    paddingTop: 24,
  },
  emptyImage: {
    width: 220,
    height: 220,
    marginBottom: 8,
    opacity: 0.9,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: '#111152',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopBtnPressed: {
    opacity: 0.9,
  },
  shopBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

export default OrdersScreen;
